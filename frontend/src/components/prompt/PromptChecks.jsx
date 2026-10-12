import { Check, Circle } from "lucide-react";
import { analyzePrompt } from "@/lib/prompt";

export const PromptChecks = ({ fields }) => {
  const { checks, score } = analyzePrompt(fields);
  return (
    <div className="panel p-5" data-testid="prompt-checks">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Quality checks · rule-based, local</p>
        <span className="font-mono text-sm text-lab-cyan" data-testid="prompt-score">{score}/100</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-2.5 text-xs" data-testid={`prompt-check-${c.id}`}>
            {c.ok ? <Check size={14} className="mt-0.5 shrink-0 text-lab-ok" /> : <Circle size={14} className="mt-0.5 shrink-0 text-white/25" />}
            <span><span className={c.ok ? "text-white/80" : "text-white/60"}>{c.label}</span>{!c.ok && <span className="block text-white/40">{c.tip}</span>}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
