import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/Primitives";
import { PILLARS } from "@/components/home/PillarsResearch";

const DETAIL = {
  ai: {
    body: "Language models turned into dependable workflows: structured prompting, multi-turn assistance and clear disclosure of provider and limits. Model calls are proxied by the server so credentials never reach the browser.",
    uses: [{ l: "AI Assistant", to: "/assistant" }, { l: "Prompt Lab", to: "/tools" }],
    not: "Not an autonomous agent: it cannot browse, transact or access wallets.",
  },
  quantum: {
    body: "Heuristics that borrow ideas from quantum annealing — such as path-integral Monte Carlo with coupled replicas — executed on ordinary CPUs and compared against exact and classical baselines on reproducible instances.",
    uses: [{ l: "Quantum Field", to: "/quantum-field" }, { l: "Benchmark Playground", to: "/benchmark" }],
    not: "Not quantum hardware, and not evidence of quantum advantage.",
  },
  infra: {
    body: "Read-only access to public EVM networks through JSON-RPC with chain-ID verification, multi-endpoint failover, caching and rate limits, plus market data from Dexscreener's public API.",
    uses: [{ l: "Web3 Solutions", to: "/web3" }, { l: "Knowledge Hub", to: "/research/decentralized-infrastructure" }],
    not: "No wallet connection, signing or broadcasting of transactions.",
  },
};

const STACK = [
  ["Browser compute", "Optimization and benchmarks run locally in JavaScript with bounded inputs."],
  ["Server-side AI proxy", "FastAPI streams Claude Sonnet 4.5 responses; keys stay on the server."],
  ["Public JSON-RPC", "Configurable endpoint list per network with automatic failover."],
  ["Dexscreener API", "Free public market data, cached for 30 seconds."],
  ["Local storage", "Saved prompts, thresholds and preferences stay in your browser."],
];

export default function Technology() {
  return (
    <div data-testid="technology-page">
      <PageHeader eyebrow="02 — Technology" title="Three pillars, implemented honestly." intro="Each pillar maps to working utilities in this lab — and to explicit statements of what they are not." />
      <section className="lab-container divide-y divide-white/[0.06] py-8">
        {PILLARS.map((p) => (
          <article key={p.id} id={p.id} className="grid scroll-mt-20 gap-8 py-12 lg:grid-cols-[1fr_420px]" data-testid={`technology-pillar-${p.id}`}>
            <div>
              <p className="font-mono text-xs text-white/35">{p.n}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">{p.title}</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">{DETAIL[p.id].body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {DETAIL[p.id].uses.map((u) => (
                  <Link key={u.to} to={u.to} className="btn-ghost btn-sm" data-testid={`technology-${p.id}-link-${u.to.replace(/\W+/g, "")}`}>{u.l} <ArrowRight size={12} /></Link>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/40">{DETAIL[p.id].not}</p>
            </div>
            <img src={p.img} alt="" loading="lazy" className="h-60 w-full rounded-[3px] border border-white/[0.07] object-cover" />
          </article>
        ))}
      </section>
      <section className="lab-container pb-20">
        <p className="eyebrow">Platform architecture</p>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {STACK.map(([t, d]) => (
            <div key={t} className="panel p-5"><h3 className="text-sm font-medium">{t}</h3><p className="mt-2 text-xs leading-relaxed text-white/50">{d}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}
