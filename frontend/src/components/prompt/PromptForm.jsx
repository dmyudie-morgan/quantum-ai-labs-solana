import { OUTPUT_FORMATS } from "@/lib/prompt";

const Text = ({ k, label, fields, set, rows = 1, placeholder }) => (
  <label className="block">
    <span className="field-label">{label}</span>
    {rows > 1 ? (
      <textarea rows={rows} maxLength={4000} className="field resize-y" placeholder={placeholder} value={fields[k]} onChange={(e) => set(k, e.target.value)} data-testid={`prompt-field-${k}`} />
    ) : (
      <input className="field" maxLength={300} placeholder={placeholder} value={fields[k]} onChange={(e) => set(k, e.target.value)} data-testid={`prompt-field-${k}`} />
    )}
  </label>
);

export const PromptForm = ({ fields, setFields }) => {
  const set = (k, v) => setFields((f) => ({ ...f, [k]: v }));
  const p = { fields, set };
  return (
    <div className="panel space-y-4 p-5" data-testid="prompt-form">
      <Text k="role" label="Role" placeholder="e.g. a senior protocol researcher" {...p} />
      <Text k="objective" label="Objective" rows={3} placeholder="What should the model accomplish?" {...p} />
      <Text k="context" label="Context" rows={4} placeholder="Background, inputs, data or code" {...p} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Text k="audience" label="Audience" placeholder="Who is the output for?" {...p} />
        <Text k="tone" label="Tone" placeholder="e.g. precise and neutral" {...p} />
      </div>
      <Text k="constraints" label="Constraints (one per line)" rows={4} placeholder={"Maximum 300 words\nCite sources"} {...p} />
      <label className="block">
        <span className="field-label">Output format</span>
        <select className="field" value={fields.format} onChange={(e) => set("format", e.target.value)} data-testid="prompt-field-format">
          {OUTPUT_FORMATS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </label>
      <Text k="examples" label="Examples (optional)" rows={2} placeholder="Example input/output pairs" {...p} />
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input type="checkbox" className="accent-[#8fd9f7]" checked={fields.clarify} onChange={(e) => set("clarify", e.target.checked)} data-testid="prompt-field-clarify" />
        Ask clarifying questions when information is missing
      </label>
    </div>
  );
};
