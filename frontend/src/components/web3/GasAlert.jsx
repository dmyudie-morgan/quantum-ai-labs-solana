import { useEffect, useState } from "react";
import { AlertTriangle, BellRing } from "lucide-react";
import { toast } from "sonner";
import { useGasNotifications } from "@/hooks/useGasNotifications";

const PERM_NOTE = {
  granted: "Browser notifications allowed.",
  denied: "Notifications are blocked for this site — allow them in your browser's site settings to use this.",
  default: "You'll be asked for permission when you enable this.",
  unsupported: "This browser does not support the Notification API.",
};

export const GasAlert = ({ gas, network, cfg, setCfg }) => {
  const [draft, setDraft] = useState(String(cfg.threshold));
  useEffect(() => setDraft(String(cfg.threshold)), [cfg.threshold]);

  const commit = (v) => {
    const t = parseFloat(v);
    if (Number.isFinite(t) && t >= 0) setCfg({ ...cfg, threshold: t });
  };
  const active = cfg.enabled && gas != null && (cfg.direction === "above" ? gas > cfg.threshold : gas < cfg.threshold);
  const message = active ? `${network} gas is ${gas.toLocaleString(undefined, { maximumFractionDigits: 4 })} gwei — ${cfg.direction} your ${cfg.threshold} gwei threshold.` : "";
  const { perm, toggle, test } = useGasNotifications({ active, message, cfg, setCfg });

  return (
    <div className="mt-6 border-t border-white/[0.06] pt-5" data-testid="gas-alert">
      <div className="flex flex-wrap items-end gap-3">
        <p className="mr-auto flex items-center gap-2 text-sm"><BellRing size={14} className="text-lab-violet" /> Gas alert</p>
        <label className="flex items-center gap-2 pb-2.5 text-xs text-white/65">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} data-testid="gas-alert-enabled" /> Enabled
        </label>
        <label>
          <span className="sr-only">Alert direction</span>
          <select className="field w-36" value={cfg.direction} onChange={(e) => setCfg({ ...cfg, direction: e.target.value })} data-testid="gas-alert-direction">
            <option value="above">Warn above</option>
            <option value="below">Warn below</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="sr-only">Threshold in gwei</span>
          <input type="number" min="0" step="any" className="field w-28 font-mono" value={draft} onChange={(e) => { setDraft(e.target.value); commit(e.target.value); }} data-testid="gas-alert-threshold" aria-label="Gas alert threshold in gwei" />
          <span className="font-mono text-[11px] text-white/40">gwei</span>
        </label>
      </div>
      {active && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-[3px] border border-amber-300/40 bg-amber-300/[0.08] px-3 py-2.5 text-sm text-amber-100" data-testid="gas-alert-banner">
          <AlertTriangle size={15} className="shrink-0" />
          {message}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3" data-testid="gas-notify-controls">
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={Boolean(cfg.notify)} disabled={!cfg.enabled || perm === "unsupported" || perm === "denied"} onChange={(e) => toggle(e.target.checked)} data-testid="gas-notify-toggle" />
          Browser notification when the alert triggers while this tab is in the background
        </label>
        {cfg.notify && perm === "granted" && (
          <button type="button" className="btn-ghost btn-sm" onClick={() => (test() ? toast.success("Test notification sent") : toast.error("This browser blocked the notification"))} data-testid="gas-notify-test-btn">Send test notification</button>
        )}
        <span className="text-[11px] text-white/40" data-testid="gas-notify-permission">{PERM_NOTE[perm] || PERM_NOTE.default}</span>
      </div>
      <p className="mt-3 text-[11px] text-white/35" data-testid="gas-alert-note">
        Compares the latest eth_gasPrice reading with your threshold. Preferences are stored in this browser. With notifications on, the monitor keeps refreshing every 30 s even when the tab is hidden; browsers may throttle hidden tabs to about once a minute. Nothing runs once the tab or browser is closed — there is no server-side alerting.
      </p>
    </div>
  );
};
