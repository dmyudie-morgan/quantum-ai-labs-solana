import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, RotateCcw, Square } from "lucide-react";
import { LabTabs, Notice, PageHeader } from "@/components/common/Primitives";
import { RunRecord } from "@/components/common/RunRecord";
import { GraphView } from "@/components/quantum/GraphView";
import { NumField } from "@/components/quantum/NumField";
import { ResultsTable } from "@/components/quantum/ResultsTable";
import { LIMITS, clamp, generateGraph } from "@/lib/maxcut";
import { DEFAULTS, MAX_WORK, META, PRESETS, buildRecord, estimateWork, sanitizeCfg } from "@/lib/qfieldRun";
import { decodeParam, encodeParam, isFingerprint, useFingerprint } from "@/lib/fingerprint";

const STAGES = { exact: "Exhaustive search", local: "Local search", sa: "Simulated annealing", sqa: "Simulated quantum annealing" };

function useSolver() {
  const worker = useRef(null);
  const [state, setState] = useState({ running: false, progress: null, results: null, cfg: null, error: null });
  const stop = () => { worker.current?.terminate(); worker.current = null; };
  useEffect(() => stop, []);
  const run = (cfg) => {
    stop();
    const w = new Worker(new URL("../workers/qfield.worker.js", import.meta.url));
    worker.current = w;
    setState({ running: true, progress: null, results: null, cfg, error: null });
    w.onmessage = ({ data }) => {
      if (data.type === "progress") setState((s) => ({ ...s, progress: data }));
      else {
        setState((s) => ({ ...s, running: false, progress: null, results: data.results || null, error: data.message || null }));
        stop();
      }
    };
    w.postMessage(cfg);
  };
  const cancel = () => { stop(); setState({ running: false, progress: null, results: null, cfg: null, error: null }); };
  const clear = () => setState((s) => (s.running ? s : { ...s, results: null, cfg: null }));
  return { ...state, run, cancel, clear };
}

