/* eslint-disable no-restricted-globals */
import { runAll } from "../lib/qfieldRun";

self.onmessage = (e) => {
  let last = 0;
  let stage = null;
  let stageStart = 0;
  try {
    const results = runAll(e.data, (s, p, best) => {
      const now = performance.now();
      if (s !== stage) { stage = s; stageStart = now; }
      if (p === 0 || p === 1 || now - last > 80) {
        last = now;
        self.postMessage({ type: "progress", stage: s, p, best, t: now - stageStart });
      }
    });
    self.postMessage({ type: "done", results });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.message || err) });
  }
};
