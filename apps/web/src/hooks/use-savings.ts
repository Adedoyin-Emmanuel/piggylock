import { erc20Abi, type Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { savingsVaultAbi } from "../lib/abi";
import { vaultAddress } from "../lib/env";

export interface VaultView {
  id: bigint;
  amount: bigint;
  maturity: bigint;
  withdrawn: boolean;
}

// Public RPCs are load-balanced; a node can lag a block or two behind the one
// that confirmed our transaction. Poll as a safety net, and after our own
// transactions retry until the change is visible.
const REFRESH_MS = 15_000;
const RETRY_MS = 1_500;
const RETRIES = 10;

type GetVaultsResult = readonly [
  readonly bigint[],
  readonly { amount: bigint; maturity: bigint | number; withdrawn: boolean }[],
];

function toList(data: GetVaultsResult | undefined): VaultView[] | undefined {
  return data?.[0].map((id, i) => ({
    id,
    amount: data[1][i].amount,
    maturity: BigInt(data[1][i].maturity),
    withdrawn: data[1][i].withdrawn,
  }));
}

/**
 * All on-chain state the UI needs. The vault contract is the source of truth:
 * the accepted token, its decimals and the fee rate are read from it, never
 * hard-coded in the frontend.
 */
export function useSavings(owner: Address) {
  const vault = { address: vaultAddress!, abi: savingsVaultAbi } as const;

  const settings = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...vault, functionName: "token" },
      { ...vault, functionName: "feeBps" },
      { ...vault, functionName: "minLockDuration" },
    ],
    query: { staleTime: Infinity }, // immutable on-chain
  });
  const [tokenAddress, feeBps, minLockDuration] = settings.data ?? [];

  const token = useReadContracts({
    allowFailure: false,
    contracts: [
      { address: tokenAddress, abi: erc20Abi, functionName: "decimals" },
      { address: tokenAddress, abi: erc20Abi, functionName: "symbol" },
      { address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [owner] },
    ],
    query: { enabled: !!tokenAddress, refetchInterval: REFRESH_MS },
  });
  const [decimals, symbol, balance] = token.data ?? [];

  const vaults = useReadContract({
    ...vault,
    functionName: "getVaults",
    args: [owner],
    query: { refetchInterval: REFRESH_MS },
  });

  const list = toList(vaults.data);

  /** Refetch until `done(vaults)` holds — e.g. a just-created vault appears. */
  async function refetchUntil(done: (vaults: VaultView[]) => boolean) {
    for (let i = 0; i < RETRIES; i++) {
      const [, result] = await Promise.all([token.refetch(), vaults.refetch()]);
      const latest = toList(result.data);
      if (latest && done(latest)) return true;
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
    }
    return false;
  }

  const ready =
    tokenAddress !== undefined &&
    feeBps !== undefined &&
    minLockDuration !== undefined &&
    decimals !== undefined &&
    symbol !== undefined &&
    balance !== undefined &&
    list !== undefined;

  return {
    ready,
    // Only a failure with nothing to show is fatal. A failed background
    // refresh keeps the last good data on screen instead of blanking the app.
    error: ready ? null : (settings.error ?? token.error ?? vaults.error),
    retry: () => Promise.all([settings.refetch(), token.refetch(), vaults.refetch()]),
    tokenAddress,
    feeBps,
    minLockDuration,
    decimals,
    symbol,
    balance,
    vaults: list,
    refetchUntil,
  };
}

export type Savings = ReturnType<typeof useSavings>;
