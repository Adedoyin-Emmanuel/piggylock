import { http } from "viem";
import { createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { targetChain } from "./env";

// MiniPay injects window.ethereum; the injected connector picks it up.
// Reads go over HTTP to the chain's public RPC; signing goes to the wallet.
export const config = createConfig({
  chains: [targetChain],
  connectors: [injected()],
  // VITE_RPC_URL optionally overrides the chain's default public RPC.
  transports: { [targetChain.id]: http(import.meta.env.VITE_RPC_URL || undefined) },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
