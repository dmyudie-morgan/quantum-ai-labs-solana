import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Notice, Stat } from "@/components/common/Primitives";
import { GasAlert } from "./GasAlert";
import { apiFetch } from "@/lib/api";
import { fmtNum, fmtTime, fmtUsd, timeAgo } from "@/lib/format";
import { useLocalStorage } from "@/hooks/usePrefs";

const INTERVAL = 30000;

export const ChainMonitor = ({ network, setNetwork, networks }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useLocalStorage("qal-auto-refresh", true);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch("/web3/network-status", { method: "POST", body: { network } });
      setData(d);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [network]);

  useEffect(() => { setData(null); setError(null); load(); }, [load]);
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => { if (!document.hidden) load(); }, INTERVAL);
    return () => clearInterval(id);
  }, [auto, load]);
  useEffect(() => { const id = setInterval(() => tick((t) => t + 1), 5000); return () => clearInterval(id); }, []);

  const stale = Boolean(error && data);
  return (
    <div className="panel p-5 sm:p-6" data-testid="chain-monitor">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <p className="eyebrow">Public chain monitor</p>
          <h2 className="mt-2 text-lg font-medium">Network health &amp; gas</h2>
        </div>
        <label>
          <span className="sr-only">Network</span>
          <select className="field w-48" value={network} onChange={(e) => setNetwork(e.target.value)} data-testid="web3-network-select">
            {(networks.length ? networks : [{ id: network, label: network }]).map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-xs text-white/65">
          <input type="checkbox" className="accent-[#8fd9f7]" checked={auto} onChange={(e) => setAuto(e.target.checked)} data-testid="web3-auto-refresh-toggle" /> Auto-refresh 30 s
        </label>
        <button type="button" className="btn-ghost btn-sm mb-0.5" onClick={load} disabled={loading} data-testid="web3-refresh-btn">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="mt-4"><Notice tone="error" testId="web3-status-error">{stale ? `Latest refresh failed — showing last successful reading from ${fmtTime(data.fetched_at)}. ` : ""}{error}</Notice></div>}

      <div className={`mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 ${stale ? "opacity-60" : ""}`}>
        <Stat label="Chain ID" value={data ? <span className="inline-flex items-center gap-1.5">{data.chain_id}{data.chain_id_verified && <ShieldCheck size={14} className="text-lab-ok" aria-label="verified" />}</span> : "—"} sub={data ? `expected ${data.expected_chain_id} · verified` : loading ? "Loading…" : "Unavailable"} testId="web3-chain-id" />
        <Stat label="Latest block" value={data ? fmtNum(data.block_number) : "—"} sub={data ? `produced ${timeAgo(data.block_timestamp)}` : ""} testId="web3-block-number" />
        <Stat label="Gas price (gwei)" value={data ? fmtNum(data.gas_price_gwei, { maximumFractionDigits: 4 }) : "—"} sub="eth_gasPrice" testId="web3-gas-price" />
        <Stat label="Base fee (gwei)" value={data?.base_fee_gwei != null ? fmtNum(data.base_fee_gwei, { maximumFractionDigits: 4 }) : "—"} sub={data && data.base_fee_gwei == null ? "Not reported" : "EIP-1559"} testId="web3-base-fee" />
        <Stat label={`${data?.symbol || "Native"} price`} value={data?.native ? fmtUsd(data.native.price_usd) : "—"} sub={data ? (data.native ? `${data.native.pair} · Dexscreener` : "Unavailable") : ""} testId="web3-native-price" />
        <Stat label="RPC health" value={data ? `${data.latency_ms} ms` : "—"} sub={data ? data.rpc : ""} testId="web3-rpc-health" />
      </div>

      {data && (
        <p className="mt-3 font-mono text-[10.5px] leading-relaxed text-white/35" data-testid="web3-source-line">
          Source: {data.source} via {data.rpc} · last successful update {fmtTime(data.fetched_at)}{data.cached ? " (served from 10 s cache)" : ""}
        </p>
      )}
      <GasAlert gas={stale ? null : data?.gas_price_gwei} network={data?.label} />
    </div>
  );
};
