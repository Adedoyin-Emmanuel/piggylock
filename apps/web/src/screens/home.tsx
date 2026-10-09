import { ChevronRight, Eye, EyeOff, PiggyBank, Plus, ShieldCheck, Wallet } from "lucide-react";
import type { Address } from "viem";
import { Button, Card, Screen } from "../components/ui";
import { VaultIcon } from "../components/vault";
import { useHideBalances } from "../hooks/use-hide-balances";
import type { Savings } from "../hooks/use-savings";
import { isMainnet, targetChain } from "../lib/env";
import { formatAmount, formatCountdown, formatShortDate } from "../lib/format";
import { vaultLabel } from "../lib/goal-names";
import { unlockAt, vaultStatus } from "../lib/vault-status";

const ORDER = { matured: 0, locked: 1, withdrawn: 2 };

export function Home({
  savings,
  address,
  now,
  onCreate,
  onOpen,
}: {
  savings: Savings;
  address: Address;
  now: number;
  onCreate: () => void;
  onOpen: (id: bigint) => void;
}) {
  const { vaults = [], decimals = 6, symbol = "", balance = 0n } = savings;
  const { hidden, toggle } = useHideBalances();
  const MASK = "••••";
  const show = (value: bigint) => (hidden ? MASK : formatAmount(value, decimals));

  const active = vaults.filter((v) => !v.withdrawn);
  const totalLocked = active.reduce((sum, v) => sum + v.amount, 0n);

  const sorted = [...vaults].sort((a, b) => {
    const byStatus = ORDER[vaultStatus(a, now)] - ORDER[vaultStatus(b, now)];
    return byStatus || (a.maturity < b.maturity ? -1 : a.maturity > b.maturity ? 1 : 0);
  });

  return (
    <Screen
      title="PiggyLock"
    >
      {/* Hero */}
      <section
        aria-label="Savings summary"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-hero-from to-hero-to p-5 text-white"
      >
        <div aria-hidden className="absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 -bottom-16 size-32 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium text-white/85">
            <ShieldCheck className="size-4" /> Total locked
          </p>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={hidden}
            aria-label={hidden ? "Show balances" : "Hide balances"}
            className="-mt-2 -mr-2 flex size-11 items-center justify-center rounded-full text-white/85 transition-colors outline-none hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-white/40"
          >
            {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
        <p className="relative mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
          {show(totalLocked)}
          <span className="ml-1.5 text-lg font-semibold text-white/85">{symbol}</span>
        </p>
        <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
          <Wallet className="size-3.5" />
          <span className="tabular-nums">
            {show(balance)} {symbol}
          </span>
          available
        </p>
      </section>

      <Button onClick={onCreate} disabled={balance === 0n}>
        <Plus className="size-5" /> New savings vault
      </Button>
      {balance === 0n &&
        (isMainnet ? (
          <a
            href="https://link.minipay.xyz/add_cash?tokens=USDT"
            className="-mt-1 text-center text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Add USDT to get started
          </a>
        ) : (
          <p className="-mt-1 text-center text-sm text-muted-foreground">
            You need {symbol} to create a vault. Get free test {symbol} at faucet.circle.com.
          </p>
        ))}

      {/* Vault list */}
      <section aria-label="Your vaults" className="flex flex-col gap-2.5">
        <div className="mt-2 flex items-center justify-between">
          <h2 className="font-bold">Your vaults</h2>
          {vaults.length > 0 && (
            <span className="text-sm text-muted-foreground">{vaults.length} total</span>
          )}
        </div>

        {sorted.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <PiggyBank className="size-6" />
            </div>
            <div>
              <p className="font-semibold">No vaults yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Lock some savings until a date you choose. Not even you can touch them early.
              </p>
            </div>
          </Card>
        ) : (
          sorted.map((vault) => {
            const status = vaultStatus(vault, now);
            return (
              <Card
                key={vault.id.toString()}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(vault.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(vault.id)}
                className={
                  "flex items-center gap-3 p-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-muted " +
                  (status === "matured" ? "border-primary/40 bg-accent/40" : "")
                }
              >
                <VaultIcon status={status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{vaultLabel(vault.id)}</p>
                  <p
                    className={
                      "mt-0.5 truncate text-sm tabular-nums " +
                      (status === "matured" ? "font-semibold text-primary" : "text-muted-foreground")
                    }
                  >
                    {status === "locked"
                      ? `Unlocks in ${formatCountdown(Number(unlockAt(vault)) - now)}`
                      : status === "matured"
                        ? "Ready to withdraw"
                        : `Withdrawn · ${formatShortDate(vault.maturity)}`}
                  </p>
                </div>
                <p
                  className={
                    "shrink-0 text-right font-bold tabular-nums " +
                    (status === "withdrawn" ? "text-muted-foreground" : "")
                  }
                >
                  {show(vault.amount)}
                  <span className="block text-xs font-medium text-muted-foreground">{symbol}</span>
                </p>
                <ChevronRight aria-hidden className="-mr-1 size-4 text-muted-foreground" />
              </Card>
            );
          })
        )}
      </section>

      <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        {targetChain.name} · {address.slice(0, 6)}…{address.slice(-4)}
      </footer>
    </Screen>
  );
}
