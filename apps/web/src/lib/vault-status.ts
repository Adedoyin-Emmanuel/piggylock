import type { VaultView } from "../hooks/use-savings";

export type VaultStatus = "locked" | "matured" | "withdrawn";

/**
 * Seconds to wait past maturity before offering withdrawal. The pre-sign
 * simulation runs against the chain's latest block, which can trail the
 * device clock by a second or two (Celo makes a block about every second).
 */
const GRACE_SECONDS = 3n;

/** When the UI treats a vault as withdrawable (unix seconds). */
export const unlockAt = (vault: Pick<VaultView, "maturity">) => vault.maturity + GRACE_SECONDS;

export function vaultStatus(
  vault: Pick<VaultView, "maturity" | "withdrawn">,
  now: number,
): VaultStatus {
  if (vault.withdrawn) return "withdrawn";
  return BigInt(now) >= unlockAt(vault) ? "matured" : "locked";
}