export default function QuantumLab() {
  const [params, setParams] = useSearchParams();
  const [cfg, setCfg] = useState(() => (params.get("cfg") ? sanitizeCfg(decodeParam(params.get("cfg"))) : DEFAULTS));
  const [expected, setExpected] = useState(() => (isFingerprint(params.get("fp")) ? params.get("fp") : null));
  const [view, setView] = useState("sqa");
  const solver = useSolver();
  const { results } = solver;
  const set = (k, lim) => (v) => {
    setCfg((c) => ({ ...c, [k]: lim ? (k === "n" ? Math.round(clamp(v, lim)) : clamp(v, lim)) : v }));
    solver.clear();
    setExpected(null);
  };
  const graph = useMemo(() => generateGraph(cfg), [cfg]);
  const work = estimateWork(cfg, graph.edges.length);
  const tooBig = work > MAX_WORK;
  const shown = results?.find((r) => r.id === view);
  const record = useMemo(() => (results && solver.cfg ? buildRecord(solver.cfg, results) : null), [results, solver.cfg]);
  const fingerprint = useFingerprint(record);
  const shareUrl = record && fingerprint ? `${window.location.origin}/quantum-field?cfg=${encodeParam(solver.cfg)}&fp=${fingerprint}` : "";

  useEffect(() => {
    if (params.get("cfg")) { solver.run(cfg); setParams({}, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = () => solver.run(cfg);
  const reset = () => { solver.cancel(); setCfg(DEFAULTS); setView("sqa"); setExpected(null); };
  const applyPreset = (p) => { setCfg((c) => ({ ...c, ...p.cfg })); solver.clear(); setExpected(null); };

  return (
    <div data-testid="quantum-lab-page">
      <PageHeader eyebrow="Utility · Quantum Field — Algorithm Lab" title="Quantum-inspired optimization, measured honestly." intro="Solve a weighted Max-Cut problem in your browser and compare an exact reference, two classical heuristics and simulated quantum annealing. Everything runs on classical hardware.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside className="panel space-y-6 p-5" aria-label="Configuration">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={cfg.n === p.cfg.n && cfg.density === p.cfg.density} onClick={() => applyPreset(p)} disabled={solver.running} data-testid={`qlab-preset-${p.id}`}>{p.label}</button>
            ))}
          </div>
          <div>
            <p className="eyebrow">Problem instance</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumField label="Nodes (4–200)" value={cfg.n} onChange={set("n", LIMITS.nodes)} min={4} max={200} testId="qlab-nodes" />
              <NumField label="Edge density" value={cfg.density} onChange={set("density", LIMITS.density)} min={0.02} max={1} step={0.01} testId="qlab-density" />
              <NumField label="Seed" value={cfg.seed} onChange={set("seed", [0, 999999])} min={0} max={999999} testId="qlab-seed" />
              <label className="flex items-end gap-2 pb-2.5 text-xs text-white/70"><input type="checkbox" checked={cfg.weighted} onChange={(e) => set("weighted")(e.target.checked)} data-testid="qlab-weighted" className="accent-[#8fd9f7]" /> Weighted (1–9)</label>
            </div>
          </div>
          <div>
            <p className="eyebrow">Simulated annealing</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <NumField label="Sweeps" value={cfg.saSweeps} onChange={set("saSweeps", LIMITS.sweeps)} min={10} max={3000} testId="qlab-sa-sweeps" />
              <NumField label="T start" value={cfg.tStart} onChange={set("tStart", [0.1, 20])} step={0.1} testId="qlab-sa-tstart" />
              <NumField label="T end" value={cfg.tEnd} onChange={set("tEnd", [0.001, 1])} step={0.01} testId="qlab-sa-tend" />
            </div>
          </div>
          <div>
            <p className="eyebrow">Simulated quantum annealing</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumField label="Sweeps" value={cfg.sqaSweeps} onChange={set("sqaSweeps", LIMITS.sweeps)} min={10} max={3000} testId="qlab-sqa-sweeps" />
              <NumField label="Trotter slices" value={cfg.slices} onChange={set("slices", LIMITS.slices)} min={2} max={16} testId="qlab-sqa-slices" />
              <NumField label="Temperature" value={cfg.temperature} onChange={set("temperature", [0.01, 2])} step={0.01} testId="qlab-sqa-temp" />
              <NumField label="Γ start" value={cfg.gammaStart} onChange={set("gammaStart", [0.1, 10])} step={0.1} testId="qlab-sqa-gamma" />
            </div>
            <p className="mt-2 text-[11px] text-white/35">Temperatures and Γ are scaled by the mean edge weight. Γ decreases linearly to 0.01.</p>
          </div>
          <p className={`font-mono text-[11px] ${tooBig ? "text-red-300" : "text-white/40"}`} data-testid="qlab-work-estimate">
            Estimated work ≈ {(work / 1e6).toFixed(1)}M operations{tooBig ? ` — over the ${MAX_WORK / 1e6}M limit. Reduce sweeps, slices, density or nodes.` : ""}
          </p>
          <div className="flex gap-2">
            {solver.running ? (
              <button type="button" className="btn-ghost flex-1" onClick={solver.cancel} data-testid="qlab-cancel-btn"><Square size={14} /> Cancel</button>
            ) : (
              <button type="button" className="btn-primary flex-1" onClick={run} disabled={tooBig} data-testid="qlab-run-btn"><Play size={14} /> Run all</button>
            )}
            <button type="button" className="btn-ghost" onClick={reset} data-testid="qlab-reset-btn"><RotateCcw size={14} /> Reset</button>
          </div>
          {solver.running && (
            <div data-testid="qlab-progress">
              <p className="text-xs text-white/60">Running in a background worker · {STAGES[solver.progress?.stage] || "Starting"} {solver.progress?.p ? `${Math.round(solver.progress.p * 100)}%` : ""}</p>
              <div className="mt-2 h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-lab-cyan transition-[width] duration-200" style={{ width: `${Math.round(((["exact", "local", "sa", "sqa"].indexOf(solver.progress?.stage) + (solver.progress?.p || 0)) / 4) * 100)}%` }} /></div>
            </div>
          )}
        </aside>
        <div className="space-y-6">
          <div className="panel grid gap-6 p-5 md:grid-cols-[minmax(0,340px)_1fr]">
            <GraphView graph={graph} spins={shown?.spins} />
            <div className="text-sm">
              <p className="eyebrow">Input</p>
              <p className="mt-2 font-mono text-[13px] text-white/80" data-testid="qlab-instance-summary">{graph.n} nodes · {graph.edges.length} edges · total weight {graph.totalWeight} · seed {cfg.seed}</p>
              <p className="mt-4 leading-relaxed text-white/55">Max-Cut: split the nodes into two groups so the total weight of edges crossing between groups is as large as possible. Highlighted edges are cut by the selected solution.</p>
              {results && (
                <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Show solution">
                  {results.map((r) => (
                    <button key={r.id} type="button" className="chip" aria-pressed={view === r.id} onClick={() => setView(r.id)} data-testid={`qlab-view-${r.id}`}>{META[r.id].name.split(" (")[0]}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <p className="eyebrow mb-3">Results</p>
            {solver.error && <Notice tone="error" testId="qlab-error">{solver.error}</Notice>}
            {results ? <ResultsTable results={results} n={solver.cfg.n} /> : <p className="py-6 text-sm text-white/40" data-testid="qlab-results-empty">{solver.running ? "Computing…" : "Configure the instance and press Run all. Same seed and parameters always produce the same results."}</p>}
          </div>
          {(record || expected) && <RunRecord record={record} fingerprint={fingerprint} expected={expected} shareUrl={shareUrl} unverified={results ? { timings_ms: Object.fromEntries(results.map((r) => [r.id, Number(r.timeMs.toFixed(2))])) } : null} filename="quantum-field-run.json" />}
          <Notice testId="qlab-limitations">
            <strong className="text-white/80">Limitations.</strong> Simulated quantum annealing here is path-integral Monte Carlo — a classical algorithm that mimics some dynamics of quantum annealing. It does not run on quantum hardware and these results are not evidence of quantum advantage. Up to 20 nodes an exact reference is computed and every method usually finds the optimum; beyond that, exhaustive search (2ⁿ⁻¹ cuts) is skipped and heuristics are compared only against each other. Timings depend on your device and parameters, and the comparison is not normalised for equal compute.
          </Notice>
        </div>
      </section>
    </div>
  );
}
