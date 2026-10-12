import { useEffect, useState } from "react";
import { LabTabs, Notice, PageHeader } from "@/components/common/Primitives";
import { ChainMonitor } from "@/components/web3/ChainMonitor";
import { Explorer } from "@/components/web3/Explorer";
import { TokenFeed } from "@/components/web3/TokenFeed";
import { apiFetch } from "@/lib/api";
import { useLocalStorage } from "@/hooks/usePrefs";

export default function Web3() {
  const [networks, setNetworks] = useState([]);
  const [netError, setNetError] = useState(null);
  const [network, setNetwork] = useLocalStorage("qal-network", "ethereum");

  useEffect(() => {
    apiFetch("/web3/networks").then((d) => setNetworks(d.networks)).catch((e) => setNetError(e.message));
  }, []);

  return (
    <div data-testid="web3-page">
      <PageHeader eyebrow="Utility · Web3 Solutions" title="Public chain data, read-only and verified." intro="Monitor EVM networks over public JSON-RPC, look up addresses, transactions and tokens, track market data from Dexscreener and set a gas alert. No wallet connection, no signing.">
        <LabTabs />
      </PageHeader>
      <section className="lab-container space-y-6 py-10">
        {netError && <Notice tone="error" testId="web3-networks-error">Could not load network list: {netError}</Notice>}
        <ChainMonitor network={network} setNetwork={setNetwork} networks={networks} />
        <div className="grid gap-6 xl:grid-cols-2">
          <Explorer network={network} networks={networks} />
          <TokenFeed />
        </div>
        <Notice testId="web3-disclaimer">
          Data comes from free public endpoints, which may be rate limited, lag behind the chain or be temporarily unavailable. Values are never estimated or filled in when a source fails. Market data is informational only and is not financial advice.
        </Notice>
      </section>
    </div>
  );
}
