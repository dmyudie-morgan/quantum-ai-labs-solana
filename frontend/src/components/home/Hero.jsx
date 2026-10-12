import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useReducedMotion } from "@/hooks/usePrefs";

const POSTER = "/img/hero-video-poster.webp";

const HeroMedia = () => {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [src] = useState(() => (window.matchMedia("(max-width: 767px)").matches ? "/video/hero-mobile.mp4" : "/video/hero.mp4"));

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const p = v.play();
    if (p) p.catch(() => {});
  }, [reduced]);

  if (reduced) return <img src={POSTER} alt="" className="h-full w-full object-cover" data-testid="hero-poster" />;
  return (
    <video
      ref={ref}
      data-testid="hero-video"
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={POSTER}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export const Hero = () => (
  <section className="relative overflow-hidden bg-lab-bg" data-testid="hero-section">
    <div className="absolute inset-0 lg:left-[30%]">
      <HeroMedia />
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-lab-bg via-lab-bg/55 to-transparent lg:via-lab-bg/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-lab-bg via-transparent to-lab-bg/70" />
    </div>
    <div className="absolute inset-y-0 left-0 hidden w-[32%] bg-lab-bg lg:block" />
    <div className="lab-container relative flex min-h-[640px] flex-col justify-center pb-24 pt-32 lg:min-h-[740px]">
      <p className="eyebrow reveal">Independent research · Emerging computation</p>
      <h1 className="reveal mt-5 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[5.25rem]" style={{ animationDelay: ".08s" }}>
        Quantum
        <br />
        <span className="text-gradient-cyan">AI Labs.</span>
      </h1>
      <p className="reveal mt-7 text-lg text-white/90 sm:text-xl" style={{ animationDelay: ".16s" }} data-testid="hero-tagline">Intelligence beyond limits.</p>
      <p className="reveal mt-4 max-w-[470px] text-sm leading-relaxed text-white/65 sm:text-[15px]" style={{ animationDelay: ".24s" }}>
        Exploring the convergence of artificial intelligence, quantum-inspired algorithms, and decentralized infrastructure to expand the possibilities of computational intelligence.
      </p>
      <div className="reveal mt-9 flex flex-wrap gap-3" style={{ animationDelay: ".32s" }}>
        <Link to="/vision" className="btn-primary" data-testid="hero-explore-vision-btn">Explore the vision <ArrowRight size={14} /></Link>
        <Link to="/research" className="btn-ghost" data-testid="hero-our-research-btn">Our research <ArrowUpRight size={14} /></Link>
      </div>
    </div>
    <div className="relative border-t border-white/[0.06] bg-lab-bg/70 backdrop-blur-md">
      <div className="lab-container flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-xs text-white/60">
        <span>Artificial intelligence</span>
        <span className="hidden text-white/20 sm:inline">|</span>
        <span>Quantum-inspired computation</span>
        <span className="hidden text-white/20 sm:inline">|</span>
        <span>Decentralized infrastructure</span>
        <Link to="/vision" className="link-arrow ml-auto text-xs" data-testid="hero-discover-vision-link">Discover the vision <ArrowRight size={12} /></Link>
      </div>
    </div>
  </section>
);
