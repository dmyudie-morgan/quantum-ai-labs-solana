export const fmtNum = (v, opts = {}) =>
  v === null || v === undefined || Number.isNaN(v) ? "—" : Number(v).toLocaleString(undefined, opts);

export function fmtUsd(v) {
  if (v === null || v === undefined) return "—";
  if (Math.abs(v) >= 1) return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${Number(v).toPrecision(4)}`;
}

export function fmtCompactUsd(v) {
  if (v === null || v === undefined) return "—";
  return `$${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 2 }).format(v)}`;
}

export const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}%`);

export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString() : "—");

export function timeAgo(unixSeconds) {
  if (!unixSeconds) return "—";
  const s = Math.max(0, Math.round(Date.now() / 1000 - unixSeconds));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)}m ago`;
}

export const shortHex = (h) => (h ? `${h.slice(0, 6)}…${h.slice(-4)}` : "—");

export function downloadText(filename, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
