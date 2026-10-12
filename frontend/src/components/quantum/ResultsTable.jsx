import { META } from "@/lib/qfieldRun";
import { EXACT_MAX } from "@/lib/maxcut";

export const ResultsTable = ({ results, n }) => {
  const exact = results.find((r) => r.id === "exact");
  const ref = exact ? exact.cut : Math.max(...results.map((r) => r.cut));
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm" data-testid="qlab-results-table">
        <thead className="eyebrow"><tr><th className="py-2 pr-3 font-normal">Algorithm</th><th className="font-normal">Best cut</th><th className="font-normal" data-testid="qlab-ratio-header">{exact ? "vs optimum" : "vs best found"}</th><th className="font-normal">Time</th><th className="font-normal">Spin evaluations</th></tr></thead>
        <tbody className="font-mono text-[13px]">
          {!exact && (
            <tr className="border-t border-white/[0.06]" data-testid="qlab-result-exact-skipped">
              <td className="py-3 pr-3 font-sans"><p className="text-white/60">{META.exact.name}</p><p className="text-[11px] text-white/40">Skipped: n = {n} &gt; {EXACT_MAX} would need 2^{n - 1} cut evaluations</p></td>
              <td colSpan={4} className="text-white/30">—</td>
            </tr>
          )}
          {results.map((r) => (
            <tr key={r.id} className="border-t border-white/[0.06]" data-testid={`qlab-result-${r.id}`}>
              <td className="py-3 pr-3 font-sans"><p className="text-white">{META[r.id].name}</p><p className="text-[11px] text-white/40">{META[r.id].kind}</p></td>
              <td data-testid={`qlab-result-${r.id}-cut`}>{r.cut}</td>
              <td className={r.cut === ref ? "text-lab-ok" : "text-amber-200"}>{((r.cut / ref) * 100).toFixed(2)}%</td>
              <td>{r.timeMs.toFixed(1)} ms</td>
              <td>{r.evaluations.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!exact && <p className="mt-3 text-[11px] text-white/40">Without an exact reference, “best found” is only the best of these heuristics — the true optimum may be higher.</p>}
    </div>
  );
};
