import { Link } from "react-router-dom";

const MODULES = [
  { id: "assistant", title: "AI Assistant", desc: "Your intelligent Web3 companion.", img: "/img/mod-assistant.webp", to: "/assistant" },
  { id: "tools", title: "AI Tools", desc: "Create, analyze, and innovate.", img: "/img/mod-tools.webp", to: "/tools" },
  { id: "web3", title: "Web3 Solutions", desc: "Powering the next generation.", img: "/img/mod-web3.webp", to: "/web3" },
  { id: "ecosystem", title: "Ecosystem", desc: "Connecting global innovators.", img: "/img/mod-ecosystem.webp", to: "/ecosystem" },
  { id: "research", title: "Research", desc: "Exploring the future of AI and computation.", img: "/img/mod-research.webp", to: "/research" },
  { id: "community", title: "Community", desc: "Build, collaborate, and grow together.", img: "/img/mod-community.webp", to: "/ecosystem#community" },
];

export const Modules = () => (
  <section id="modules" className="scroll-mt-16 border-b border-white/[0.06] bg-lab-surface py-16 sm:py-20" data-testid="modules-section">
    <div className="lab-container">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Visual architecture</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Core Frontier Modules</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-white/55">Six interconnected pillars powering decentralized computational intelligence.</p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {MODULES.map((m, i) => (
          <Link
            key={m.id}
            to={m.to}
            data-testid={`module-card-${m.id}`}
            className="group reveal overflow-hidden rounded-[3px] border border-white/[0.09] bg-lab-panel transition-colors duration-300 hover:border-lab-violet/50"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img src={m.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
            </div>
            <div className="border-t border-white/[0.06] px-3 py-4 text-center">
              <h3 className="text-[13px] font-medium uppercase tracking-[0.08em] text-white">{m.title}</h3>
              <p className="mt-1 text-xs leading-snug text-white/55">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
