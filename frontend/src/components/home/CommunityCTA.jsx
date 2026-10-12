import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PRIMARY_COMMUNITY } from "@/lib/site";

export const FollowButton = ({ testId = "cta-follow-btn" }) =>
  PRIMARY_COMMUNITY ? (
    <a href={PRIMARY_COMMUNITY.url} target="_blank" rel="noopener noreferrer" className="btn-primary" data-testid={testId}>
      Follow Quantum AI Labs <ArrowUpRight size={14} />
    </a>
  ) : (
    <Link to="/ecosystem#community" className="btn-primary" data-testid={testId}>
      Follow Quantum AI Labs <ArrowRight size={14} />
    </Link>
  );

export const CommunityCTA = () => (
  <section className="grain relative overflow-hidden" data-testid="community-cta">
    <img src="/img/cta-mountains.webp" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-r from-lab-bg/90 via-lab-bg/70 to-lab-bg/85" />
    <div className="lab-container relative flex flex-col gap-8 py-20 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">Community · Frontier collaboration</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem]">
          The next era is open to <span className="text-gradient-violet">exploration.</span>
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Build, collaborate, and grow together. Follow the research, explore the technology, and join the conversation around decentralized intelligence.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <FollowButton />
        <Link to="/research" className="btn-ghost" data-testid="cta-explore-research-btn">Explore the research</Link>
      </div>
    </div>
  </section>
);
