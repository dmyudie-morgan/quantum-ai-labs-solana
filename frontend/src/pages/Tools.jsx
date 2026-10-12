import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eraser, Sparkles } from "lucide-react";
import { LabTabs, PageHeader } from "@/components/common/Primitives";
import { PromptForm } from "@/components/prompt/PromptForm";
import { PromptOutput } from "@/components/prompt/PromptOutput";
import { PromptChecks } from "@/components/prompt/PromptChecks";
import { SavedPrompts } from "@/components/prompt/SavedPrompts";
import { AiImprove } from "@/components/prompt/AiImprove";
import { TEMPLATES } from "@/data/promptTemplates";
import { EMPTY_PROMPT, buildPrompt, tidyFields } from "@/lib/prompt";
import { useLocalStorage } from "@/hooks/usePrefs";

export default function Tools() {
  const [fields, setFields] = useLocalStorage("qal-prompt-draft", EMPTY_PROMPT);
  const [style, setStyle] = useState("markdown");
  const [editing, setEditing] = useState(null);
  const output = useMemo(() => buildPrompt(fields, style), [fields, style]);

  const load = (f, savedId = null) => { setFields({ ...EMPTY_PROMPT, ...f }); setEditing(savedId); };
  const clear = () => { setFields(EMPTY_PROMPT); setEditing(null); toast("Builder cleared"); };

  return (
    <div data-testid="tools-page">
      <PageHeader eyebrow="Utility · AI Tools — Quantum Prompt Lab" title="Engineer prompts that hold up." intro="Build structured prompts from role, objective, context, constraints and format. Templates, quality checks, saving and export run entirely in your browser; AI improvement is optional.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container py-10">
        <p className="eyebrow">Templates</p>
        <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-2">
          {TEMPLATES.map((t) => (
            <button key={t.id} type="button" onClick={() => { load(t.fields); toast.success(`Loaded “${t.name}”`); }} className="panel shrink-0 px-4 py-3 text-left transition-colors hover:border-lab-violet/40" data-testid={`prompt-template-${t.id}`}>
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-lab-cyan/80">{t.category}</span>
              <span className="mt-1 block text-sm text-white">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <PromptForm fields={fields} setFields={setFields} />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => { setFields(tidyFields(fields)); toast.success("Whitespace and duplicate constraints tidied"); }} data-testid="prompt-tidy-btn"><Sparkles size={12} /> Tidy formatting</button>
              <button type="button" className="btn-ghost btn-sm" onClick={clear} data-testid="prompt-clear-btn"><Eraser size={12} /> Clear / reset</button>
            </div>
          </div>
          <div className="space-y-6">
            <PromptOutput output={output} style={style} setStyle={setStyle} />
            <PromptChecks fields={fields} />
            <AiImprove prompt={output} />
            <SavedPrompts fields={fields} editing={editing} setEditing={setEditing} onLoad={load} />
          </div>
        </div>
      </section>
    </div>
  );
}
