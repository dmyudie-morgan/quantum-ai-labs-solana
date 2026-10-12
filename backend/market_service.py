import re
import time
from urllib.parse import quote

import httpx

from web3_service import UpstreamError, ADDRESS_RE, now_iso

BASE = "https://api.dexscreener.com"
DEX_CHAINS = {"ethereum": "Ethereum", "base": "Base", "arbitrum": "Arbitrum", "optimism": "Optimism",
              "polygon": "Polygon", "bsc": "BNB Chain", "solana": "Solana"}
SOL_RE = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")
QUERY_RE = re.compile(r"^[A-Za-z0-9 ._$\-/]{2,64}$")
CACHE_TTL = 30

_client = httpx.AsyncClient(timeout=httpx.Timeout(8.0), headers={"User-Agent": "QuantumAILabs/1.0"})
_cache: dict = {}


def _num(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


async def _get(path):
    hit = _cache.get(path)
    if hit and time.time() - hit[0] < CACHE_TTL:
        return hit[1], hit[2], True
    try:
        r = await _client.get(BASE + path)
    except httpx.HTTPError as e:
        raise UpstreamError(f"Dexscreener unreachable ({type(e).__name__}).")
    if r.status_code == 429:
        raise UpstreamError("Dexscreener rate limit reached. Please wait a minute and retry.")
    if r.status_code >= 400:
        raise UpstreamError(f"Dexscreener returned HTTP {r.status_code}.")
    data, ts = r.json(), now_iso()
    _cache[path] = (time.time(), data, ts)
    return data, ts, False


def _pair(p):
    base, quote_t = p.get("baseToken") or {}, p.get("quoteToken") or {}
    return {"chain": p.get("chainId"), "dex": p.get("dexId"), "pair_address": p.get("pairAddress"), "url": p.get("url"),
            "base": {"symbol": base.get("symbol"), "name": base.get("name"), "address": base.get("address")},
            "quote": {"symbol": quote_t.get("symbol"), "address": quote_t.get("address")},
            "price_usd": _num(p.get("priceUsd")), "price_native": _num(p.get("priceNative")),
            "liquidity_usd": _num((p.get("liquidity") or {}).get("usd")),
            "volume_24h": _num((p.get("volume") or {}).get("h24")),
            "price_change_24h": _num((p.get("priceChange") or {}).get("h24")),
            "fdv": _num(p.get("fdv")), "market_cap": _num(p.get("marketCap")),
            "pair_created_at": p.get("pairCreatedAt")}


def _sorted(pairs):
    return sorted((_pair(p) for p in pairs or []), key=lambda x: x["liquidity_usd"] or 0, reverse=True)


async def token_pairs(chain, address):
    if chain not in DEX_CHAINS:
        raise ValueError(f"Unsupported chain '{chain}'. Supported: {', '.join(DEX_CHAINS)}")
    valid = SOL_RE.match(address) if chain == "solana" else ADDRESS_RE.match(address)
    if not valid:
        raise ValueError("Invalid token address format for the selected chain.")
    data, ts, cached = await _get(f"/tokens/v1/{chain}/{address}")
    pairs = _sorted(data if isinstance(data, list) else [])
    return {"mode": "token", "chain": chain, "query": address, "pairs": pairs[:8], "pair_count": len(pairs),
            "source": "Dexscreener public API", "source_url": f"https://dexscreener.com/{chain}/{address}",
            "fetched_at": ts, "cached": cached}


async def search(q):
    q = (q or "").strip()
    if not QUERY_RE.match(q):
        raise ValueError("Search must be 2-64 characters (letters, numbers, spaces, . _ - $ /).")
    data, ts, cached = await _get(f"/latest/dex/search?q={quote(q)}")
    pairs = _sorted((data or {}).get("pairs"))
    return {"mode": "search", "chain": None, "query": q, "pairs": pairs[:10], "pair_count": len(pairs),
            "source": "Dexscreener public API", "source_url": f"https://dexscreener.com/search?q={quote(q)}",
            "fetched_at": ts, "cached": cached}


async def native_price(dex_chain, wrapped):
    try:
        res = await token_pairs(dex_chain, wrapped)
    except Exception:
        return None
    for p in res["pairs"]:
        if (p["base"]["address"] or "").lower() == wrapped.lower() and p["price_usd"]:
            return {"price_usd": p["price_usd"], "pair": f"{p['base']['symbol']}/{p['quote']['symbol']}",
                    "dex": p["dex"], "source": "Dexscreener (highest-liquidity wrapped-native pair)",
                    "fetched_at": res["fetched_at"]}
    return None
