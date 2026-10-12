import { CheckCircle2, Copy, Download, Fingerprint, Link2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { copyText, downloadText } from "@/lib/format";

const Status = ({ fingerprint, expected }) => {
  if (!expected) return null;
  if (!fingerprint) return <p className="mt-3 text-xs text-white/50" data-testid="run-record-verifying">Re-running shared configuration to verify…</p>;
  return fingerprint === expected ? (
    <p className="mt-3 flex items-center gap-2 text-xs text-lab-ok" role="status" data-testid="run-record-verified"><CheckCircle2 size={14} /> Verified — this run reproduces the shared fingerprint exactly.</p>
  ) : (
    <p className="mt-3 flex items-center gap-2 text-xs text-red-300" role="alert" data-testid="run-record-mismatch"><XCircle size={14} /> Mismatch — this run does not reproduce the shared fingerprint {expected.slice(0, 12)}…</p>
  );
};

export const RunRecord = ({ record, fingerprint, expected, shareUrl, unverified, filename }) => {
  const copy = async (text, msg) => ((await copyText(text)) ? toast.success(msg) : toast.error("Clipboard unavailable"));
  const download = () =>
    downloadText(filename, JSON.stringify({ ...record, sha256: fingerprint, share_url: shareUrl, not_fingerprinted: unverified, exported_at: new Date().toISOString() }, null, 2), "application/json");

  return (
    <div className="panel p-5" data-testid="run-record">
      <p className="eyebrow flex items-center gap-2"><Fingerprint size={12} /> Verifiable run record</p>
      <p className="mt-3 break-all font-mono text-[12px] text-white/85" data-testid="run-record-fingerprint" title={fingerprint || ""}>
        {fingerprint ? `sha256:${fingerprint}` : window.crypto?.subtle ? "Computing…" : "SHA-256 unavailable in this browser context"}
      </p>
      <Status fingerprint={fingerprint} expected={expected} />
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost btn-sm" disabled={!fingerprint} onClick={() => copy(shareUrl, "Share link copied")} data-testid="run-record-copy-link"><Link2 size={12} /> Copy share link</button>
        <button type="button" className="btn-ghost btn-sm" disabled={!fingerprint} onClick={() => copy(fingerprint, "Fingerprint copied")} data-testid="run-record-copy-fp"><Copy size={12} /> Copy fingerprint</button>
        <button type="button" className="btn-ghost btn-sm" disabled={!fingerprint} onClick={download} data-testid="run-record-download"><Download size={12} /> Download record (.json)</button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-white/35">
        SHA-256 of the canonical JSON of the inputs, parameters and deterministic outputs. Timings are excluded because they vary by device. Opening the share link re-runs the same configuration in the visitor's browser and compares fingerprints. Heuristics that use Math.exp may, rarely, diverge across different JavaScript engines.
      </p>
    </div>
  );
};
