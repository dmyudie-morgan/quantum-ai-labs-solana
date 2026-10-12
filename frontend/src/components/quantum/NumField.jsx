import { useEffect, useState } from "react";

export const NumField = ({ label, value, onChange, min, max, step = 1, testId }) => {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const v = parseFloat(draft);
    if (Number.isFinite(v)) onChange(v);
    else setDraft(String(value));
  };
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type="number" className="field font-mono" value={draft} min={min} max={max} step={step}
        onChange={(e) => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()} data-testid={testId} />
    </label>
  );
};
