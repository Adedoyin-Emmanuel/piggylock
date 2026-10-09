import { useEffect, useState } from "react";
import { useBlock } from "wagmi";

/**
 * Current time in unix seconds, ticking every second. Used once at the app
 * root and passed down so every screen shares one clock.
 *
 * - Mobile WebViews pause timers in the background, so the clock also
 *   refreshes the moment the app becomes visible or focused again.
 * - If the chain's clock is ahead of the device (e.g. a local node after
 *   `advance-time`), follow the chain so maturity is judged the way the
 *   contract will judge it.
 */
export function useChainNow(): number {
  const { data: block, dataUpdatedAt } = useBlock({
    query: { refetchInterval: 30_000 },
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const offset = block
    ? Math.max(0, Number(block.timestamp) - dataUpdatedAt / 1000)
    : 0;
  return Math.floor(now / 1000 + offset);
}
