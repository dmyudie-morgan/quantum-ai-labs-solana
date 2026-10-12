import { useEffect, useRef, useState } from "react";

const supported = () => typeof window !== "undefined" && "Notification" in window;

export function useGasNotifications({ active, message, cfg, setCfg }) {
  const [perm, setPerm] = useState(() => (supported() ? Notification.permission : "unsupported"));
  const prev = useRef(active);

  const notify = (body) => {
    try {
      new Notification("Quantum AI Labs — gas alert", { body, icon: "/brand/favicon-192.png", tag: "qal-gas-alert" });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (active && !prev.current && cfg.notify && perm === "granted" && document.hidden) notify(message);
    prev.current = active;
  }, [active, message, cfg.notify, perm]);

  const toggle = async (on) => {
    if (!on) return setCfg({ ...cfg, notify: false });
    if (!supported()) return undefined;
    let p = Notification.permission;
    if (p === "default") p = await Notification.requestPermission();
    setPerm(p);
    setCfg({ ...cfg, notify: p === "granted" });
    return undefined;
  };

  return { perm, toggle, test: () => notify("Test notification — gas alerts will appear like this while this tab is in the background.") };
}
