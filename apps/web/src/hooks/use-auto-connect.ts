import { useEffect, useRef } from "react";
import { useConnect, useConnection, useConnectors } from "wagmi";

/** MiniPay requires connecting automatically on load — never a button. */
export function useAutoConnect() {
  const connectors = useConnectors();
  const { status } = useConnection();
  const { connect, error } = useConnect();
  const attempted = useRef(false);

  useEffect(() => {
    const [connector] = connectors;
    if (attempted.current || !connector || !window.ethereum) return;
    // "connecting"/"reconnecting": wagmi is restoring a previous session
    // (e.g. after a page reload). Only connect from a clean slate.
    if (status !== "disconnected") return;
    attempted.current = true;
    connect({ connector });
  }, [connectors, connect, status]);

  // Racing a restored session is harmless; don't surface it as a failure.
  const failed = error && error.name !== "ConnectorAlreadyConnectedError";
  return { error: failed ? error : null };
}
