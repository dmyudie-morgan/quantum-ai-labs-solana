import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { copyText, downloadText } from "@/lib/format";

export const PromptOutput = ({ output, style, setStyle }) => {
  const empty = !output.trim();
  const copy = async () => (await copyText(output)) ? toast.success("Prompt copied to clipboard") : toast.error("Clipboard unavailable");
  return (
    <div className="panel p-5" data-testid="prompt-output-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Generated prompt</p>
        <div className="flex gap-1" role="group" aria-label="Prompt style">
          {["markdown", "plain"].map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={style === s} onClick={() => setStyle(s)} data-testid={`prompt-style-${s}`}>{s === "markdown" ? "Markdown" : "Plain text"}</button>
          ))}
        </div>
      </div>
      <pre className="scrollbar-thin mt-4 max-h-[360px] min-h-[160px] overflow-auto whitespace-pre-wrap rounded-[3px] border border-white/[0.06] bg-black/50 p-4 font-mono text-[12.5px] leading-relaxed text-white/85" data-testid="prompt-output">
        {empty ? <span className="text-white/30">Fill in the builder or load a template.</span> : output}
      </pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary btn-sm" disabled={empty} onClick={copy} data-testid="prompt-copy-btn"><Copy size={12} /> Copy</button>
        <button type="button" className="btn-ghost btn-sm" disabled={empty} onClick={() => downloadText("prompt.md", output, "text/markdown")} data-testid="prompt-export-md-btn"><Download size={12} /> Export .md</button>
        <button type="button" className="btn-ghost btn-sm" disabled={empty} onClick={() => downloadText("prompt.txt", output)} data-testid="prompt-export-txt-btn"><Download size={12} /> Export .txt</button>
      </div>
    </div>
  );
};
