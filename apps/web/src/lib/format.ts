import { formatUnits } from "viem";

// The device locale's decimal separator, e.g. "." (en) or "," (de, fr).
const DECIMAL =
  new Intl.NumberFormat().formatToParts(1.1).find((p) => p.type === "decimal")?.value ?? ".";

/**
 * Exact (string-based, never float) token formatting in the device locale.
 * Truncates rather than rounds, so a displayed amount is never more than the
 * real one. Shows at least 2 and at most `maxFraction` decimals.
 */
export function formatAmount(value: bigint, decimals: number, maxFraction = 2): string {
  const [whole, fraction = ""] = formatUnits(value, decimals).split(".");
  const grouped = BigInt(whole).toLocaleString();
  const frac = fraction.slice(0, maxFraction).padEnd(2, "0").replace(/(\d{2}\d*?)0+$/, "$1");
  return `${grouped}${DECIMAL}${frac}`;
}

export function formatDate(unixSeconds: bigint | number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(Number(unixSeconds) * 1000));
}

/** Date only, e.g. "9 Oct 2026" — for compact list rows. */
export function formatShortDate(unixSeconds: bigint | number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(Number(unixSeconds) * 1000),
  );
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Matured";
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Mirrors SavingsVault._split: fee rounded down, in token base units. */
export function splitFee(amount: bigint, feeBps: bigint) {
  const fee = (amount * feeBps) / 10_000n;
  return { fee, net: amount - fee };
}

export function formatBps(bps: bigint): string {
  return `${(Number(bps) / 100).toFixed(2)}%`;
}
