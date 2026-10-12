import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Play, RotateCcw } from "lucide-react";
import { LabTabs, Notice, PageHeader, Stat } from "@/components/common/Primitives";
import { RunRecord } from "@/components/common/RunRecord";
import { isFingerprint, useFingerprint } from "@/lib/fingerprint";
import { NumField } from "@/components/quantum/NumField";
import { BENCHMARKS, stats } from "@/lib/benchmarks";
import { clamp } from "@/lib/maxcut";

const pause = () => new Promise((r) => setTimeout(r, 0));
const ms = (v) => `${v.toFixed(2)} ms`;

const int = (v, lo, hi, d) => (Number.isFinite(Number(v)) && v !== null ? Math.round(clamp(Number(v), [lo, hi])) : d);

function sharedParams(params) {
  const b = BENCHMARKS.find((x) => x.id === params.get("algo"));
  if (!b) return null;
  return { algoId: b.id, size: int(params.get("size"), b.min, b.max, b.def), repeats: int(params.get("repeats"), 1, 20, 5), seed: int(params.get("seed"), 0, 999999, 1) };
}

export default function Benchmark() {
  const [params, setParams] = useSearchParams();
  const [shared] = useState(() => sharedParams(params));
  const [expected, setExpected] = useState(() => (shared && isFingerprint(params.get("fp")) ? params.get("fp") : null));
  const [algoId, setAlgoId] = useState(shared?.algoId || BENCHMARKS[0].id);
  const algo = BENCHMARKS.find((b) => b.id === algoId);
  const [size, setSize] = useState(shared?.size ?? algo.def);
  const [repeats, setRepeats] = useState(shared?.repeats ?? 5);
  const [seed, setSeed] = useState(shared?.seed ?? 1);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);

  const choose = (id) => { const b = BENCHMARKS.find((x) => x.id === id); setAlgoId(id); setSize(b.def); setCurrent(null); setExpected(null); };

  const run = async (p = { algoId, size, repeats, seed }) => {
    const algo = BENCHMARKS.find((b) => b.id === p.algoId);
    const { size, repeats, seed } = p;
    setRunning(true); setCurrent(null); setProgress(0);
    await pause();
    const input = algo.prepare(size, seed);
    const times = [];
    let output = "";
    for (let i = 0; i < repeats; i++) {
      const t0 = performance.now();
      output = algo.run(input);
      times.push(performance.now() - t0);
      setProgress(i + 1);
      await pause();
    }
    const res = { algo: algo.label, algoId: algo.id, size, repeats, seed, output, times, ...stats(times), at: new Date().toLocaleTimeString() };
    setCurrent(res);
    setHistory((h) => [res, ...h].slice(0, 12));
    setRunning(false);
  };

  const reset = () => { choose(BENCHMARKS[0].id); setRepeats(5); setSeed(1); setHistory([]); };

  useEffect(() => {
    if (shared) { run(shared); setParams({}, { replace: true }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const record = useMemo(() => (current ? { tool: "quantum-ai-labs/benchmark", version: 1, algorithm: current.algoId, size: current.size, seed: current.seed, output: current.output } : null), [current]);
  const fingerprint = useFingerprint(record);
  const shareUrl = current && fingerprint ? `${window.location.origin}/benchmark?algo=${current.algoId}&size=${current.size}&seed=${current.seed}&repeats=${current.repeats}&fp=${fingerprint}` : "";

  return (
    <div data-testid="benchmark-page">
      <PageHeader eyebrow="Utility · Algorithm Benchmark Playground" title="Measure, repeat, compare." intro="Time bounded algorithms on your own device. Inputs are generated deterministically from a seed so runs are repeatable.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container grid gap-6 py-10 lg:grid-cols-[320px_1fr]">
        <aside className="panel space-y-4 p-5">
          <label className="block">
            <span className="field-label">Algorithm</span>
            <select className="field" value={algoId} onChange={(e) => choose(e.target.value)} disabled={running} data-testid="bench-algo-select">
              {BENCHMARKS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </label>
          <p className="font-mono text-[11px] text-white/40" data-testid="bench-complexity">Complexity: {algo.complexity}</p>
          <NumField label={`${algo.param} (${algo.min.toLocaleString()}–${algo.max.toLocaleString()})`} value={size} onChange={(v) => { setSize(Math.round(clamp(v, [algo.min, algo.max]))); setExpected(null); }} min={algo.min} max={algo.max} testId="bench-size" />
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Repeats (1–20)" value={repeats} onChange={(v) => setRepeats(Math.round(clamp(v, [1, 20])))} min={1} max={20} testId="bench-repeats" />
            <NumField label="Seed" value={seed} onChange={(v) => { setSeed(Math.round(clamp(v, [0, 999999]))); setExpected(null); }} min={0} max={999999} testId="bench-seed" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-primary flex-1" onClick={() => run()} disabled={running} data-testid="bench-run-btn"><Play size={14} /> {running ? `Running ${progress}/${repeats}` : "Run"}</button>
            <button type="button" className="btn-ghost" onClick={reset} disabled={running} data-testid="bench-reset-btn"><RotateCcw size={14} /> Reset</button>
          </div>
        </aside>
        <div className="space-y-6">
          {current ? (
            <div data-testid="bench-current-result">
              <p className="mb-3 text-sm text-white/70">Output: <span className="font-mono text-white" data-testid="bench-output">{current.output}</span></p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Stat label="Median" value={ms(current.median)} testId="bench-median" />
                <Stat label="Mean" value={ms(current.mean)} testId="bench-mean" />
                <Stat label="Min" value={ms(current.min)} testId="bench-min" />
                <Stat label="Max" value={ms(current.max)} testId="bench-max" />
                <Stat label="Std dev" value={ms(current.sd)} testId="bench-sd" />
              </div>
              <p className="mt-3 font-mono text-[11px] text-white/40">Runs: {current.times.map((t) => t.toFixed(1)).join(" · ")} ms</p>
            </div>
          ) : (
            <p className="panel p-8 text-sm text-white/40" data-testid="bench-empty">{running ? "Running…" : "Select an algorithm and press Run. Input generation is excluded from timings."}</p>
          )}
          {(record || expected) && <RunRecord record={record} fingerprint={fingerprint} expected={expected} shareUrl={shareUrl} unverified={current ? { repeats: current.repeats, timings_ms: current.times.map((t) => Number(t.toFixed(3))) } : null} filename="benchmark-run.json" />}
          {history.length > 0 && (
            <div className="panel scrollbar-thin overflow-x-auto p-5">
              <p className="eyebrow mb-3">Session history</p>
              <table className="w-full min-w-[560px] text-left text-xs" data-testid="bench-history-table">
                <thead className="text-white/40"><tr><th className="py-1 font-normal">Time</th><th className="font-normal">Algorithm</th><th className="font-normal">Size</th><th className="font-normal">Repeats</th><th className="font-normal">Median</th></tr></thead>
                <tbody className="font-mono">{history.map((h, i) => (
                  <tr key={i} className="border-t border-white/[0.06]"><td className="py-2">{h.at}</td><td className="font-sans">{h.algo}</td><td>{h.size.toLocaleString()}</td><td>{h.repeats}</td><td>{ms(h.median)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <Notice testId="bench-disclaimer">
            Browser timings depend on your hardware, browser engine, JIT warm-up, background tabs and input size. A single local benchmark does not show that one algorithm is universally faster. The first repeat is often slower because of JIT compilation — compare medians across several repeats.
            <span className="mt-1 block text-white/40">Device: {navigator.hardwareConcurrency || "?"} logical cores reported.</span>
          </Notice>
        </div>
      </section>
    </div>
  );
}
