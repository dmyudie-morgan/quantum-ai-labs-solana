import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Notice } from "@/components/common/Primitives";
import { apiFetch, streamSSE } from "@/lib/api";
import { copyText } from "@/lib/format";

export const AiImprove = ({ prompt }) => {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { apiFetch("/ai/status").then(setStatus).catch(() => setStatus({ available: false })); }, []);

  const improve = async () => {
    setBusy(true); setError(null); setResult("");
    try {
      await streamSSE("/ai/prompt", { prompt }, { onDelta: (d) => setResult((r) => r + d) });
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  return (
    <div className="panel p-5" data-testid="prompt-ai-panel">
      <p className="eyebrow">Optional · AI improvement</p>
      {status && !status.available ? (
        <p className="mt-3 text-xs text-white/50" data-testid="prompt-ai-unavailable">No AI provider is configured. The local builder, checks and templates above remain fully functional.</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-white/50">Sends the generated prompt to {status?.label || "the configured model"} for a rewrite. Uses AI credits; results vary between runs.</p>
          <button type="button" className="btn-ghost btn-sm mt-3" onClick={improve} disabled={busy || !status?.available || prompt.trim().length < 10} data-testid="prompt-ai-improve-btn">
            <Wand2 size={12} /> {busy ? "Improving…" : "Improve with AI"}
          </button>
        </>
      )}
      {error && <div className="mt-3"><Notice tone="error" testId="prompt-ai-error">{error}</Notice></div>}
      {result && (
        <div className="mt-4 rounded-[3px] border border-lab-violet/30 bg-lab-violet/[0.05] p-4" data-testid="prompt-ai-result">
          <p className="eyebrow mb-2 text-[#b9adff]">AI-generated · {status?.label}</p>
          <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown></div>
          {!busy && <button type="button" className="btn-ghost btn-sm mt-3" onClick={async () => (await copyText(result)) && toast.success("AI version copied")} data-testid="prompt-ai-copy-btn"><Copy size={12} /> Copy AI version</button>}
        </div>
      )}
    </div>
  );
};
