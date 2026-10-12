export const NAV_LINKS = [
  { label: "Vision", to: "/vision" },
  { label: "Technology", to: "/technology" },
  { label: "Research", to: "/research" },
  { label: "Roadmap", to: "/roadmap" },
  { label: "Ecosystem", to: "/ecosystem" },
];

export const UTILITIES = [
  { id: "assistant", label: "AI Assistant", to: "/assistant", desc: "Multi-turn research companion (Claude Sonnet 4.5)." },
  { id: "tools", label: "Prompt Lab", to: "/tools", desc: "Build, check, save and export structured prompts." },
  { id: "quantum", label: "Quantum Field", to: "/quantum-field", desc: "Quantum-inspired vs classical Max-Cut solvers." },
  { id: "benchmark", label: "Benchmark", to: "/benchmark", desc: "Time bounded algorithms in your browser." },
  { id: "web3", label: "Web3 Solutions", to: "/web3", desc: "Chain monitor, explorer, prices and gas alert." },
  { id: "research", label: "Knowledge Hub", to: "/research", desc: "Curated, sourced educational articles." },
];

export const COMMUNITY = [
  { id: "x", label: "X (Twitter)", url: process.env.REACT_APP_COMMUNITY_X },
  { id: "discord", label: "Discord", url: process.env.REACT_APP_COMMUNITY_DISCORD },
  { id: "github", label: "GitHub", url: process.env.REACT_APP_COMMUNITY_GITHUB },
  { id: "telegram", label: "Telegram", url: process.env.REACT_APP_COMMUNITY_TELEGRAM },
].filter((c) => c.url);

export const PRIMARY_COMMUNITY = COMMUNITY[0] || null;

export const RESEARCH_TRACKS = [
  { title: "Quantum-inspired optimization", status: "live", note: "Simulated quantum annealing vs classical baselines on Max-Cut.", to: "/quantum-field" },
  { title: "AI agent workflows", status: "live", note: "Assistant and Prompt Lab built on a server-side model proxy.", to: "/assistant" },
  { title: "Algorithmic experimentation", status: "live", note: "Repeatable in-browser timing of bounded algorithms.", to: "/benchmark" },
  { title: "Post-quantum cryptography education", status: "live", note: "Primer on NIST FIPS 203/204/205.", to: "/research/post-quantum-cryptography" },
  { title: "Verifiable computation records", status: "research", note: "Hash commitments for experiment outputs — not yet built.", to: "/research/verifiable-computation" },
];
