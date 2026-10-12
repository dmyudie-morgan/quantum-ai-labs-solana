import os
import re
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
import registry_service  # noqa: E402
import web3_service  # noqa: E402
from web3_service import UpstreamError  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("qal")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

@asynccontextmanager
async def lifespan(_app):
    await db.run_records.create_index("fingerprint", unique=True)
    await db.run_records.create_index([("created_at", -1)])
    await db.run_records.create_index([("tool", 1), ("problem_id", 1)])
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


class RegistryEntry(BaseDocument):
    tool: str
    fingerprint: str
    label: Optional[str] = None
    problem_id: Optional[str] = None
    cut_verified: bool = False
    summary: dict
    record: dict
    created_at: str

    def public(self, full=False):
        return self.model_dump(exclude={"id"} | (set() if full else {"record"}))


class PublishIn(BaseModel):
    canonical: str = Field(min_length=2, max_length=registry_service.MAX_CANONICAL)
    fingerprint: str = Field(pattern=r"^[0-9a-f]{64}$")
    label: Optional[str] = Field(default=None, max_length=80)


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


# ---------- Public run registry ----------
@api.post("/registry/publish")
async def registry_publish(body: PublishIn, request: Request):
    rate_limit(request, "registry-publish", 10)
    existing = await db.run_records.find_one({"fingerprint": body.fingerprint})
    if existing:
        return {"entry": RegistryEntry.from_mongo(existing).public(), "already_published": True}
    v = registry_service.verify(body.canonical, body.fingerprint)
    entry = RegistryEntry(tool=v["tool"], fingerprint=body.fingerprint, label=registry_service.clean_label(body.label),
                          problem_id=v["problem_id"], cut_verified=v["cut_verified"], summary=v["summary"], record=v["record"],
                          created_at=datetime.now(timezone.utc).isoformat())
    await db.run_records.insert_one(entry.to_mongo())
    return {"entry": entry.public(), "already_published": False}


def _registry_filter(tool, problem, q):
    f = {}
    if tool in ("quantum-field", "benchmark"):
        f["tool"] = tool
    if problem == "custom":
        f["problem_id"] = None
        f["tool"] = "quantum-field"
    elif problem:
        f["problem_id"] = problem
    q = (q or "").strip()
    if q:
        if re.fullmatch(r"[0-9a-fA-F]{6,64}", q):
            f["fingerprint"] = {"$regex": f"^{q.lower()}"}
        else:
            f["label"] = {"$regex": re.escape(q), "$options": "i"}
    return f


@api.get("/registry")
async def registry_list(request: Request, tool: Optional[str] = Query(default=None, max_length=32),
                        problem: Optional[str] = Query(default=None, max_length=32), q: Optional[str] = Query(default=None, max_length=80),
                        limit: int = Query(default=50, ge=1, le=100)):
    rate_limit(request, "registry", 120)
    f = _registry_filter(tool, problem, q)
    docs = await db.run_records.find(f).sort("created_at", -1).limit(limit).to_list(limit)
    total = await db.run_records.count_documents(f)
    return {"entries": [RegistryEntry.from_mongo(d).public() for d in docs], "total": total}


@api.get("/registry/leaderboard")
async def registry_leaderboard(request: Request, problem: str = Query(max_length=32)):
    rate_limit(request, "registry", 120)
    if problem not in {p["id"] for p in registry_service.LIBRARY}:
        raise HTTPException(404, "Unknown library instance.")
    docs = await db.run_records.find({"problem_id": problem}).sort("created_at", 1).limit(1000).to_list(1000)
    best = {}
    for d in docs:
        e = RegistryEntry.from_mongo(d)
        for algo, cut in e.summary.get("cuts", {}).items():
            if algo not in best or cut > best[algo]["cut"]:
                best[algo] = {"cut": cut, "fingerprint": e.fingerprint, "label": e.label, "created_at": e.created_at}
    return {"problem": problem, "runs": len(docs), "best": best}


@api.get("/registry/{fingerprint}")
async def registry_get(request: Request, fingerprint: str = PathParam(pattern=r"^[0-9a-f]{64}$")):
    rate_limit(request, "registry", 120)
    doc = await db.run_records.find_one({"fingerprint": fingerprint})
    return {"entry": RegistryEntry.from_mongo(doc).public(full=True) if doc else None}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

