import { EXACT_MAX, LIMITS, clamp, exact, generateGraph, localSearch, simulatedAnnealing, simulatedQuantumAnnealing } from "./maxcut";

export const DEFAULTS = { n: 12, density: 0.5, seed: 42, weighted: true, saSweeps: 300, tStart: 3, tEnd: 0.05, sqaSweeps: 300, slices: 8, temperature: 0.1, gammaStart: 3 };
export const PRESETS = [
  { id: "small", label: "Small · 12 nodes", cfg: { n: 12, density: 0.5 } },
  { id: "medium", label: "Medium · 40 nodes", cfg: { n: 40, density: 0.3 } },
  { id: "large", label: "Large · 120 nodes", cfg: { n: 120, density: 0.08 } },
];
export const MAX_WORK = 6e8;

export const META = {
  exact: { name: "Exhaustive search", kind: "Exact reference" },
  local: { name: "Greedy local search (20 restarts)", kind: "Classical heuristic" },
  sa: { name: "Simulated annealing", kind: "Classical heuristic" },
  sqa: { name: "Simulated quantum annealing (PIMC)", kind: "Quantum-inspired heuristic (classical simulation)" },
};

const BOUNDS = {
  n: LIMITS.nodes, density: LIMITS.density, seed: [0, 999999], saSweeps: LIMITS.sweeps, tStart: [0.1, 20], tEnd: [0.001, 1],
  sqaSweeps: LIMITS.sweeps, slices: LIMITS.slices, temperature: [0.01, 2], gammaStart: [0.1, 10],
};
const INTS = new Set(["n", "seed", "saSweeps", "sqaSweeps", "slices"]);

export function sanitizeCfg(raw) {
  const out = { ...DEFAULTS };
  Object.entries(BOUNDS).forEach(([k, b]) => {
    const v = clamp(Number(raw?.[k] ?? DEFAULTS[k]), b);
    out[k] = INTS.has(k) ? Math.round(v) : v;
  });
  out.weighted = raw?.weighted === undefined ? DEFAULTS.weighted : Boolean(raw.weighted);
  return out;
}

export function estimateWork(cfg, m) {
  const twoM = 2 * m;
  const exactWork = cfg.n <= EXACT_MAX ? 2 ** (cfg.n - 1) * m : 0;
  return exactWork + twoM * (cfg.saSweeps + cfg.sqaSweeps * cfg.slices * 1.5) + 20 * cfg.n * twoM;
}

export function runAll(cfg, onProgress = () => {}) {
  const g = generateGraph(cfg);
  const avgW = g.totalWeight / g.edges.length;
  const out = [];
  const done = (r) => { out.push(r); onProgress(r.id, 1, r.cut); };
  onProgress("exact", 0);
  const ex = exact(g);
  if (ex) done({ id: "exact", ...ex });
  onProgress("local", 0);
  done({ id: "local", ...localSearch(g, cfg.seed, 20, (p, best) => onProgress("local", p, best)) });
  onProgress("sa", 0);
  done({ id: "sa", ...simulatedAnnealing(g, cfg.seed, { sweeps: cfg.saSweeps, tStart: cfg.tStart * avgW, tEnd: cfg.tEnd * avgW, onProgress: (p, best) => onProgress("sa", p, best) }) });
  onProgress("sqa", 0);
  done({ id: "sqa", ...simulatedQuantumAnnealing(g, cfg.seed, { sweeps: cfg.sqaSweeps, slices: cfg.slices, temperature: cfg.temperature * avgW, gammaStart: cfg.gammaStart * avgW, gammaEnd: 0.01, onProgress: (p, best) => onProgress("sqa", p, best) }) });
  return out;
}

export const buildRecord = (cfg, results) => ({
  tool: "quantum-ai-labs/quantum-field",
  version: 1,
  config: cfg,
  results: results.map((r) => ({ id: r.id, cut: r.cut, evaluations: r.evaluations, partition: Array.from(r.spins, (x) => (x > 0 ? "1" : "0")).join("") })),
});
