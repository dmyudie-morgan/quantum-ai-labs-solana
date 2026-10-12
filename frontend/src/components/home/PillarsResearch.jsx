import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/common/Primitives";
import { RESEARCH_TRACKS } from "@/lib/site";

export const PILLARS = [
  { n: "01", id: "ai", title: "Artificial Intelligence", desc: "Explore intelligent systems, AI assistants, and computational workflows.", img: "/img/pillar-ai.webp" },
  { n: "02", id: "quantum", title: "Quantum-Inspired Algorithms", desc: "Explore optimization methods inspired by quantum principles that can run on classical computing hardware.", img: "/img/pillar-quantum.webp" },
  { n: "03", id: "infra", title: "Decentralized Infrastructure", desc: "Explore blockchain-based coordination, transparency, and verifiable computation where technically appropriate.", img: "/img/pillar-infra.webp" },
];

const PillarRow = ({ p }) => (
  <article className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-white/[0.06] py-7 last:border-0 sm:grid-cols-[3rem_1fr_220px] lg:grid-cols-[3rem_1fr_260px]" data-testid={`pillar-${p.id}`}>
    <span className="pt-1 font-mono text-sm text-white/40">{p.n}</span>
    <div>
      <h3 className="text-xl font-medium tracking-tight">{p.title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/55">{p.desc}</p>
      <Link to={`/technology#${p.id}`} className="link-arrow mt-3 text-xs" data-testid={`pillar-${p.id}-learn-more`}>Learn more <ArrowRight size={12} /></Link>
    </div>
    <div className="col-span-2 mt-5 overflow-hidden rounded-[3px] border border-white/[0.07] sm:col-span-1 sm:mt-0">
      <img src={p.img} alt="" loading="lazy" className="h-28 w-full object-cover sm:h-full" />
    </div>
  </article>
);

const RnD = () => (
  <div className="border-b border-white/[0.06] pb-12" data-testid="rnd-block">
    <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
      <div>
        <p className="eyebrow">04 — Research &amp; development</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">From theory to implementation</h2>
        <p className="mt-4 text-sm leading-relaxed text-white/55">Investigating the boundaries of quantum-inspired optimization, agent workflows, and verifiable computation records.</p>
      </div>
      <img src="/img/mod-research.webp" alt="" loading="lazy" className="hidden h-40 w-40 rounded-full object-cover opacity-90 sm:block" />
    </div>
    <ul className="mt-7 divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {RESEARCH_TRACKS.map((t, i) => (
        <li key={t.title}>
          <Link to={t.to} className="flex items-center gap-3 py-3 text-sm text-white/80 transition-colors hover:text-white" data-testid={`rnd-track-${i}`}>
            <span className="flex-1">{t.title}</span>
            <StatusBadge status={t.status} />
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const EcoBlock = () => (
  <div className="grid gap-6 pt-12 sm:grid-cols-[1fr_160px]" data-testid="ecosystem-block">
    <div>
      <p className="eyebrow">06 — Ecosystem</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.1rem]">Building the next computing frontier</h2>
      <p className="mt-4 text-sm leading-relaxed text-white/55">
        AI proposes, computation tests, and decentralized systems record. Connecting innovators, researchers, and builders to advance the future of intelligence.
      </p>
      <Link to="/ecosystem" className="link-arrow mt-5 text-xs" data-testid="ecosystem-block-link">See how the pieces fit <ArrowRight size={12} /></Link>
    </div>
    <img src="/img/mod-ecosystem.webp" alt="" loading="lazy" className="hidden h-40 w-40 rounded-full object-cover opacity-90 sm:block" />
  </div>
);

export const PillarsResearch = () => (
  <section className="border-b border-white/[0.06] py-16 sm:py-20">
    <div className="lab-container grid gap-14 lg:grid-cols-[1.25fr_1fr] lg:gap-0">
      <div className="lg:border-r lg:border-white/[0.06] lg:pr-12" data-testid="pillars-section">
        <p className="eyebrow">Three pillars of exploration</p>
        <div className="mt-4">{PILLARS.map((p) => <PillarRow key={p.id} p={p} />)}</div>
      </div>
      <div className="lg:pl-12">
        <RnD />
        <EcoBlock />
      </div>
    </div>
  </section>
);
