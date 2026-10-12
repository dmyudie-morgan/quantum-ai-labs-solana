import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "./Logo";
import { COMMUNITY, NAV_LINKS, UTILITIES } from "@/lib/site";

const Col = ({ title, children }) => (
  <div>
    <p className="eyebrow">{title}</p>
    <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
  </div>
);

export const SiteFooter = () => (
  <footer className="border-t border-white/[0.06] bg-lab-bg" data-testid="site-footer">
    <div className="lab-container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
      <div>
        <Logo size={36} testId="footer-logo" />
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
          An independent research initiative exploring AI, quantum-inspired algorithms and decentralized infrastructure.
          Browser demonstrations run on classical hardware.
        </p>
      </div>
      <Col title="Explore">
        {NAV_LINKS.map((l) => (
          <li key={l.to}><Link to={l.to} className="text-white/65 transition-colors hover:text-white" data-testid={`footer-link-${l.label.toLowerCase()}`}>{l.label}</Link></li>
        ))}
      </Col>
      <Col title="Utilities">
        {UTILITIES.map((u) => (
          <li key={u.id}><Link to={u.to} className="text-white/65 transition-colors hover:text-white" data-testid={`footer-utility-${u.id}`}>{u.label}</Link></li>
        ))}
      </Col>
      {COMMUNITY.length > 0 && (
        <Col title="Connect">
          {COMMUNITY.map((c) => (
            <li key={c.id}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white/65 hover:text-white" data-testid={`footer-community-${c.id}`}>
                {c.label} <ArrowUpRight size={12} />
              </a>
            </li>
          ))}
        </Col>
      )}
    </div>
    <div className="lab-container flex flex-col gap-2 border-t border-white/[0.05] py-6 text-xs text-white/35 sm:flex-row sm:justify-between">
      <span>© {new Date().getFullYear()} Quantum AI Labs. Educational and research content — not financial advice.</span>
      <span className="font-mono">Market data: Dexscreener · Chain data: public JSON-RPC</span>
    </div>
  </footer>
);
