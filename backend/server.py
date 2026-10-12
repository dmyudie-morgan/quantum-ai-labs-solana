import os
import json
import time
import asyncio
import logging
from contextlib import asynccontextmanager
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Annotated, Optional

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from bson import ObjectId  # noqa: E402
from fastapi import FastAPI, APIRouter, Request, HTTPException, Query, Path as PathParam  # noqa: E402
from fastapi.responses import StreamingResponse, JSONResponse  # noqa: E402
from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

import ai_service  # noqa: E402
import market_service  # noqa: E402
import web3_service  # noqa: E402
from web3_service import UpstreamError  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("qal")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

@asynccontextmanager
async def lifespan(_app):
    yield
    client.close()


app = FastAPI(title="Quantum AI Labs API", lifespan=lifespan)
api = APIRouter(prefix="/api")

SESSION_RE = r"^[A-Za-z0-9_-]{8,64}$"
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self):
        return self.model_dump(by_alias=True, exclude_none=True)

    @classmethod
    def from_mongo(cls, doc):
        return cls.model_validate(doc)


class ChatMessage(BaseDocument):
    session_id: str
    role: str
    content: str
    created_at: str


class ChatIn(BaseModel):
    session_id: str = Field(pattern=SESSION_RE)
    message: str = Field(min_length=1, max_length=4000)


class PromptIn(BaseModel):
    prompt: str = Field(min_length=10, max_length=8000)


class NetworkIn(BaseModel):
    network: str = Field(max_length=32)


class AddressIn(NetworkIn):
    address: str = Field(max_length=64)


class TxIn(NetworkIn):
    hash: str = Field(max_length=80)


class TokenIn(NetworkIn):
    contract: str = Field(max_length=64)
    holder: Optional[str] = Field(default=None, max_length=64)


_hits = defaultdict(deque)


def rate_limit(request: Request, bucket: str, limit: int, window: int = 60):
    fwd = request.headers.get("x-forwarded-for")
    ip = (fwd.split(",")[0] if fwd else (request.client.host if request.client else "unknown")).strip()
    q, now = _hits[(bucket, ip)], time.monotonic()
    while q and now - q[0] > window:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(429, f"Rate limit reached ({limit} requests per {window}s). Please wait a moment.")
    q.append(now)


@app.exception_handler(ValueError)
async def _bad_request(_, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


@app.exception_handler(LookupError)
async def _not_found(_, exc):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(UpstreamError)
async def _upstream(_, exc):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


def sse(obj):
    return f"data: {json.dumps(obj)}\n\n"


def sse_response(gen):
    return StreamingResponse(gen, media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@api.get("/")
async def root():
    return {"service": "Quantum AI Labs API", "status": "ok"}


@api.get("/health")
async def health():
    return {"status": "ok", "ai_available": ai_service.available(), "time": datetime.now(timezone.utc).isoformat()}


# ---------- AI ----------
@api.get("/ai/status")
async def ai_status():
    return ai_service.status()


def _require_ai():
    if not ai_service.available():
        raise HTTPException(503, "No AI provider is configured on this server. Non-AI utilities remain available.")


@api.get("/ai/history/{session_id}")
async def ai_history(session_id: str = PathParam(pattern=SESSION_RE)):
    docs = await db.chat_messages.find({"session_id": session_id}).sort("created_at", 1).limit(200).to_list(200)
    return {"messages": [ChatMessage.from_mongo(d).model_dump(include={"role", "content", "created_at"}) for d in docs]}


@api.delete("/ai/history/{session_id}")
async def ai_clear(session_id: str = PathParam(pattern=SESSION_RE)):
    res = await db.chat_messages.delete_many({"session_id": session_id})
    return {"deleted": res.deleted_count}


@api.post("/ai/chat")
async def ai_chat(body: ChatIn, request: Request):
    rate_limit(request, "ai", 20)
    _require_ai()
    docs = await db.chat_messages.find({"session_id": body.session_id}).sort("created_at", -1).limit(20).to_list(20)
    history = [{"role": m.role, "content": m.content} for m in reversed([ChatMessage.from_mongo(d) for d in docs])]

    async def gen():
        parts = []
        try:
            async for chunk in ai_service.stream(ai_service.CHAT_SYSTEM, history, body.message, body.session_id):
                parts.append(chunk)
                yield sse({"delta": chunk})
        except asyncio.TimeoutError:
            yield sse({"error": "The AI provider timed out. Please retry."})
            return
        except Exception as e:
            logger.exception("AI chat failed")
            yield sse({"error": ai_service.friendly_error(e)})
            return
        reply = "".join(parts).strip()
        if reply:
            now = datetime.now(timezone.utc)
            await db.chat_messages.insert_many([
                ChatMessage(session_id=body.session_id, role="user", content=body.message, created_at=now.isoformat()).to_mongo(),
                ChatMessage(session_id=body.session_id, role="assistant", content=reply,
                            created_at=(now + timedelta(milliseconds=1)).isoformat()).to_mongo(),
            ])
        yield sse({"done": True})

    return sse_response(gen())


@api.post("/ai/prompt")
async def ai_prompt(body: PromptIn, request: Request):
    rate_limit(request, "ai", 20)
    _require_ai()

    async def gen():
        try:
            async for chunk in ai_service.stream(ai_service.PROMPT_SYSTEM, [], body.prompt, f"prompt-{time.time_ns()}"):
                yield sse({"delta": chunk})
        except asyncio.TimeoutError:
            yield sse({"error": "The AI provider timed out. Please retry."})
            return
        except Exception as e:
            logger.exception("AI prompt failed")
            yield sse({"error": ai_service.friendly_error(e)})
            return
        yield sse({"done": True})

    return sse_response(gen())


# ---------- Web3 (read-only public RPC) ----------
@api.get("/web3/networks")
async def web3_networks():
    return {"networks": web3_service.list_networks()}


@api.post("/web3/network-status")
async def web3_status(body: NetworkIn, request: Request):
    rate_limit(request, "web3", 60)
    data = await web3_service.network_status(body.network)
    net = web3_service.NETWORKS[body.network]
    return {**data, "native": await market_service.native_price(net["dex"], net["wrapped"])}


@api.post("/web3/address")
async def web3_address(body: AddressIn, request: Request):
    rate_limit(request, "web3", 60)
    return await web3_service.address_info(body.network, body.address.strip())


@api.post("/web3/tx")
async def web3_tx(body: TxIn, request: Request):
    rate_limit(request, "web3", 60)
    return await web3_service.tx_info(body.network, body.hash.strip())


@api.post("/web3/token")
async def web3_token(body: TokenIn, request: Request):
    rate_limit(request, "web3", 60)
    holder = body.holder.strip() if body.holder and body.holder.strip() else None
    return await web3_service.token_info(body.network, body.contract.strip(), holder)


# ---------- Market data (Dexscreener) ----------
@api.get("/market/chains")
async def market_chains():
    return {"chains": [{"id": k, "label": v} for k, v in market_service.DEX_CHAINS.items()]}


@api.get("/market/token")
async def market_token(request: Request, chain: str = Query(max_length=32), address: str = Query(max_length=64)):
    rate_limit(request, "market", 60)
    return await market_service.token_pairs(chain, address.strip())


@api.get("/market/search")
async def market_search(request: Request, q: str = Query(max_length=64)):
    rate_limit(request, "market", 60)
    return await market_service.search(q)


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

