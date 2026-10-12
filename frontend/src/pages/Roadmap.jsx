import { Link } from "react-router-dom";
import { PageHeader, StatusBadge } from "@/components/common/Primitives";

const PHASES = [
  { n: "Phase 1", t: "Foundation", status: "live", items: [["Research platform & brand system", "/"], ["Knowledge Hub", "/research"], ["AI Assistant", "/assistant"], ["Prompt Lab", "/tools"]] },
  { n: "Phase 2", t: "Computational experiments", status: "live", items: [["Quantum Field — Max-Cut solver comparison", "/quantum-field"], ["Benchmark Playground", "/benchmark"]] },
  { n: "Phase 3", t: "Public chain tooling", status: "live", items: [["Chain monitor & RPC health", "/web3"], ["Address, transaction & token explorer", "/web3"], ["Token price feed & gas alert", "/web3"]] },
  { n: "Phase 4", t: "Verifiable experiment records", status: "research", items: [["Hash commitments for benchmark runs", "/research/verifiable-computation"], ["Reproducibility bundles", "/research/verifiable-computation"]] },
  { n: "Phase 5", t: "Open research programme", status: "research", items: [["Community-submitted problem instances", "/ecosystem"], ["Post-quantum migration explainers", "/research/post-quantum-cryptography"]] },
];

export default function Roadmap() {
  return (
    <div data-testid="roadmap-page">
      <PageHeader eyebrow="05 — Roadmap" title="What exists, and what comes next." intro="Status labels reflect reality: Live means it works today in this lab. Future research means the idea is not built yet. No dates are promised." />
      <section className="lab-container py-14">
        <ol className="relative space-y-4 border-l border-white/[0.08] pl-6 sm:pl-10">
          {PHASES.map((p, i) => (
            <li key={p.n} className="panel relative p-6" data-testid={`roadmap-phase-${i + 1}`}>
              <span className={`absolute -left-[31px] top-7 h-2.5 w-2.5 rounded-full sm:-left-[47px] ${p.status === "live" ? "bg-lab-cyan" : "bg-white/25"}`} />
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-white/40">{p.n}</span>
                <h2 className="text-lg font-medium md:text-lg">{p.t}</h2>
                <StatusBadge status={p.status} testId={`roadmap-phase-${i + 1}-status`} />
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {p.items.map(([label, to]) => (
                  <li key={label}><Link to={to} className="text-sm text-white/60 transition-colors hover:text-lab-cyan">{label}</Link></li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
