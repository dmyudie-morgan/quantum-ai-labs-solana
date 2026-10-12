export const GraphView = ({ graph, spins }) => {
  const R = 130;
  const pos = Array.from({ length: graph.n }, (_, i) => {
    const a = (i / graph.n) * Math.PI * 2 - Math.PI / 2;
    return [160 + R * Math.cos(a), 160 + R * Math.sin(a)];
  });
  const cut = (e) => spins && spins[e.u] !== spins[e.v];
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-[340px]" role="img" aria-label={`Graph with ${graph.n} nodes and ${graph.edges.length} edges`} data-testid="qlab-graph">
      {graph.edges.map((e, i) => (
        <line key={i} x1={pos[e.u][0]} y1={pos[e.u][1]} x2={pos[e.v][0]} y2={pos[e.v][1]}
          stroke={cut(e) ? "#8fd9f7" : "rgba(255,255,255,0.12)"} strokeWidth={cut(e) ? 0.6 + e.w * 0.18 : 0.8} />
      ))}
      {pos.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={11} fill={!spins ? "#1a1a24" : spins[i] > 0 ? "#8b7cf6" : "#0b0b11"} stroke={spins && spins[i] < 0 ? "#8fd9f7" : "rgba(255,255,255,.3)"} strokeWidth="1.2" />
          <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="IBM Plex Mono">{i}</text>
        </g>
      ))}
    </svg>
  );
};
