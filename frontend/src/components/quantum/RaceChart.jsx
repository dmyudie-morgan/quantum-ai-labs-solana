import { META } from "@/lib/qfieldRun";

export const RACE_COLORS = { local: "#f5c26b", sa: "#8fd9f7", sqa: "#8b7cf6" };
const W = 640, H = 220, PL = 48, PR = 16, PT = 14, PB = 28;

export const RaceChart = ({ trace, reference, referenceKind, running }) => {
  const series = Object.entries(trace).filter(([id, pts]) => RACE_COLORS[id] && pts.length);
  if (!series.length) return null;
  const all = series.flatMap(([, pts]) => pts);
  const xMax = Math.max(1, ...all.map((p) => p[0]));
  const cuts = all.map((p) => p[1]).concat(reference != null ? [reference] : []);
  let yMin = Math.min(...cuts), yMax = Math.max(...cuts);
  if (yMax === yMin) { yMin -= 1; yMax += 1; }
  const pad = (yMax - yMin) * 0.08;
  yMin -= pad; yMax += pad;
  const x = (t) => PL + (t / xMax) * (W - PL - PR);
  const y = (c) => PT + (1 - (c - yMin) / (yMax - yMin)) * (H - PT - PB);
  const path = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");

  return (
    <div data-testid="race-chart">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">Solver race · best cut over time{running ? " · live" : ""}</p>
        <p className="text-[11px] text-white/40">Each line starts when its solver starts (solvers run one after another in the worker).</p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Best cut found by each solver over elapsed time">
        {[0, 0.5, 1].map((f) => {
          const c = yMin + (yMax - yMin) * f;
          return (
            <g key={f}>
              <line x1={PL} x2={W - PR} y1={y(c)} y2={y(c)} stroke="rgba(255,255,255,.07)" />
              <text x={PL - 6} y={y(c) + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,.4)" fontFamily="IBM Plex Mono">{Math.round(c)}</text>
            </g>
          );
        })}
        {reference != null && (
          <g data-testid="race-reference">
            <line x1={PL} x2={W - PR} y1={y(reference)} y2={y(reference)} stroke="#6ee7b7" strokeDasharray="4 4" strokeWidth="1" />
            <text x={W - PR} y={y(reference) - 4} textAnchor="end" fontSize="9" fill="#6ee7b7" fontFamily="IBM Plex Mono">{referenceKind === "exact" ? "optimum" : "best known"} {reference}</text>
          </g>
        )}
        {series.map(([id, pts]) => (
          <g key={id}>
            <path d={path(pts.length === 1 ? [pts[0], pts[0]] : pts)} fill="none" stroke={RACE_COLORS[id]} strokeWidth="1.6" strokeLinejoin="round" data-testid={`race-line-${id}`} />
            <circle cx={x(pts[pts.length - 1][0])} cy={y(pts[pts.length - 1][1])} r="3" fill={RACE_COLORS[id]} />
          </g>
        ))}
        <text x={PL} y={H - 8} fontSize="9" fill="rgba(255,255,255,.4)" fontFamily="IBM Plex Mono">0 ms</text>
        <text x={W - PR} y={H - 8} textAnchor="end" fontSize="9" fill="rgba(255,255,255,.4)" fontFamily="IBM Plex Mono">{xMax.toFixed(0)} ms</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]" data-testid="race-legend">
        {series.map(([id, pts]) => (
          <span key={id} className="inline-flex items-center gap-2 text-white/70" data-testid={`race-legend-${id}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: RACE_COLORS[id] }} />{META[id].name.split(" (")[0]} · {pts[pts.length - 1][1]}
          </span>
        ))}
      </div>
    </div>
  );
};
