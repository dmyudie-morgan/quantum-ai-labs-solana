import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { COMMUNITY, NAV_LINKS, UTILITIES } from "@/lib/site";

const X_URL = COMMUNITY.find((c) => c.id === "x")?.url;

const XLink = ({ testId, className = "" }) =>
  X_URL ? (
    <a href={X_URL} target="_blank" rel="noopener noreferrer" aria-label="Follow Quantum AI Labs on X" className={`inline-flex items-center gap-2 text-white/65 transition-colors hover:text-white ${className}`} data-testid={testId}>
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
    </a>
  ) : null;

const linkCls = ({ isActive }) =>
  `text-[13px] transition-colors duration-200 ${isActive ? "text-white" : "text-white/65 hover:text-white"}`;

export const SiteNav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      data-testid="site-nav"
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b border-white/[0.06] bg-lab-bg/85 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="lab-container flex h-16 items-center">
        <Link to="/" aria-label="Quantum AI Labs home" data-testid="nav-logo-link">
          <Logo testId="nav-logo" />
        </Link>
        <nav className="ml-14 hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls} data-testid={`nav-link-${l.label.toLowerCase()}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <XLink testId="nav-x-link" className="ml-auto mr-6 hidden md:inline-flex" />
        <Link to={{ pathname: "/", hash: "#modules" }} className={`link-arrow hidden md:inline-flex ${X_URL ? "" : "ml-auto"}`} data-testid="nav-cta-explore">
          Explore the project <ArrowRight size={14} />
        </Link>
        <button
          type="button"
          className="ml-auto rounded p-2 text-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          data-testid="nav-mobile-toggle"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && <MobileMenu />}
    </header>
  );
};

const MobileMenu = () => (
  <div id="mobile-menu" className="lab-container pb-8 pt-2 md:hidden" data-testid="nav-mobile-menu">
    <nav className="flex flex-col border-t border-white/[0.06] pt-4" aria-label="Mobile">
      {NAV_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className="py-2.5 text-base text-white/80" data-testid={`mobile-link-${l.label.toLowerCase()}`}>
          {l.label}
        </NavLink>
      ))}
    </nav>
    <p className="eyebrow mt-6">Utilities</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {UTILITIES.map((u) => (
        <Link key={u.id} to={u.to} className="panel px-3 py-2.5 text-sm text-white/80" data-testid={`mobile-utility-${u.id}`}>
          {u.label}
        </Link>
      ))}
    </div>
    {X_URL && (
      <div className="mt-6 flex items-center gap-2 text-sm text-white/70">
        <XLink testId="mobile-x-link" /> <span>@{X_URL.replace(/\/+$/, "").split("/").pop()}</span>
      </div>
    )}
    <Link to={{ pathname: "/", hash: "#modules" }} className="btn-primary mt-6 w-full" data-testid="mobile-cta-explore">
      Explore the project <ArrowRight size={14} />
    </Link>
  </div>
);
