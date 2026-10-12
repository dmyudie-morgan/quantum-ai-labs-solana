import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export const Layout = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-lab-cyan focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <SiteNav />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
};
