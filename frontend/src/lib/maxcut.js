export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const LIMITS = { nodes: [4, 200], density: [0.02, 1], sweeps: [10, 3000], slices: [2, 16] };
export const EXACT_MAX = 20;
export const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));

export function generateGraph({ n, density, seed, weighted }) {
  const rng = mulberry32(seed);
  const edges = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) if (rng() < density) edges.push({ u: i, v: j, w: weighted ? 1 + Math.floor(rng() * 9) : 1 });
  if (!edges.length) edges.push({ u: 0, v: 1, w: 1 });
  const off = new Int32Array(n + 1);
  edges.forEach(({ u, v }) => { off[u + 1]++; off[v + 1]++; });
  for (let i = 0; i < n; i++) off[i + 1] += off[i];
  const fill = off.slice(0, n);
  const nb = new Int32Array(edges.length * 2);
  const wt = new Float64Array(edges.length * 2);
  edges.forEach(({ u, v, w }) => {
    nb[fill[u]] = v; wt[fill[u]++] = w;
    nb[fill[v]] = u; wt[fill[v]++] = w;
  });
  return { n, edges, off, nb, wt, totalWeight: edges.reduce((s, e) => s + e.w, 0) };
}

export function cutValue(s, edges) {
  let c = 0;
  for (let k = 0; k < edges.length; k++) if (s[edges[k].u] !== s[edges[k].v]) c += edges[k].w;
  return c;
}

function field(g, s, i) {
  let h = 0;
  for (let k = g.off[i]; k < g.off[i + 1]; k++) h += g.wt[k] * s[g.nb[k]];
  return h;
}
const randomSpins = (n, rng) => Int8Array.from({ length: n }, () => (rng() < 0.5 ? 1 : -1));
const progressStep = (sweeps) => Math.max(1, Math.floor(sweeps / 25));

function timed(fn) {
  const t0 = performance.now();
  const r = fn();
  return { ...r, timeMs: performance.now() - t0 };
}

export const exact = (g) =>
  g.n > EXACT_MAX ? null : timed(() => {
    const { n, edges } = g;
    const total = 1 << (n - 1);
    let best = -1;
    let bestMask = 0;
    for (let m = 0; m < total; m++) {
      let c = 0;
      for (let k = 0; k < edges.length; k++) {
        const e = edges[k];
        if (((m >> e.u) ^ (m >> e.v)) & 1) c += e.w;
      }
      if (c > best) { best = c; bestMask = m; }
    }
    const spins = Int8Array.from({ length: n }, (_, i) => ((bestMask >> i) & 1 ? 1 : -1));
    return { spins, cut: best, evaluations: total };
  });

export const localSearch = (g, seed, restarts = 20, onProgress) =>
  timed(() => {
    const rng = mulberry32(seed ^ 0x51ed);
    let best = { cut: -1, spins: [] };
    let evals = 0;
    for (let r = 0; r < restarts; r++) {
      const s = randomSpins(g.n, rng);
      for (;;) {
        let bi = -1;
        let bg = 0;
        for (let i = 0; i < g.n; i++) {
          const gain = s[i] * field(g, s, i);
          evals++;
          if (gain > bg) { bg = gain; bi = i; }
        }
        if (bi < 0) break;
        s[bi] = -s[bi];
      }
      const c = cutValue(s, g.edges);
      if (c > best.cut) best = { cut: c, spins: s.slice() };
      if (onProgress) onProgress((r + 1) / restarts, best.cut);
    }
    return { ...best, evaluations: evals };
  });

export const simulatedAnnealing = (g, seed, { sweeps, tStart, tEnd, onProgress }) =>
  timed(() => {
    const rng = mulberry32(seed ^ 0xa11e);
    const s = randomSpins(g.n, rng);
    let cut = cutValue(s, g.edges);
    let best = { cut, spins: s.slice() };
    const step = progressStep(sweeps);
    for (let k = 0; k < sweeps; k++) {
      if (onProgress && k % step === 0) onProgress(k / sweeps, best.cut);
      const T = tStart * Math.pow(tEnd / tStart, k / Math.max(1, sweeps - 1));
      for (let i = 0; i < g.n; i++) {
        const gain = s[i] * field(g, s, i);
        if (gain >= 0 || rng() < Math.exp(gain / T)) {
          s[i] = -s[i];
          cut += gain;
          if (cut > best.cut) best = { cut, spins: s.slice() };
        }
      }
    }
    return { ...best, evaluations: sweeps * g.n };
  });

// Path-integral Monte Carlo (Martoňák, Santoro & Tosatti style) — a classical simulation.
export const simulatedQuantumAnnealing = (g, seed, { sweeps, slices: P, temperature: T, gammaStart, gammaEnd, onProgress }) =>
  timed(() => {
    const rng = mulberry32(seed ^ 0x9a17);
    const reps = Array.from({ length: P }, () => randomSpins(g.n, rng));
    const PT = P * T;
    let best = { cut: -1, spins: [] };
    const step = progressStep(sweeps);
    for (let k = 0; k < sweeps; k++) {
      if (onProgress && k % step === 0) onProgress(k / sweeps, best.cut);
      const gamma = gammaStart + (gammaEnd - gammaStart) * (k / Math.max(1, sweeps - 1));
      const jPerp = -(PT / 2) * Math.log(Math.tanh(gamma / PT));
      for (let p = 0; p < P; p++) {
        const s = reps[p];
        const up = reps[(p + 1) % P];
        const dn = reps[(p - 1 + P) % P];
        for (let i = 0; i < g.n; i++) {
          const d = -2 * s[i] * field(g, s, i) + 2 * jPerp * s[i] * (up[i] + dn[i]);
          if (d <= 0 || rng() < Math.exp(-d / PT)) s[i] = -s[i];
        }
      }
      for (const s of reps) {
        const c = cutValue(s, g.edges);
        if (c > best.cut) best = { cut: c, spins: s.slice() };
      }
    }
    return { ...best, evaluations: sweeps * P * g.n };
  });
