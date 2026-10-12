export const OUTPUT_FORMATS = [
  { id: "markdown", label: "Structured Markdown", instr: "Respond in well-structured Markdown with clear headings." },
  { id: "bullets", label: "Bullet summary", instr: "Respond with concise bullet points, most important first." },
  { id: "steps", label: "Step-by-step", instr: "Respond as a numbered, step-by-step procedure." },
  { id: "table", label: "Table", instr: "Respond with a Markdown table followed by a two-sentence summary." },
  { id: "json", label: "JSON", instr: "Respond with valid JSON only, with no prose outside the JSON object." },
  { id: "plain", label: "Plain prose", instr: "Respond in clear plain prose without Markdown formatting." },
];

export const EMPTY_PROMPT = { role: "", objective: "", context: "", audience: "", tone: "", constraints: "", format: "markdown", examples: "", clarify: false };

const lines = (t) => t.split("\n").map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, "").trim()).filter(Boolean);

export function tidyFields(f) {
  const out = {};
  Object.entries(f).forEach(([k, v]) => {
    out[k] = typeof v === "string" ? v.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : v;
  });
  out.constraints = [...new Set(lines(f.constraints || ""))].join("\n");
  return out;
}

export function buildPrompt(f, style = "markdown") {
  const fmt = OUTPUT_FORMATS.find((o) => o.id === f.format) || OUTPUT_FORMATS[0];
  const cons = lines(f.constraints || "");
  const blocks = [
    ["Role", f.role && `You are ${f.role.replace(/^you are\s+/i, "").replace(/\.$/, "")}.`],
    ["Objective", f.objective],
    ["Context", f.context],
    ["Audience", f.audience],
    ["Tone", f.tone],
    ["Constraints", cons.length ? cons.map((c) => `- ${c}`).join("\n") : ""],
    ["Output format", fmt.instr],
    ["Examples", f.examples],
    ["Before you begin", f.clarify ? "If any information needed to complete the task is missing or ambiguous, ask up to three clarifying questions before answering." : ""],
  ].filter(([, v]) => v && v.trim());
  if (style === "plain") return blocks.map(([h, v]) => `${h.toUpperCase()}:\n${v.trim()}`).join("\n\n");
  return blocks.map(([h, v]) => `## ${h}\n${v.trim()}`).join("\n\n");
}

export function analyzePrompt(f) {
  const checks = [
    { id: "role", ok: f.role.trim().length >= 8, label: "Specific role", tip: "Name an expert persona, e.g. “a senior Solidity security auditor”." },
    { id: "objective", ok: f.objective.trim().split(/\s+/).length >= 8, label: "Clear objective", tip: "Describe the task in at least one full sentence with a measurable outcome." },
    { id: "context", ok: f.context.trim().length >= 20, label: "Relevant context", tip: "Add background, inputs or data the model should rely on." },
    { id: "constraints", ok: lines(f.constraints).length >= 2, label: "Constraints", tip: "List at least two constraints (length, scope, things to avoid)." },
    { id: "format", ok: Boolean(f.format), label: "Output format", tip: "Choose an output format." },
    { id: "vague", ok: !/\b(stuff|things|etc\.?|something|somehow)\b/i.test(`${f.objective} ${f.context}`), label: "Avoids vague words", tip: "Replace words like “stuff”, “things” or “etc.” with specifics." },
  ];
  return { checks, score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100) };
}
