import { NavLink } from "react-router-dom";
import { UTILITIES } from "@/lib/site";

const STATUS = {
  live: { label: "Live", cls: "border-lab-cyan/40 text-lab-cyan bg-lab-cyan/[0.06]" },
  experimental: { label: "Experimental", cls: "border-lab-violet/50 text-[#b9adff] bg-lab-violet/10" },
  research: { label: "Future research", cls: "border-white/15 text-white/55 bg-white/[0.03]" },
};

export const StatusBadge = ({ status, testId }) => {
  const s = STATUS[status] || STATUS.research;
  return (
    <span data-testid={testId} className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${s.cls}`}>
      {s.label}
    </span>
  );
};

export const PageHeader = ({ eyebrow, title, intro, children, testId }) => (
  <section className="relative overflow-hidden border-b border-white/[0.06] pt-28 sm:pt-32" data-testid={testId}>
    <div className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-lab-violet/10 blur-[120px]" />
    <div className="lab-container relative pb-12">
      {eyebrow && <p className="eyebrow reveal">{eyebrow}</p>}
      <h1 className="reveal mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
      {intro && <p className="reveal mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">{intro}</p>}
      {children}
    </div>
  </section>
);

export const LabTabs = () => (
  <div className="scrollbar-thin -mb-px mt-10 flex gap-1 overflow-x-auto" role="navigation" aria-label="Lab utilities">
    {UTILITIES.map((u) => (
      <NavLink
        key={u.id}
        to={u.to}
        data-testid={`lab-tab-${u.id}`}
        className={({ isActive }) =>
          `whitespace-nowrap border-b-2 px-3 py-2.5 text-xs transition-colors ${isActive ? "border-lab-cyan text-white" : "border-transparent text-white/50 hover:text-white"}`
        }
      >
        {u.label}
      </NavLink>
    ))}
  </div>
);

export const Notice = ({ tone = "info", children, testId }) => {
  const cls = {
    info: "border-white/10 bg-white/[0.03] text-white/65",
    warn: "border-amber-400/30 bg-amber-400/[0.06] text-amber-200",
    error: "border-red-400/30 bg-red-400/[0.07] text-red-200",
    ok: "border-lab-ok/30 bg-lab-ok/[0.06] text-lab-ok",
  }[tone];
  return <div role={tone === "error" || tone === "warn" ? "alert" : undefined} data-testid={testId} className={`rounded-[3px] border px-3 py-2.5 text-xs leading-relaxed ${cls}`}>{children}</div>;
};

export const Stat = ({ label, value, sub, testId }) => (
  <div className="panel p-4">
    <p className="eyebrow">{label}</p>
    <p className="mt-2 truncate font-mono text-lg text-white" data-testid={testId}>{value}</p>
    {sub && <p className="mt-1 truncate text-[11px] text-white/40">{sub}</p>}
  </div>
);
