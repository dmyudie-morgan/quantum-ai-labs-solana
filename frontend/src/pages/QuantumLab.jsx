import { useMemo, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { LabTabs, Notice, PageHeader } from "@/components/common/Primitives";
import { GraphView } from "@/components/quantum/GraphView";
import { NumField } from "@/components/quantum/NumField";
import { LIMITS, clamp, exact, generateGraph, localSearch, simulatedAnnealing, simulatedQuantumAnnealing } from "@/lib/maxcut";

const DEFAULTS = { n: 12, density: 0.5, seed: 42, weighted: true, saSweeps: 300, tStart: 3, tEnd: 0.05, sqaSweeps: 300, slices: 8, temperature: 0.1, gammaStart: 3 };
const KIND = { exact: "Exact reference", classical: "Classical heuristic", qi: "Quantum-inspired heuristic (classical simulation)" };

function runAll(cfg, g) {
  const avgW = g.totalWeight / g.edges.length;
  return [
    { id: "exact", name: "Exhaustive search", kind: "exact", ...exact(g) },
    { id: "local", name: "Greedy local search (20 restarts)", kind: "classical", ...localSearch(g, cfg.seed) },
    { id: "sa", name: "Simulated annealing", kind: "classical", ...simulatedAnnealing(g, cfg.seed, { sweeps: cfg.saSweeps, tStart: cfg.tStart * avgW, tEnd: cfg.tEnd * avgW }) },
    { id: "sqa", name: "Simulated quantum annealing (PIMC)", kind: "qi", ...simulatedQuantumAnnealing(g, cfg.seed, { sweeps: cfg.sqaSweeps, slices: cfg.slices, temperature: cfg.temperature * avgW, gammaStart: cfg.gammaStart * avgW, gammaEnd: 0.01 }) },
  ];
}

const ResultsTable = ({ results, optimum }) => (
  <div className="scrollbar-thin overflow-x-auto">
    <table className="w-full min-w-[620px] text-left text-sm" data-testid="qlab-results-table">
      <thead className="eyebrow"><tr><th className="py-2 pr-3 font-normal">Algorithm</th><th className="font-normal">Best cut</th><th className="font-normal">vs optimum</th><th className="font-normal">Time</th><th className="font-normal">Spin evaluations</th></tr></thead>
      <tbody className="font-mono text-[13px]">
        {results.map((r) => (
          <tr key={r.id} className="border-t border-white/[0.06]" data-testid={`qlab-result-${r.id}`}>
            <td className="py-3 pr-3 font-sans"><p className="text-white">{r.name}</p><p className="text-[11px] text-white/40">{KIND[r.kind]}</p></td>
            <td data-testid={`qlab-result-${r.id}-cut`}>{r.cut}</td>
            <td className={r.cut === optimum ? "text-lab-ok" : "text-amber-200"}>{((r.cut / optimum) * 100).toFixed(1)}%</td>
            <td>{r.timeMs.toFixed(2)} ms</td>
            <td>{r.evaluations.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function QuantumLab() {
  const [cfg, setCfg] = useState(DEFAULTS);
  const [results, setResults] = useState(null);
  const [view, setView] = useState("sqa");
  const set = (k, lim) => (v) => {
    setCfg((c) => ({ ...c, [k]: lim ? clamp(v, lim) : v }));
    setResults(null);
  };
  const graph = useMemo(() => generateGraph(cfg), [cfg]);
  const shown = results?.find((r) => r.id === view);

  const run = () => { setResults(runAll(cfg, graph)); };
  const reset = () => { setCfg(DEFAULTS); setResults(null); setView("sqa"); };

  return (
    <div data-testid="quantum-lab-page">
      <PageHeader eyebrow="Utility · Quantum Field — Algorithm Lab" title="Quantum-inspired optimization, measured honestly." intro="Solve a weighted Max-Cut problem in your browser and compare an exact reference, two classical heuristics and simulated quantum annealing. Everything runs on classical hardware.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside className="panel space-y-6 p-5" aria-label="Configuration">
          <div>
            <p className="eyebrow">Problem instance</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumField label="Nodes (4–18)" value={cfg.n} onChange={set("n", LIMITS.nodes)} min={4} max={18} testId="qlab-nodes" />
              <NumField label="Edge density" value={cfg.density} onChange={set("density", LIMITS.density)} min={0.1} max={1} step={0.05} testId="qlab-density" />
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
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={run} data-testid="qlab-run-btn"><Play size={14} /> Run all</button>
            <button type="button" className="btn-ghost" onClick={reset} data-testid="qlab-reset-btn"><RotateCcw size={14} /> Reset</button>
          </div>
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
                    <button key={r.id} type="button" className="chip" aria-pressed={view === r.id} onClick={() => setView(r.id)} data-testid={`qlab-view-${r.id}`}>{r.name.split(" (")[0]}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="panel p-5">
            <p className="eyebrow mb-3">Results</p>
            {results ? <ResultsTable results={results} optimum={results[0].cut} /> : <p className="py-6 text-sm text-white/40" data-testid="qlab-results-empty">Configure the instance and press Run all. Same seed and parameters always produce the same results.</p>}
          </div>
          <Notice testId="qlab-limitations">
            <strong className="text-white/80">Limitations.</strong> Simulated quantum annealing here is path-integral Monte Carlo — a classical algorithm that mimics some dynamics of quantum annealing. It does not run on quantum hardware and these results are not evidence of quantum advantage. At ≤18 nodes every method usually finds the optimum; heuristics only matter at sizes where exhaustive search (2ⁿ⁻¹ cuts) is infeasible. Timings depend on your device and parameters, and the comparison is not normalised for equal compute.
          </Notice>
        </div>
      </section>
    </div>
  );
}
