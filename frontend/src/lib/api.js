export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function errorMessage(data, status) {
  const d = data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return `Invalid input: ${d[0].msg}`;
  return `Request failed (HTTP ${status})`;
}

export async function apiFetch(path, { method = "GET", body, timeout = 15000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(API + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(errorMessage(data, res.status));
    return data;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("The request timed out. Please retry.");
    if (e instanceof TypeError) throw new Error("Network error: the server could not be reached.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function streamSSE(path, body, { onDelta, signal, timeout = 120000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort("timeout"), timeout);
  signal?.addEventListener("abort", () => ctrl.abort("user"));
  try {
    const res = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(errorMessage(await res.json().catch(() => null), res.status));
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, i);
        buf = buf.slice(i + 2);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const ev = JSON.parse(line.slice(5).trim());
          if (ev.error) throw new Error(ev.error);
          if (ev.delta) onDelta(ev.delta);
          if (ev.done) return;
        }
      }
    }
  } catch (e) {
    if (ctrl.signal.aborted) throw new Error(ctrl.signal.reason === "user" ? "Stopped." : "The request timed out. Please retry.");
    if (e instanceof TypeError) throw new Error("Network error: the server could not be reached.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
