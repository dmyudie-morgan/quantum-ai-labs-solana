import { useEffect, useState } from "react";
import { AlertTriangle, BellRing } from "lucide-react";
import { useLocalStorage } from "@/hooks/usePrefs";

export const GasAlert = ({ gas, network }) => {
  const [cfg, setCfg] = useLocalStorage("qal-gas-alert", { enabled: true, threshold: 20, direction: "above" });
  const [draft, setDraft] = useState(String(cfg.threshold));
  useEffect(() => setDraft(String(cfg.threshold)), [cfg.threshold]);

  const commit = (v) => {
    const t = parseFloat(v);
    if (Number.isFinite(t) && t >= 0) setCfg({ ...cfg, threshold: t });
  };
  const active = cfg.enabled && gas != null && (cfg.direction === "above" ? gas > cfg.threshold : gas < cfg.threshold);

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
          {network} gas is {gas.toLocaleString(undefined, { maximumFractionDigits: 4 })} gwei — {cfg.direction} your {cfg.threshold} gwei threshold.
        </div>
      )}
      <p className="mt-3 text-[11px] text-white/35" data-testid="gas-alert-note">
        Compares the latest eth_gasPrice reading with your threshold. Preferences are stored in this browser. Alerts only update while this page is open — there are no background notifications.
      </p>
    </div>
  );
};
