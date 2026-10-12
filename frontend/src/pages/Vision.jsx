import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/Primitives";
import { PILLARS } from "@/components/home/PillarsResearch";

const PRINCIPLES = [
  { t: "Technical honesty", d: "Demonstrations are labelled as what they are. Browser algorithms run on classical hardware; we make no quantum-advantage claims." },
  { t: "Open exploration", d: "Utilities are free to use and built on public data sources, local computation and documented integrations." },
  { t: "Free-first architecture", d: "Deterministic tasks run locally. Paid model calls are used only where a model genuinely adds value." },
  { t: "Safety by design", d: "Read-only chain access. No wallet connection, no private keys, no seed phrases, no transaction signing." },
];

export default function Vision() {
  return (
    <div data-testid="vision-page">
      <PageHeader eyebrow="01 — Vision" title="Intelligence beyond limits, grounded in evidence." intro="Quantum AI Labs explores how artificial intelligence, quantum-inspired algorithms and decentralized infrastructure can complement one another — and builds small, verifiable tools to test those ideas in the open." />
      <section className="lab-container grid gap-4 py-16 md:grid-cols-2 lg:grid-cols-4">
        {PRINCIPLES.map((p, i) => (
          <div key={p.t} className="panel p-6" data-testid={`vision-principle-${i}`}>
            <span className="font-mono text-xs text-white/35">0{i + 1}</span>
            <h3 className="mt-3 text-base font-medium">{p.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{p.d}</p>
          </div>
        ))}
      </section>
      <section className="lab-container grid gap-6 pb-20 lg:grid-cols-3">
        {PILLARS.map((p) => (
          <Link key={p.id} to={`/technology#${p.id}`} className="group overflow-hidden rounded-[3px] border border-white/[0.08]" data-testid={`vision-pillar-${p.id}`}>
            <img src={p.img} alt="" loading="lazy" className="h-48 w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            <div className="p-6">
              <p className="font-mono text-xs text-white/35">{p.n}</p>
              <h3 className="mt-2 text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-white/55">{p.desc}</p>
              <span className="link-arrow mt-4 text-xs">Technology <ArrowRight size={12} /></span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
