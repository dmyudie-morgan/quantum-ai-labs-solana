import os
import re
import time
import asyncio
from decimal import Decimal
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx


class UpstreamError(Exception):
    pass


class RpcError(Exception):
    pass


NETWORKS = {
    "ethereum": {"label": "Ethereum", "chain_id": 1, "symbol": "ETH", "dex": "ethereum",
                 "wrapped": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "explorer": "https://etherscan.io",
                 "rpcs": ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com", "https://cloudflare-eth.com"]},
    "base": {"label": "Base", "chain_id": 8453, "symbol": "ETH", "dex": "base",
             "wrapped": "0x4200000000000000000000000000000000000006", "explorer": "https://basescan.org",
             "rpcs": ["https://mainnet.base.org", "https://base-rpc.publicnode.com"]},
    "arbitrum": {"label": "Arbitrum One", "chain_id": 42161, "symbol": "ETH", "dex": "arbitrum",
                 "wrapped": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "explorer": "https://arbiscan.io",
                 "rpcs": ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"]},
    "optimism": {"label": "OP Mainnet", "chain_id": 10, "symbol": "ETH", "dex": "optimism",
                 "wrapped": "0x4200000000000000000000000000000000000006", "explorer": "https://optimistic.etherscan.io",
                 "rpcs": ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"]},
    "polygon": {"label": "Polygon PoS", "chain_id": 137, "symbol": "POL", "dex": "polygon",
                "wrapped": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", "explorer": "https://polygonscan.com",
                "rpcs": ["https://polygon-bor-rpc.publicnode.com", "https://polygon-rpc.com"]},
    "bsc": {"label": "BNB Smart Chain", "chain_id": 56, "symbol": "BNB", "dex": "bsc",
            "wrapped": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "explorer": "https://bscscan.com",
            "rpcs": ["https://bsc-rpc.publicnode.com", "https://bsc-dataseed.bnbchain.org"]},
}

ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
TX_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")
ERC20 = {"name": "0x06fdde03", "symbol": "0x95d89b41", "decimals": "0x313ce567", "totalSupply": "0x18160ddd"}

_client = httpx.AsyncClient(timeout=httpx.Timeout(6.0), headers={"User-Agent": "QuantumAILabs/1.0"})
_cache: dict = {}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def host(url):
    return urlparse(url).netloc


def get_network(network):
    if network not in NETWORKS:
        raise ValueError(f"Unsupported network '{network}'. Supported: {', '.join(NETWORKS)}")
    return NETWORKS[network]


def rpc_urls(network):
    override = os.environ.get(f"RPC_{network.upper()}")
    if override:
        return [u.strip() for u in override.split(",") if u.strip()]
    return NETWORKS[network]["rpcs"]


def list_networks():
    return [{"id": k, "label": v["label"], "chain_id": v["chain_id"], "symbol": v["symbol"],
             "explorer": v["explorer"], "rpc_hosts": [host(u) for u in rpc_urls(k)]} for k, v in NETWORKS.items()]


def fmt_units(value: int, decimals: int, places: int = 6) -> str:
    q = Decimal(value) / (Decimal(10) ** decimals)
    return f"{q:,.{places}f}".rstrip("0").rstrip(".") if places else f"{q:,.0f}"


async def _post(url, method, params):
    r = await _client.post(url, json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
    r.raise_for_status()
    j = r.json()
    if j.get("error"):
        raise RpcError(j["error"].get("message", "RPC error"))
    return j.get("result")


async def _with_failover(network, fn):
    net = get_network(network)
    errors = []
    for url in rpc_urls(network):
        t0 = time.perf_counter()
        try:
            cid = int(await _post(url, "eth_chainId", []), 16)
            if cid != net["chain_id"]:
                errors.append(f"{host(url)}: chain ID {cid} does not match expected {net['chain_id']}")
                continue
            result = await fn(url)
            meta = {"rpc": host(url), "chain_id": cid, "expected_chain_id": net["chain_id"], "chain_id_verified": True,
                    "latency_ms": round((time.perf_counter() - t0) * 1000)}
            return result, meta
        except (ValueError, LookupError):
            raise
        except Exception as e:
            errors.append(f"{host(url)}: {type(e).__name__}")
    raise UpstreamError("All public RPC endpoints failed: " + "; ".join(errors))


async def network_status(network):
    net = get_network(network)
    cached = _cache.get(("status", network))
    if cached and time.time() - cached[0] < 10:
        return {**cached[1], "cached": True}

    async def fn(url):
        return await asyncio.gather(_post(url, "eth_blockNumber", []), _post(url, "eth_gasPrice", []),
                                    _post(url, "eth_getBlockByNumber", ["latest", False]))

    (bn, gp, blk), meta = await _with_failover(network, fn)
    base_fee = (blk or {}).get("baseFeePerGas")
    data = {"network": network, "label": net["label"], "symbol": net["symbol"], **meta,
            "block_number": int(bn, 16),
            "block_timestamp": int(blk["timestamp"], 16) if blk else None,
            "gas_price_gwei": round(int(gp, 16) / 1e9, 6),
            "base_fee_gwei": round(int(base_fee, 16) / 1e9, 6) if base_fee else None,
            "source": "Public JSON-RPC: eth_chainId, eth_blockNumber, eth_gasPrice, eth_getBlockByNumber",
            "fetched_at": now_iso(), "cached": False}
    _cache[("status", network)] = (time.time(), data)
    return data


async def address_info(network, address):
    net = get_network(network)
    if not ADDRESS_RE.match(address):
        raise ValueError("Invalid address: expected 0x followed by 40 hexadecimal characters.")

    async def fn(url):
        return await asyncio.gather(_post(url, "eth_getBalance", [address, "latest"]),
                                    _post(url, "eth_getTransactionCount", [address, "latest"]),
                                    _post(url, "eth_getCode", [address, "latest"]))

    (bal, nonce, code), meta = await _with_failover(network, fn)
    return {"network": network, "label": net["label"], **meta, "address": address,
            "balance": fmt_units(int(bal, 16), 18), "symbol": net["symbol"], "tx_count": int(nonce, 16),
            "is_contract": code not in (None, "0x"), "explorer_url": f"{net['explorer']}/address/{address}",
            "source": "Public JSON-RPC: eth_getBalance, eth_getTransactionCount, eth_getCode", "fetched_at": now_iso()}


async def tx_info(network, tx_hash):
    net = get_network(network)
    if not TX_RE.match(tx_hash):
        raise ValueError("Invalid transaction hash: expected 0x followed by 64 hexadecimal characters.")

    async def fn(url):
        return await asyncio.gather(_post(url, "eth_getTransactionByHash", [tx_hash]),
                                    _post(url, "eth_getTransactionReceipt", [tx_hash]))

    (tx, rc), meta = await _with_failover(network, fn)
    if not tx:
        raise LookupError(f"Transaction not found on {net['label']}. Check that the correct network is selected.")
    status = "pending" if not rc else ("success" if rc.get("status") == "0x1" else "failed")
    egp = (rc or {}).get("effectiveGasPrice")
    return {"network": network, "label": net["label"], **meta, "hash": tx_hash, "from": tx.get("from"), "to": tx.get("to"),
            "value": fmt_units(int(tx.get("value", "0x0"), 16), 18), "symbol": net["symbol"],
            "block_number": int(tx["blockNumber"], 16) if tx.get("blockNumber") else None,
            "nonce": int(tx.get("nonce", "0x0"), 16), "status": status,
            "gas_used": int(rc["gasUsed"], 16) if rc and rc.get("gasUsed") else None,
            "effective_gas_price_gwei": round(int(egp, 16) / 1e9, 6) if egp else None,
            "explorer_url": f"{net['explorer']}/tx/{tx_hash}",
            "source": "Public JSON-RPC: eth_getTransactionByHash, eth_getTransactionReceipt", "fetched_at": now_iso()}


def _decode_str(h):
    if not h or h == "0x":
        return None
    b = bytes.fromhex(h[2:])
    if len(b) >= 64 and int.from_bytes(b[:32], "big") == 32:
        ln = int.from_bytes(b[32:64], "big")
        return b[64:64 + ln].decode("utf-8", "replace")[:64] or None
    return b.rstrip(b"\x00").decode("utf-8", "replace")[:64] or None


def _decode_uint(h):
    return int(h, 16) if h and h != "0x" else None


async def _safe_call(url, to, data):
    try:
        return await _post(url, "eth_call", [{"to": to, "data": data}, "latest"])
    except RpcError:
        return None


async def token_info(network, contract, holder=None):
    net = get_network(network)
    if not ADDRESS_RE.match(contract):
        raise ValueError("Invalid contract address: expected 0x followed by 40 hexadecimal characters.")
    if holder and not ADDRESS_RE.match(holder):
        raise ValueError("Invalid holder address: expected 0x followed by 40 hexadecimal characters.")

    async def fn(url):
        code = await _post(url, "eth_getCode", [contract, "latest"])
        if code in (None, "0x"):
            raise LookupError(f"No contract code found at this address on {net['label']}.")
        calls = [_safe_call(url, contract, sel) for sel in ERC20.values()]
        if holder:
            calls.append(_safe_call(url, contract, "0x70a08231" + holder[2:].lower().rjust(64, "0")))
        return await asyncio.gather(*calls)

    res, meta = await _with_failover(network, fn)
    name, symbol, decimals, supply = _decode_str(res[0]), _decode_str(res[1]), _decode_uint(res[2]), _decode_uint(res[3])
    dec = decimals if decimals is not None and decimals <= 36 else None
    holder_raw = _decode_uint(res[4]) if holder else None
    return {"network": network, "label": net["label"], **meta, "contract": contract, "name": name, "symbol": symbol,
            "decimals": dec, "total_supply": fmt_units(supply, dec, 4) if supply is not None and dec is not None else None,
            "holder": holder, "holder_balance": fmt_units(holder_raw, dec, 6) if holder_raw is not None and dec is not None else None,
            "erc20_like": bool(symbol) and dec is not None,
            "explorer_url": f"{net['explorer']}/token/{contract}",
            "source": "Public JSON-RPC: eth_getCode, eth_call (ERC-20 name/symbol/decimals/totalSupply/balanceOf)",
            "fetched_at": now_iso()}
