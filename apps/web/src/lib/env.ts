import { isAddress, type Address, type Chain } from "viem";
import { celo, celoSepolia, hardhat } from "wagmi/chains";

const SUPPORTED_CHAINS = {
  [celoSepolia.id]: celoSepolia,
  [celo.id]: celo,
  [hardhat.id]: hardhat,
} as const;

const rawChainId = Number(import.meta.env.VITE_CHAIN_ID ?? celoSepolia.id);
const rawVault = import.meta.env.VITE_VAULT_ADDRESS as string | undefined;

const configuredChain =
  SUPPORTED_CHAINS[rawChainId as keyof typeof SUPPORTED_CHAINS];

/** The single chain this build of the app talks to. */
export const targetChain: Chain = configuredChain ?? celoSepolia;
export const isMainnet = targetChain.id === celo.id;

export const vaultAddress: Address | undefined =
  rawVault && isAddress(rawVault) ? rawVault : undefined;

/** Set when the build is misconfigured; the app shows it instead of loading. */
export const configError = !configuredChain
  ? `VITE_CHAIN_ID "${import.meta.env.VITE_CHAIN_ID}" is not a supported chain.`
  : !vaultAddress
    ? "VITE_VAULT_ADDRESS is missing or not a valid address."
    : undefined;

export function explorerTxUrl(hash: string): string | undefined {
  const base = targetChain.blockExplorers?.default.url.replace(/\/$/, "");
  return base ? `${base}/tx/${hash}` : undefined;
}
