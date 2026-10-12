import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/common/Primitives";
import { ARTICLES, CATEGORIES } from "@/data/research";
import { RESEARCH_TRACKS } from "@/lib/site";

const matches = (a, q) =>
  !q || [a.title, a.summary, a.category, ...a.sections.flatMap((s) => [s.heading, ...s.body])].join(" ").toLowerCase().includes(q);

export default function Research() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState(null);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => (!cat || a.category === cat) && matches(a, q));
  }, [query, cat]);

  return (
    <div data-testid="research-page">
      <PageHeader eyebrow="Research · Knowledge hub" title="From theory to implementation" intro="Curated educational articles with sources. Each section is labelled as established fact, hypothesis, experimental idea or open question." />
      <section className="lab-container py-12">
        <p className="eyebrow">R&amp;D status</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {RESEARCH_TRACKS.map((t, i) => (
            <Link key={t.title} to={t.to} className="panel flex flex-col gap-3 p-4 transition-colors hover:border-white/20" data-testid={`research-track-${i}`}>
              <StatusBadge status={t.status} />
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs leading-relaxed text-white/50">{t.note}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="lab-container pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search articles</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input className="field pl-9" placeholder="Search articles, e.g. annealing, EIP-1559, Kyber" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="research-search-input" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
            <button type="button" className="chip" aria-pressed={!cat} onClick={() => setCat(null)} data-testid="research-cat-all">All</button>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)} data-testid={`research-cat-${c.toLowerCase().replace(/\s+/g, "-")}`}>{c}</button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-white/40" data-testid="research-result-count">{results.length} article{results.length === 1 ? "" : "s"}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <Link key={a.slug} to={`/research/${a.slug}`} className="panel group flex flex-col p-6 transition-colors hover:border-lab-violet/40" data-testid={`research-article-card-${a.slug}`}>
              <p className="eyebrow">{a.category} · {a.minutes} min</p>
              <h3 className="mt-3 text-lg font-medium tracking-tight">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{a.summary}</p>
              <span className="link-arrow mt-5 text-xs">Read article <ArrowRight size={12} /></span>
            </Link>
          ))}
        </div>
        {results.length === 0 && <p className="panel mt-4 p-8 text-center text-sm text-white/50" data-testid="research-empty">No articles match your search.</p>}
      </section>
    </div>
  );
}
