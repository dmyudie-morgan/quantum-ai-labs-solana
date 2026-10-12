import hashlib
import json
import math
import re

MAX_CANONICAL = 120_000
FP_RE = re.compile(r"^[0-9a-f]{64}$")
TOOLS = {"quantum-ai-labs/quantum-field": "quantum-field", "quantum-ai-labs/benchmark": "benchmark"}
ALGOS = ("exact", "local", "sa", "sqa")
BENCH_ALGOS = {"sort-native", "sort-merge", "sort-quick", "sort-insertion", "sieve", "matmul", "maxcut-sa"}

# Mirror of frontend/src/data/problems.js — keep in sync.
LIBRARY = [
    {"id": "ql-08", "n": 8, "density": 0.8, "seed": 101, "weighted": True},
    {"id": "ql-12", "n": 12, "density": 0.5, "seed": 42, "weighted": True},
    {"id": "ql-16", "n": 16, "density": 0.4, "seed": 7, "weighted": True},
    {"id": "ql-20", "n": 20, "density": 0.3, "seed": 2024, "weighted": True},
    {"id": "ql-32", "n": 32, "density": 0.25, "seed": 11, "weighted": False},
    {"id": "ql-48", "n": 48, "density": 0.2, "seed": 314, "weighted": True},
    {"id": "ql-64", "n": 64, "density": 0.15, "seed": 1618, "weighted": True},
    {"id": "ql-96", "n": 96, "density": 0.1, "seed": 271, "weighted": False},
    {"id": "ql-128", "n": 128, "density": 0.08, "seed": 999, "weighted": True},
    {"id": "ql-200", "n": 200, "density": 0.05, "seed": 5, "weighted": True},
]


def _i32(x):
    x &= 0xFFFFFFFF
    return x - (1 << 32) if x & 0x80000000 else x


def _imul(x, y):
    return _i32((x & 0xFFFFFFFF) * (y & 0xFFFFFFFF))


def _ushr(x, n):
    return (x & 0xFFFFFFFF) >> n


def mulberry32(seed):
    """Bit-exact port of the frontend PRNG so graphs regenerate identically."""
    a = seed & 0xFFFFFFFF

    def rnd():
        nonlocal a
        a = _i32(a + 0x6D2B79F5)
        t = _imul(a ^ _ushr(a, 15), 1 | a)
        t = _i32(t + _imul(t ^ _ushr(t, 7), 61 | t)) ^ t
        return _ushr(t ^ _ushr(t, 14), 0) / 4294967296

    return rnd


def generate_edges(n, density, seed, weighted):
    rng = mulberry32(seed)
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if rng() < density:
                edges.append((i, j, 1 + math.floor(rng() * 9) if weighted else 1))
    return edges or [(0, 1, 1)]


def cut_value(partition, edges):
    return sum(w for u, v, w in edges if partition[u] != partition[v])


def problem_for(cfg):
    for p in LIBRARY:
        if all(cfg.get(k) == p[k] for k in ("n", "density", "seed", "weighted")):
            return p["id"]
    return None


def _is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _quantum_field(rec):
    cfg, results = rec.get("config"), rec.get("results")
    if not isinstance(cfg, dict) or not isinstance(results, list) or not 1 <= len(results) <= 4:
        raise ValueError("Malformed Quantum Field record.")
    n, density, seed, weighted = cfg.get("n"), cfg.get("density"), cfg.get("seed"), cfg.get("weighted")
    if not (_is_int(n) and 4 <= n <= 200 and _is_num(density) and 0.02 <= density <= 1 and _is_int(seed) and 0 <= seed <= 999999 and isinstance(weighted, bool)):
        raise ValueError("Quantum Field config is out of the supported range.")
    edges = generate_edges(n, density, seed, weighted)
    cuts, seen = {}, set()
    for r in results:
        if not isinstance(r, dict) or r.get("id") not in ALGOS or r["id"] in seen:
            raise ValueError("Unknown or duplicate algorithm in results.")
        part = r.get("partition")
        if not (isinstance(part, str) and len(part) == n and set(part) <= {"0", "1"} and _is_int(r.get("cut"))):
            raise ValueError(f"Result '{r['id']}' has an invalid partition or cut.")
        if cut_value(part, edges) != r["cut"]:
            raise ValueError(f"Claimed cut for '{r['id']}' does not match its partition on this instance — publish rejected.")
        seen.add(r["id"])
        cuts[r["id"]] = r["cut"]
    total = sum(w for _, _, w in edges)
    return {
        "problem_id": problem_for(cfg),
        "cut_verified": True,
        "summary": {"config": cfg, "n": n, "edges": len(edges), "total_weight": total, "cuts": cuts,
                    "best_cut": max(cuts.values()), "optimum": cuts.get("exact")},
    }


def _benchmark(rec):
    algo, size, seed, output = rec.get("algorithm"), rec.get("size"), rec.get("seed"), rec.get("output")
    if algo not in BENCH_ALGOS or not (_is_int(size) and 1 <= size <= 10_000_000) or not (_is_int(seed) and 0 <= seed <= 999999):
        raise ValueError("Malformed Benchmark record.")
    if not isinstance(output, str) or not 1 <= len(output) <= 300:
        raise ValueError("Benchmark output is invalid.")
    return {"problem_id": None, "cut_verified": False, "summary": {"algorithm": algo, "size": size, "seed": seed, "output": output}}


def verify(canonical: str, fingerprint: str):
    if len(canonical) > MAX_CANONICAL:
        raise ValueError("Record is too large to publish.")
    if hashlib.sha256(canonical.encode("utf-8")).hexdigest() != fingerprint:
        raise ValueError("Fingerprint does not match the submitted record.")
    try:
        rec = json.loads(canonical)
    except json.JSONDecodeError as e:
        raise ValueError("Record is not valid JSON.") from e
    if not isinstance(rec, dict) or rec.get("tool") not in TOOLS or rec.get("version") != 1:
        raise ValueError("Unsupported record type.")
    tool = TOOLS[rec["tool"]]
    out = _quantum_field(rec) if tool == "quantum-field" else _benchmark(rec)
    return {"tool": tool, "record": rec, **out}


def clean_label(label):
    if not label:
        return None
    s = re.sub(r"[\x00-\x1f\x7f]", "", label).strip()
    s = re.sub(r"\s+", " ", s)[:40]
    return s or None
