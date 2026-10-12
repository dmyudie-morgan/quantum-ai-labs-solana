import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, RotateCcw, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LabTabs, Notice, PageHeader } from "@/components/common/Primitives";
import { apiFetch, streamSSE } from "@/lib/api";

const SID_KEY = "qal-assistant-session";
const SUGGESTIONS = [
  "Explain quantum-inspired optimization in plain terms",
  "How does the EIP-1559 base fee work?",
  "What should I check before interacting with a new token contract?",
  "Compare simulated annealing with quantum annealing",
];

const newSid = () => `qal_${(crypto.randomUUID?.() || `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`).replace(/-/g, "")}`;
function getSid() {
  let s = localStorage.getItem(SID_KEY);
  if (!s || !/^[A-Za-z0-9_-]{8,64}$/.test(s)) { s = newSid(); localStorage.setItem(SID_KEY, s); }
  return s;
}

const Bubble = ({ m, i }) =>
  m.role === "user" ? (
    <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-md bg-lab-violet/15 px-4 py-3 text-sm text-white" data-testid={`chat-message-user-${i}`}>{m.content}</div>
  ) : (
    <div className="max-w-full" data-testid={`chat-message-assistant-${i}`}>
      <p className="eyebrow mb-2">Assistant</p>
      {m.content ? <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div> : <p className="animate-pulse text-sm text-white/40" data-testid="chat-loading">Thinking…</p>}
    </div>
  );

const StatusLine = ({ status }) => {
  if (!status) return <p className="text-xs text-white/40">Checking provider…</p>;
  if (!status.available) return <Notice tone="warn" testId="assistant-unavailable">No AI provider is configured. The assistant is unavailable; all non-AI utilities still work.</Notice>;
  return (
    <p className="text-xs text-white/45" data-testid="assistant-provider-status">
      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-lab-ok align-middle" />
      Live model: {status.label} ({status.provider}) · {status.billing} Responses can be wrong — verify important facts.
    </p>
  );
};

export default function Assistant() {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const sid = useRef(getSid());
  const ctrl = useRef(null);
  const scroller = useRef(null);
  const lastPrompt = useRef("");

  useEffect(() => {
    apiFetch("/ai/status").then(setStatus).catch(() => setStatus({ available: false }));
    apiFetch(`/ai/history/${sid.current}`).then((d) => setMessages(d.messages)).catch(() => {});
  }, []);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [messages]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || busy) return;
    lastPrompt.current = msg;
    setError(null); setBusy(true); setInput("");
    setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    ctrl.current = new AbortController();
    try {
      await streamSSE("/ai/chat", { session_id: sid.current, message: msg }, {
        signal: ctrl.current.signal,
        onDelta: (d) => setMessages((m) => { const c = [...m]; c[c.length - 1] = { ...c[c.length - 1], content: c[c.length - 1].content + d }; return c; }),
      });
    } catch (e) {
      setError(e.message);
      setMessages((m) => (m[m.length - 1]?.content ? m : m.slice(0, -2)));
    }
    setBusy(false);
  };

  const clear = async () => {
    try { await apiFetch(`/ai/history/${sid.current}`, { method: "DELETE" }); } catch { /* history kept server-side */ }
    sid.current = newSid(); localStorage.setItem(SID_KEY, sid.current);
    setMessages([]); setError(null);
    toast.success("Conversation cleared");
  };

  const disabled = !status?.available || busy;
  return (
    <div data-testid="assistant-page">
      <PageHeader eyebrow="Utility · AI Assistant" title="Your intelligent Web3 companion." intro="A multi-turn research assistant for AI, computation and Web3 questions. It cannot access wallets, browse the web or execute transactions.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container grid gap-6 py-10 lg:grid-cols-[1fr_280px]">
        <div className="panel flex h-[68vh] min-h-[460px] flex-col">
          <div ref={scroller} className="scrollbar-thin flex-1 space-y-6 overflow-y-auto p-5 sm:p-7" data-testid="chat-messages" aria-live="polite">
            {messages.length === 0 && <p className="text-sm text-white/40" data-testid="chat-empty">Ask anything about AI systems, quantum-inspired algorithms or public blockchains.</p>}
            {messages.map((m, i) => <Bubble key={i} m={m} i={i} />)}
          </div>
          {error && (
            <div className="flex items-center gap-3 border-t border-white/[0.06] px-5 py-3">
              <Notice tone="error" testId="chat-error">{error}</Notice>
              <button type="button" className="btn-ghost btn-sm shrink-0" onClick={() => send(lastPrompt.current)} data-testid="chat-retry-btn"><RotateCcw size={12} /> Retry</button>
            </div>
          )}
          <form className="flex items-end gap-2 border-t border-white/[0.06] p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <label className="flex-1">
              <span className="sr-only">Message</span>
              <textarea rows={2} maxLength={4000} className="field resize-none" placeholder={status?.available === false ? "Assistant unavailable" : "Ask a question… (Enter to send, Shift+Enter for newline)"}
                value={input} onChange={(e) => setInput(e.target.value)} disabled={!status?.available}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} data-testid="chat-input" />
            </label>
            {busy ? (
              <button type="button" className="btn-ghost h-11" onClick={() => ctrl.current?.abort()} aria-label="Stop" data-testid="chat-stop-btn"><Square size={14} /></button>
            ) : (
              <button type="submit" className="btn-primary h-11" disabled={disabled || !input.trim()} aria-label="Send" data-testid="chat-send-btn"><ArrowUp size={16} /></button>
            )}
          </form>
        </div>
        <aside className="space-y-5">
          <StatusLine status={status} />
          <div>
            <p className="eyebrow">Try asking</p>
            <div className="mt-3 flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={s} type="button" disabled={disabled} onClick={() => send(s)} className="panel px-3 py-2.5 text-left text-xs text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-40" data-testid={`chat-suggestion-${i}`}>{s}</button>
              ))}
            </div>
          </div>
          <button type="button" className="btn-ghost btn-sm w-full" onClick={clear} disabled={busy || messages.length === 0} data-testid="chat-clear-btn"><Trash2 size={12} /> Clear conversation</button>
          <p className="text-[11px] leading-relaxed text-white/35">Conversation history is stored server-side against an anonymous session ID kept in your browser. Never share private keys or seed phrases.</p>
        </aside>
      </section>
    </div>
  );
}
