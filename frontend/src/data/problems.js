// Curated Max-Cut instances. Keep in sync with backend/registry_service.py LIBRARY.
// reference: exact optimum (n ≤ 20) or the best cut found by our own heavy SA/SQA baseline runs (may be beaten).
export const PROBLEMS = [
  { id: "ql-08", name: "QL-08 · dense, weighted", n: 8, density: 0.8, seed: 101, weighted: true, edges: 25, totalWeight: 106, reference: 76, referenceKind: "exact" },
  { id: "ql-12", name: "QL-12 · default instance", n: 12, density: 0.5, seed: 42, weighted: true, edges: 34, totalWeight: 169, reference: 126, referenceKind: "exact" },
  { id: "ql-16", name: "QL-16 · medium density", n: 16, density: 0.4, seed: 7, weighted: true, edges: 36, totalWeight: 155, reference: 129, referenceKind: "exact" },
  { id: "ql-20", name: "QL-20 · largest exact", n: 20, density: 0.3, seed: 2024, weighted: true, edges: 52, totalWeight: 240, reference: 189, referenceKind: "exact" },
  { id: "ql-32", name: "QL-32 · unweighted", n: 32, density: 0.25, seed: 11, weighted: false, edges: 135, totalWeight: 135, reference: 98, referenceKind: "heuristic" },
  { id: "ql-48", name: "QL-48 · weighted", n: 48, density: 0.2, seed: 314, weighted: true, edges: 237, totalWeight: 1266, reference: 937, referenceKind: "heuristic" },
  { id: "ql-64", name: "QL-64 · weighted", n: 64, density: 0.15, seed: 1618, weighted: true, edges: 299, totalWeight: 1435, reference: 1070, referenceKind: "heuristic" },
  { id: "ql-96", name: "QL-96 · sparse, unweighted", n: 96, density: 0.1, seed: 271, weighted: false, edges: 452, totalWeight: 452, reference: 329, referenceKind: "heuristic" },
  { id: "ql-128", name: "QL-128 · sparse, weighted", n: 128, density: 0.08, seed: 999, weighted: true, edges: 647, totalWeight: 3125, reference: 2370, referenceKind: "heuristic" },
  { id: "ql-200", name: "QL-200 · largest", n: 200, density: 0.05, seed: 5, weighted: true, edges: 974, totalWeight: 4881, reference: 3689, referenceKind: "heuristic" },
];

export const problemFor = (cfg) =>
  (cfg && PROBLEMS.find((p) => p.n === cfg.n && p.density === cfg.density && p.seed === cfg.seed && p.weighted === cfg.weighted)) || null;

export const problemById = (id) => PROBLEMS.find((p) => p.id === id) || null;

export const problemCfg = ({ n, density, seed, weighted }) => ({ n, density, seed, weighted });
