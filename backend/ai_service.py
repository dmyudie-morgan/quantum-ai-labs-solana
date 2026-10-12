import os
import asyncio

from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

PROVIDER, MODEL, MODEL_LABEL = "anthropic", "claude-sonnet-4-5-20250929", "Claude Sonnet 4.5"
CHUNK_TIMEOUT = 60

CHAT_SYSTEM = (
    "You are the Quantum AI Labs research assistant, an expert in AI systems, quantum computing, "
    "quantum-inspired optimization, cryptography and Web3 infrastructure. Be precise, concise and technically honest. "
    "Distinguish established facts from hypotheses. Never claim quantum advantage without evidence and never claim that "
    "Quantum AI Labs runs quantum hardware. Never give financial advice; frame token or market questions as education and "
    "risk awareness. Never ask for seed phrases, private keys or signatures. Use Markdown and fenced code blocks where useful."
)

PROMPT_SYSTEM = (
    "You are a senior prompt engineer. Rewrite the user's prompt so it is clearer, more specific and more reliable for a "
    "large language model. Keep the user's intent, facts and constraints; do not invent new facts or data. Use a structure "
    "with Role, Objective, Context, Constraints and Output format sections in Markdown. Return only the improved prompt, "
    "followed by a short '## Changes' list of at most 4 bullets explaining what you improved."
)


def available() -> bool:
    return bool(os.environ.get("EMERGENT_LLM_KEY"))


def status():
    return {"available": available(), "provider": "Anthropic", "model": MODEL, "label": MODEL_LABEL,
            "billing": "Requests use Emergent Universal Key credits on this project."}


def friendly_error(e: Exception) -> str:
    msg = str(e).lower()
    if any(k in msg for k in ("budget", "credit", "insufficient", "quota")):
        return "The AI provider rejected the request because project AI credits appear to be exhausted."
    if "rate" in msg and "limit" in msg:
        return "The AI provider is rate limiting requests. Please wait a moment and retry."
    return "The AI provider returned an error. Please retry."


async def stream(system: str, history: list, text: str, session_id: str):
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=session_id, system_message=system,
                   initial_messages=[{"role": "system", "content": system}, *history]).with_model(PROVIDER, MODEL)
    agen = chat.stream_message(UserMessage(text=text)).__aiter__()
    while True:
        try:
            ev = await asyncio.wait_for(agen.__anext__(), timeout=CHUNK_TIMEOUT)
        except StopAsyncIteration:
            break
        if isinstance(ev, TextDelta):
            yield ev.content
        elif isinstance(ev, StreamDone):
            break
