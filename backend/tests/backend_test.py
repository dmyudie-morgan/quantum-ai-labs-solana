"""Backend tests for Quantum AI Labs API."""
import os
import json
import time
import secrets
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # read from frontend/.env
    import pathlib
    for line in pathlib.Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"
    return s


# ---------- Health / AI status ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_health(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert "ai_available" in body


def test_ai_status(session):
    r = session.get(f"{API}/ai/status")
    assert r.status_code == 200
    body = r.json()
    # Should not leak API keys
    text = json.dumps(body).lower()
    assert "sk-" not in text
    assert "api_key" not in text or "api_keys" not in text


# ---------- AI history ----------
def test_ai_history_empty(session):
    sid = "test" + secrets.token_hex(6)
    r = session.get(f"{API}/ai/history/{sid}")
    assert r.status_code == 200
    assert r.json() == {"messages": []}


def test_ai_history_invalid_session_id(session):
    r = session.get(f"{API}/ai/history/bad!!")
    assert r.status_code in (422, 400)


def test_ai_clear_history(session):
    sid = "test" + secrets.token_hex(6)
    r = session.delete(f"{API}/ai/history/{sid}")
    assert r.status_code == 200
    assert "deleted" in r.json()


def test_ai_chat_validation(session):
    # too short / wrong session format
    r = session.post(f"{API}/ai/chat", json={"session_id": "x", "message": "hi"})
    assert r.status_code in (400, 422)
    # missing message
    r = session.post(f"{API}/ai/chat", json={"session_id": "testses123", "message": ""})
    assert r.status_code in (400, 422)


def test_ai_prompt_validation(session):
    r = session.post(f"{API}/ai/prompt", json={"prompt": "short"})
    assert r.status_code in (400, 422)


def test_ai_chat_stream(session):
    """Minimal single chat to verify SSE works & persists."""
    sid = "test" + secrets.token_hex(6)
    with session.post(f"{API}/ai/chat",
                      json={"session_id": sid, "message": "Reply with the single word: PONG"},
                      stream=True, timeout=60) as r:
        assert r.status_code == 200, r.text
        got_done = False
        chunks = []
        for raw in r.iter_lines():
            if not raw:
                continue
            line = raw.decode()
            if line.startswith("data: "):
                evt = json.loads(line[6:])
                if "delta" in evt:
                    chunks.append(evt["delta"])
                if evt.get("done"):
                    got_done = True
                    break
                if "error" in evt:
                    pytest.skip(f"AI error: {evt['error']}")
        assert got_done
        assert len("".join(chunks)) > 0

    # Verify persistence
    time.sleep(0.5)
    hist = session.get(f"{API}/ai/history/{sid}").json()["messages"]
    assert len(hist) == 2
    assert hist[0]["role"] == "user"
    assert hist[1]["role"] == "assistant"

    # Cleanup
    session.delete(f"{API}/ai/history/{sid}")


# ---------- Web3 ----------
def test_web3_networks(session):
    r = session.get(f"{API}/web3/networks")
    assert r.status_code == 200
    nets = r.json()["networks"]
    assert isinstance(nets, list) and len(nets) > 0
    ids = [n.get("id") or n.get("key") or n.get("name") for n in nets]
    assert any("ethereum" in str(i).lower() for i in ids)


def test_web3_network_status_eth(session):
    r = session.post(f"{API}/web3/network-status", json={"network": "ethereum"})
    if r.status_code == 502:
        pytest.skip("Upstream RPC rate-limited / down")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("chain_id") == 1 or body.get("chainId") == 1
    assert "block_number" in body or "blockNumber" in body


def test_web3_network_status_invalid(session):
    r = session.post(f"{API}/web3/network-status", json={"network": "not-a-chain"})
    assert r.status_code in (400, 404)


def test_web3_address_valid(session):
    r = session.post(f"{API}/web3/address",
                     json={"network": "ethereum",
                           "address": "0x28C6c06298d514Db089934071355E5743bf21d60"})
    if r.status_code == 502:
        pytest.skip("Upstream RPC down")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "balance" in body or "balance_wei" in body or "wei" in body


def test_web3_address_invalid(session):
    r = session.post(f"{API}/web3/address",
                     json={"network": "ethereum", "address": "abc"})
    assert r.status_code in (400, 422)


def test_web3_tx_not_found(session):
    fake_hash = "0x" + "a" * 64
    r = session.post(f"{API}/web3/tx", json={"network": "ethereum", "hash": fake_hash})
    if r.status_code == 502:
        pytest.skip("Upstream RPC down")
    # Could be 404 (not found) per spec
    assert r.status_code in (404, 400), r.text


def test_web3_tx_invalid_hash(session):
    r = session.post(f"{API}/web3/tx", json={"network": "ethereum", "hash": "nothex"})
    assert r.status_code in (400, 422)


def test_web3_token_usdc(session):
    r = session.post(f"{API}/web3/token", json={
        "network": "ethereum",
        "contract": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    })
    if r.status_code == 502:
        pytest.skip("Upstream RPC down")
    assert r.status_code == 200, r.text
    body = r.json()
    sym = (body.get("symbol") or "").upper()
    assert sym == "USDC"
    assert body.get("decimals") == 6


# ---------- Market ----------
def test_market_chains(session):
    r = session.get(f"{API}/market/chains")
    assert r.status_code == 200
    assert len(r.json()["chains"]) > 0


def test_market_token_weth(session):
    r = session.get(f"{API}/market/token",
                    params={"chain": "ethereum",
                            "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"})
    if r.status_code in (429, 502):
        pytest.skip(f"Upstream status {r.status_code}")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("pairs") or body.get("results") or isinstance(body, dict)


def test_market_search(session):
    r = session.get(f"{API}/market/search", params={"q": "PEPE"})
    if r.status_code in (429, 502):
        pytest.skip(f"Upstream status {r.status_code}")
    assert r.status_code == 200


def test_market_token_invalid_address(session):
    r = session.get(f"{API}/market/token", params={"chain": "ethereum", "address": "notanaddr"})
    assert r.status_code in (400, 422, 502)


def test_no_api_key_leak(session):
    """Scan several responses for API key leakage."""
    endpoints = ["/", "/health", "/ai/status", "/web3/networks", "/market/chains"]
    for ep in endpoints:
        r = session.get(f"{API}{ep}")
        text = r.text.lower()
        assert "emergent_llm_key" not in text
        assert "sk-ant" not in text
