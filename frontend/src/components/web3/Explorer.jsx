import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { Notice } from "@/components/common/Primitives";
import { apiFetch } from "@/lib/api";
import { fmtNum, fmtTime } from "@/lib/format";

const ADDR = /^0x[0-9a-fA-F]{40}$/;
const HASH = /^0x[0-9a-fA-F]{64}$/;
const TABS = [
  { id: "address", label: "Address", ph: "0x… (40 hex characters)" },
  { id: "tx", label: "Transaction", ph: "0x… (64 hex characters)" },
  { id: "token", label: "Token contract", ph: "ERC-20 contract 0x…" },
];

const Row = ({ k, v, testId }) => (
  <div className="flex justify-between gap-4 border-t border-white/[0.06] py-2 text-xs">
    <span className="text-white/45">{k}</span>
    <span className="break-all text-right font-mono text-white/85" data-testid={testId}>{v ?? "—"}</span>
  </div>
);

function rows(tab, r) {
  if (tab === "address") return [["Balance", `${r.balance} ${r.symbol}`, "balance"], ["Transactions sent (nonce)", fmtNum(r.tx_count), "nonce"], ["Type", r.is_contract ? "Contract" : "Externally owned account", "type"]];
  if (tab === "tx") return [["Status", r.status, "status"], ["Block", r.block_number ? fmtNum(r.block_number) : "Pending", "block"], ["From", r.from, "from"], ["To", r.to || "Contract creation", "to"], ["Value", `${r.value} ${r.symbol}`, "value"], ["Gas used", fmtNum(r.gas_used), "gas"], ["Effective gas price", r.effective_gas_price_gwei != null ? `${r.effective_gas_price_gwei} gwei` : "—", "gasprice"]];
  return [["Name", r.name, "name"], ["Symbol", r.symbol, "symbol"], ["Decimals", r.decimals, "decimals"], ["Total supply", r.total_supply, "supply"], ...(r.holder ? [["Holder balance", r.holder_balance, "holder"]] : []), ["ERC-20 interface", r.erc20_like ? "Detected" : "Not detected", "erc20"]];
}

export const Explorer = ({ network, networks }) => {
  const [tab, setTab] = useState("address");
  const [value, setValue] = useState("");
  const [holder, setHolder] = useState("");
  const [state, setState] = useState({ loading: false, error: null, result: null });
  const label = networks.find((n) => n.id === network)?.label || network;

  const lookup = async (e) => {
    e.preventDefault();
    const v = value.trim();
    const h = holder.trim();
    const valid = tab === "tx" ? HASH.test(v) : ADDR.test(v);
    if (!valid) return setState({ loading: false, result: null, error: tab === "tx" ? "Invalid transaction hash: expected 0x followed by 64 hex characters." : "Invalid address: expected 0x followed by 40 hex characters." });
    if (tab === "token" && h && !ADDR.test(h)) return setState({ loading: false, result: null, error: "Invalid holder address." });
    setState({ loading: true, error: null, result: null });
    const path = { address: "/web3/address", tx: "/web3/tx", token: "/web3/token" }[tab];
    const body = { address: { network, address: v }, tx: { network, hash: v }, token: { network, contract: v, holder: h || undefined } }[tab];
    try {
      setState({ loading: false, error: null, result: { tab, ...(await apiFetch(path, { method: "POST", body })) } });
    } catch (err) {
      setState({ loading: false, error: err.message, result: null });
    }
  };

  const r = state.result;
  return (
    <div className="panel p-5 sm:p-6" data-testid="web3-explorer">
      <p className="eyebrow">Read-only explorer · {label}</p>
      <div className="mt-3 flex gap-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className="chip" aria-pressed={tab === t.id} onClick={() => { setTab(t.id); setState({ loading: false, error: null, result: null }); }} data-testid={`explorer-tab-${t.id}`}>{t.label}</button>
        ))}
      </div>
      <form className="mt-4 space-y-2" onSubmit={lookup}>
        <label className="block"><span className="sr-only">{TABS.find((t) => t.id === tab).label}</span>
          <input className="field font-mono text-xs" maxLength={80} placeholder={TABS.find((t) => t.id === tab).ph} value={value} onChange={(e) => setValue(e.target.value)} data-testid="explorer-input" />
        </label>
        {tab === "token" && <input className="field font-mono text-xs" maxLength={64} placeholder="Optional holder address 0x…" value={holder} onChange={(e) => setHolder(e.target.value)} data-testid="explorer-holder-input" aria-label="Optional holder address" />}
        <button type="submit" className="btn-primary btn-sm" disabled={state.loading || !value.trim()} data-testid="explorer-lookup-btn"><Search size={12} /> {state.loading ? "Looking up…" : "Look up"}</button>
      </form>
      {state.error && <div className="mt-4"><Notice tone="error" testId="explorer-error">{state.error}</Notice></div>}
      {r && r.tab === tab && (
        <div className="mt-5" data-testid="explorer-result">
          {rows(tab, r).map(([k, v, id]) => <Row key={id} k={k} v={v} testId={`explorer-result-${id}`} />)}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-white/35">
            <span className="font-mono">via {r.rpc} · chain ID {r.chain_id} verified · {fmtTime(r.fetched_at)}</span>
            <a href={r.explorer_url} target="_blank" rel="noopener noreferrer" className="link-arrow text-[11px]" data-testid="explorer-external-link">Open in block explorer <ArrowUpRight size={11} /></a>
          </div>
        </div>
      )}
    </div>
  );
};
