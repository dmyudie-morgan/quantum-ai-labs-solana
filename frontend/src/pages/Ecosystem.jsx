import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/common/Primitives";
import { COMMUNITY, UTILITIES } from "@/lib/site";

const FLOWS = [
  { a: "AI", b: "Computation", d: "Models help formulate problems and explain results; algorithms produce outputs that can be measured." },
  { a: "Computation", b: "Decentralized systems", d: "Experiment inputs and outputs could be committed on public ledgers for later verification (research direction)." },
  { a: "Decentralized systems", b: "AI", d: "Public chain data gives assistants and analysts an open, auditable source — read-only, without custody." },
];

export default function Ecosystem() {
  return (
    <div data-testid="ecosystem-page">
      <PageHeader eyebrow="06 — Ecosystem" title="Building the next computing frontier" intro="How AI, computational research and decentralized systems complement one another. Quantum AI Labs does not claim partnerships, customers or institutional affiliations." />
      <section className="lab-container grid gap-4 py-14 md:grid-cols-3">
        {FLOWS.map((f, i) => (
          <div key={i} className="panel p-6" data-testid={`ecosystem-flow-${i}`}>
            <p className="font-mono text-xs text-lab-cyan">{f.a} <span className="text-white/30">→</span> {f.b}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{f.d}</p>
          </div>
        ))}
      </section>
      <section className="lab-container pb-14">
        <p className="eyebrow">Utilities in the lab</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {UTILITIES.map((u) => (
            <Link key={u.id} to={u.to} className="panel group flex items-start justify-between gap-4 p-5 transition-colors hover:border-white/20" data-testid={`ecosystem-utility-${u.id}`}>
              <div><h3 className="text-sm font-medium">{u.label}</h3><p className="mt-1 text-xs text-white/50">{u.desc}</p></div>
              <ArrowRight size={14} className="mt-1 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-lab-cyan" />
            </Link>
          ))}
        </div>
      </section>
      <section id="community" className="scroll-mt-20 border-t border-white/[0.06] py-16" data-testid="ecosystem-community">
        <div className="lab-container">
          <p className="eyebrow">Community</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Build, collaborate, and grow together.</h2>
          {COMMUNITY.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {COMMUNITY.map((c) => (
                <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="btn-ghost" data-testid={`community-link-${c.id}`}>{c.label} <ArrowUpRight size={13} /></a>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-white/50" data-testid="community-empty">Official community channels have not been published yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
