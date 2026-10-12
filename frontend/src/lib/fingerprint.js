import { useEffect, useState } from "react";

export function canonical(v) {
  if (Array.isArray(v) || ArrayBuffer.isView(v)) return `[${Array.from(v, canonical).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

export async function sha256Hex(text) {
  if (!window.crypto?.subtle) return null;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const encodeParam = (obj) => btoa(canonical(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function decodeParam(s) {
  try {
    return JSON.parse(atob(s.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export const isFingerprint = (s) => typeof s === "string" && /^[0-9a-f]{64}$/.test(s);

export function useFingerprint(record) {
  const [fp, setFp] = useState(null);
  useEffect(() => {
    let live = true;
    setFp(null);
    if (record) sha256Hex(canonical(record)).then((h) => live && setFp(h));
    return () => { live = false; };
  }, [record]);
  return fp;
}
