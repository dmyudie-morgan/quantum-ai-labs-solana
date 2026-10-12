/* eslint-disable no-restricted-globals */
import { runAll } from "../lib/qfieldRun";

self.onmessage = (e) => {
  let last = 0;
  let stage = null;
  try {
    const results = runAll(e.data, (s, p) => {
      const now = performance.now();
      if (s !== stage || now - last > 100) {
        stage = s;
        last = now;
        self.postMessage({ type: "progress", stage: s, p });
      }
    });
    self.postMessage({ type: "done", results });
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.message || err) });
  }
};
