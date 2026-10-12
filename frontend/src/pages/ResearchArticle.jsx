import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { ARTICLES, KIND } from "@/data/research";
import NotFound from "./NotFound";

export default function ResearchArticle() {
  const { slug } = useParams();
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return <NotFound />;
  return (
    <article className="lab-container max-w-3xl pb-24 pt-28 sm:pt-32" data-testid="research-article-page">
      <Link to="/research" className="link-arrow text-xs" data-testid="article-back-link"><ArrowLeft size={12} /> Knowledge hub</Link>
      <p className="eyebrow mt-8">{a.category} · {a.minutes} min read</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl" data-testid="article-title">{a.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-white/60">{a.summary}</p>
      <div className="mt-12 space-y-12">
        {a.sections.map((s) => (
          <section key={s.heading}>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-medium md:text-lg">{s.heading}</h2>
              <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${KIND[s.kind].cls}`}>{KIND[s.kind].label}</span>
            </div>
            {s.body.map((p, i) => <p key={i} className="mt-4 text-[15px] leading-[1.8] text-white/70">{p}</p>)}
          </section>
        ))}
      </div>
      <section className="mt-14 border-t border-white/[0.08] pt-8" data-testid="article-sources">
        <p className="eyebrow">Sources</p>
        <ul className="mt-4 space-y-3">
          {a.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1.5 text-sm text-white/70 hover:text-lab-cyan">
                {s.label} <ArrowUpRight size={13} className="mt-1 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
