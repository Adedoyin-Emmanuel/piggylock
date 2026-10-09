import { targetChain, vaultAddress } from "./env";

/**
 * Goal names are presentation-only and live in this device's localStorage.
 * They are never sent on-chain and have no effect on any vault. Clearing
 * browser data or switching phones loses them; vaults are unaffected.
 */
// "lockbox:" is the app's former name, kept so saved goal names survive the rename.
const storageKey = () =>
  `lockbox:goals:${targetChain.id}:${vaultAddress?.toLowerCase()}`;

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? "{}");
  } catch {
    return {};
  }
}

export function getGoalName(vaultId: bigint): string | undefined {
  return load()[vaultId.toString()];
}

export function saveGoalName(vaultId: bigint, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(
      storageKey(),
      JSON.stringify({ ...load(), [vaultId.toString()]: trimmed }),
    );
  } catch {
    // Storage unavailable (private mode, quota) — names are optional.
  }
}

export const vaultLabel = (vaultId: bigint) =>
  getGoalName(vaultId) ?? `Vault #${vaultId.toString()}`;
