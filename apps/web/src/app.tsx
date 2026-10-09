import { Info, Smartphone, TriangleAlert, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { Address } from "viem";
import { useConnection } from "wagmi";
import { HomeSkeleton } from "./components/skeletons";
import { Button, Notice } from "./components/ui";
import { useAutoConnect } from "./hooks/use-auto-connect";
import { useChainNow } from "./hooks/use-chain-now";
import { useSavings, type VaultView } from "./hooks/use-savings";
import { configError, targetChain } from "./lib/env";
import { vaultLabel } from "./lib/goal-names";
import { vaultStatus, type VaultStatus } from "./lib/vault-status";
import { CreateVault } from "./screens/create-vault";
import { Home } from "./screens/home";
import { VaultDetails } from "./screens/vault-details";

export default function App() {
  const { error: connectError } = useAutoConnect();
  const { address, chainId } = useConnection();

  if (configError) {
    return (
      <Notice icon={<Info />} title="PiggyLock isn't configured">
        {configError}
      </Notice>
    );
  }
  if (!window.ethereum) {
    return (
      <Notice icon={<Smartphone />} title="Open PiggyLock in MiniPay">
        PiggyLock works inside the MiniPay wallet. Open it from MiniPay on your phone.
      </Notice>
    );
  }
  if (connectError) {
    return (
      <Notice icon={<WifiOff />} title="Couldn't connect to MiniPay">
        <p>Make sure MiniPay is unlocked, then try again.</p>
        <Button variant="outline" className="mt-5" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Notice>
    );
  }
  if (!address) {
    // MiniPay connects silently; show the layout skeleton, not "Connecting…".
    return <HomeSkeleton />;
  }
  if (chainId !== targetChain.id) {
    return (
      <Notice icon={<TriangleAlert />} title="Wrong network">
        This version of PiggyLock runs on <strong>{targetChain.name}</strong>, but your wallet is
        on another network{chainId ? ` (chain ${chainId})` : ""}.{" "}
        {targetChain.testnet
          ? "In MiniPay, open Settings → Developer settings, turn on “Use Testnet”, then reopen the app."
          : "Turn off “Use Testnet” in MiniPay's developer settings, then reopen the app."}
      </Notice>
    );
  }
  return <PiggyLock address={address} />;
}

/* ---------------------------------------------------------------- Routing */

type Route = { name: "home" } | { name: "create" } | { name: "vault"; id: bigint };
type StoredRoute = { name: Route["name"]; id?: string };

const toStored = (r: Route): StoredRoute =>
  r.name === "vault" ? { name: "vault", id: r.id.toString() } : { name: r.name };
const fromStored = (s: StoredRoute | undefined): Route =>
  s?.name === "vault" && s.id ? { name: "vault", id: BigInt(s.id) }
  : s?.name === "create" ? { name: "create" }
  : { name: "home" };

/**
 * Screen state mirrored into browser history so the phone's back button /
 * gesture steps back through screens instead of closing the Mini App.
 */
function useRoute() {
  const [route, setRoute] = useState<Route>(() => fromStored(history.state?.piggylock));

  useEffect(() => {
    if (!history.state?.piggylock) {
      history.replaceState({ piggylock: toStored({ name: "home" }) }, "");
    }
    const onPop = (e: PopStateEvent) => setRoute(fromStored(e.state?.piggylock));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: Route, { replace = false } = {}) => {
    const state = { piggylock: toStored(next) };
    if (replace) history.replaceState(state, "");
    else history.pushState(state, "");
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  const goHome = useCallback(() => {
    if (history.state?.piggylock?.name !== "home" && history.length > 1) history.back();
    else navigate({ name: "home" }, { replace: true });
  }, [navigate]);

  return { route, navigate, goHome };
}

/* ------------------------------------------------------------------- App */

function PiggyLock({ address }: { address: Address }) {
  const savings = useSavings(address);
  const now = useChainNow();
  const { route, navigate, goHome } = useRoute();
  useMaturityToasts(savings.vaults, now);

  if (savings.error) {
    return (
      <Notice icon={<WifiOff />} title="Couldn't load your savings">
        <p>
          Check your connection and try again. If this keeps happening, the vault address may be
          wrong for {targetChain.name}.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => savings.retry()}>
          Try again
        </Button>
      </Notice>
    );
  }
  if (!savings.ready) return <HomeSkeleton />;

  switch (route.name) {
    case "create":
      return (
        <CreateVault
          savings={savings}
          address={address}
          now={now}
          onBack={goHome}
          // Replace the form in history so "back" from the new vault goes home.
          onCreated={(id) => navigate({ name: "vault", id }, { replace: true })}
        />
      );
    case "vault":
      return (
        <VaultDetails
          savings={savings}
          address={address}
          vaultId={route.id}
          now={now}
          onBack={goHome}
        />
      );
    default:
      return (
        <Home
          savings={savings}
          address={address}
          now={now}
          onCreate={() => navigate({ name: "create" })}
          onOpen={(id) => navigate({ name: "vault", id })}
        />
      );
  }
}

/** Toast once when a vault matures while the app is open. */
function useMaturityToasts(vaults: VaultView[] | undefined, now: number) {
  const seen = useRef(new Map<string, VaultStatus>());
  useEffect(() => {
    for (const vault of vaults ?? []) {
      const key = vault.id.toString();
      const status = vaultStatus(vault, now);
      if (seen.current.get(key) === "locked" && status === "matured") {
        toast.success(`${vaultLabel(vault.id)} is ready to withdraw.`, { id: `ready-${key}` });
      }
      seen.current.set(key, status);
    }
  }, [vaults, now]);
}
