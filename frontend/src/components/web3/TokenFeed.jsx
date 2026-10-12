import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, RefreshCw, Search } from "lucide-react";
import { Notice } from "@/components/common/Primitives";
import { apiFetch } from "@/lib/api";
import { fmtCompactUsd, fmtPct, fmtTime, fmtUsd } from "@/lib/format";

const CHAINS = [["ethereum", "Ethereum"], ["base", "Base"], ["arbitrum", "Arbitrum"], ["optimism", "Optimism"], ["polygon", "Polygon"], ["bsc", "BNB Chain"], ["solana", "Solana"]];
const EVM = /^0x[0-9a-fA-F]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const PairRow = ({ p, i }) => (
  <tr className="border-t border-white/[0.06]" data-testid={`token-pair-${i}`}>
    <td className="py-2.5 pr-2"><span className="text-white">{p.base.symbol}</span><span className="text-white/40">/{p.quote.symbol}</span><span className="block text-[10px] text-white/35">{p.dex} · {p.chain}</span></td>
    <td className="font-mono" data-testid={`token-pair-${i}-price`}>{fmtUsd(p.price_usd)}</td>
    <td className={`font-mono ${p.price_change_24h > 0 ? "text-lab-ok" : p.price_change_24h < 0 ? "text-red-300" : ""}`}>{fmtPct(p.price_change_24h)}</td>
    <td className="font-mono">{fmtCompactUsd(p.liquidity_usd)}</td>
    <td className="font-mono">{fmtCompactUsd(p.volume_24h)}</td>
    <td><a href={p.url} target="_blank" rel="noopener noreferrer" aria-label="View pair on Dexscreener" className="text-white/40 hover:text-lab-cyan"><ArrowUpRight size={13} /></a></td>
  </tr>
);

export const TokenFeed = () => {
  const [mode, setMode] = useState("token");
  const [chain, setChain] = useState("ethereum");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [auto, setAuto] = useState(false);

  const fetchData = useCallback(async (req) => {
    setLoading(true);
    try {
      const path = req.mode === "token" ? `/market/token?chain=${req.chain}&address=${encodeURIComponent(req.q)}` : `/market/search?q=${encodeURIComponent(req.q)}`;
      setData(await apiFetch(path));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!auto || !active) return undefined;
    const id = setInterval(() => { if (!document.hidden) fetchData(active); }, 60000);
    return () => clearInterval(id);
  }, [auto, active, fetchData]);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (mode === "token" && !(chain === "solana" ? SOL : EVM).test(q)) return setError(chain === "solana" ? "Invalid Solana token address." : "Invalid token address: expected 0x followed by 40 hex characters.");
    if (mode === "search" && (q.length < 2 || q.length > 64)) return setError("Search must be 2–64 characters.");
    const req = { mode, chain, q };
    setActive(req); setData(null);
    fetchData(req);
  };

  const pairs = data?.pairs || [];
  return (
    <div className="panel p-5 sm:p-6" data-testid="token-feed">
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow mr-auto">Token price feed · Dexscreener</p>
        {["token", "search"].map((m) => <button key={m} type="button" className="chip" aria-pressed={mode === m} onClick={() => { setMode(m); setError(null); }} data-testid={`token-mode-${m}`}>{m === "token" ? "By address" : "Search"}</button>)}
      </div>
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
        {mode === "token" && (
          <select className="field sm:w-36" value={chain} onChange={(e) => setChain(e.target.value)} aria-label="Chain" data-testid="token-chain-select">
            {CHAINS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}
          </select>
        )}
        <input className="field font-mono text-xs" maxLength={64} placeholder={mode === "token" ? "Token address" : "Symbol or name, e.g. WETH"} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Token query" data-testid="token-query-input" />
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={loading || !query.trim()} data-testid="token-lookup-btn"><Search size={12} /> Look up</button>
      </form>
      {error && <div className="mt-4"><Notice tone="error" testId="token-error">{data ? `Refresh failed — showing data from ${fmtTime(data.fetched_at)}. ` : ""}{error}</Notice></div>}
      {loading && !data && <p className="mt-5 animate-pulse text-xs text-white/40" data-testid="token-loading">Fetching market data…</p>}
      {data && pairs.length === 0 && <p className="mt-5 text-sm text-white/50" data-testid="token-no-results">No trading pairs found on Dexscreener for this query.</p>}
      {pairs.length > 0 && (
        <>
          <div className="scrollbar-thin mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs" data-testid="token-pairs-table">
              <thead className="text-white/40"><tr><th className="pb-2 font-normal">Pair</th><th className="font-normal">Price</th><th className="font-normal">24h</th><th className="font-normal">Liquidity</th><th className="font-normal">Vol 24h</th><th /></tr></thead>
              <tbody>{pairs.map((p, i) => <PairRow key={p.pair_address || i} p={p} i={i} />)}</tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10.5px] text-white/35">
            <span className="mr-auto font-mono" data-testid="token-source-line">{data.source} · {fmtTime(data.fetched_at)}{data.cached ? " (cached ≤30 s)" : ""} · sorted by liquidity · “—” = not provided</span>
            <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-[#8fd9f7]" checked={auto} onChange={(e) => setAuto(e.target.checked)} data-testid="token-auto-refresh" /> Auto-refresh 60 s</label>
            <button type="button" className="inline-flex items-center gap-1 hover:text-white" onClick={() => fetchData(active)} disabled={loading} data-testid="token-refresh-btn"><RefreshCw size={11} className={loading ? "animate-spin" : ""} /> Refresh</button>
          </div>
        </>
      )}
      <p className="mt-4 text-[11px] text-white/35">Prices are not guaranteed real-time and may be missing or stale for illiquid tokens. Not financial advice.</p>
    </div>
  );
};
