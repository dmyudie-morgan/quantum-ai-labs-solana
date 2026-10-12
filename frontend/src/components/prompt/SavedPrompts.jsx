import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/usePrefs";

export const SavedPrompts = ({ fields, editing, setEditing, onLoad }) => {
  const [saved, setSaved] = useLocalStorage("qal-prompt-saved", []);
  const [name, setName] = useState("");
  const current = saved.find((s) => s.id === editing);

  const save = () => {
    const n = name.trim() || current?.name;
    if (!n) return toast.error("Give the template a name");
    if (current) {
      setSaved(saved.map((s) => (s.id === current.id ? { ...s, name: n, fields, updatedAt: Date.now() } : s)));
      toast.success("Saved template updated");
    } else {
      const id = `p${Date.now()}`;
      setSaved([{ id, name: n, fields, updatedAt: Date.now() }, ...saved].slice(0, 50));
      setEditing(id);
      toast.success("Template saved locally");
    }
    setName("");
  };

  const remove = (id) => { setSaved(saved.filter((s) => s.id !== id)); if (id === editing) setEditing(null); };

  return (
    <div className="panel p-5" data-testid="prompt-saved-panel">
      <p className="eyebrow">My templates · saved in this browser</p>
      <div className="mt-3 flex gap-2">
        <input className="field" maxLength={60} placeholder={current ? `Editing “${current.name}”` : "Template name"} value={name} onChange={(e) => setName(e.target.value)} data-testid="prompt-save-name" />
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={save} data-testid="prompt-save-btn"><Save size={12} /> {current ? "Update" : "Save"}</button>
      </div>
      {current && <button type="button" className="mt-2 text-[11px] text-white/45 underline" onClick={() => setEditing(null)} data-testid="prompt-save-as-new">Save as new instead</button>}
      <ul className="mt-4 divide-y divide-white/[0.06]">
        {saved.length === 0 && <li className="py-2 text-xs text-white/35" data-testid="prompt-saved-empty">No saved templates yet.</li>}
        {saved.map((s) => (
          <li key={s.id} className="flex items-center gap-2 py-2.5" data-testid={`prompt-saved-${s.id}`}>
            <span className={`flex-1 truncate text-sm ${s.id === editing ? "text-lab-cyan" : "text-white/75"}`}>{s.name}</span>
            <button type="button" className="rounded p-1.5 text-white/50 hover:text-white" aria-label={`Edit ${s.name}`} onClick={() => onLoad(s.fields, s.id)} data-testid={`prompt-saved-edit-${s.id}`}><Pencil size={13} /></button>
            <button type="button" className="rounded p-1.5 text-white/50 hover:text-red-300" aria-label={`Delete ${s.name}`} onClick={() => remove(s.id)} data-testid={`prompt-saved-delete-${s.id}`}><Trash2 size={13} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
};
