import { ChevronRight, PiggyBank, Plus, ShieldCheck, Wallet } from "lucide-react";
import type { Address } from "viem";
import { ThemeToggle } from "../components/theme-toggle";
import { Badge, Button, Card, Screen } from "../components/ui";
import { StatusBadge, VaultIcon } from "../components/vault";
import type { Savings } from "../hooks/use-savings";
import { isMainnet, targetChain } from "../lib/env";
import { formatAmount, formatCountdown, formatDate } from "../lib/format";
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

  const active = vaults.filter((v) => !v.withdrawn);
  const totalLocked = active.reduce((sum, v) => sum + v.amount, 0n);
  const readyCount = active.filter((v) => vaultStatus(v, now) === "matured").length;

  const sorted = [...vaults].sort((a, b) => {
    const byStatus = ORDER[vaultStatus(a, now)] - ORDER[vaultStatus(b, now)];
    return byStatus || (a.maturity < b.maturity ? -1 : a.maturity > b.maturity ? 1 : 0);
  });

  return (
    <Screen
      // Visually hidden: the summary card leads the screen; the page keeps a heading.
      title={<span className="sr-only">PiggyLock</span>}
      actions={
        <>
          {targetChain.testnet && <Badge variant="warning">Testnet</Badge>}
          <ThemeToggle />
        </>
      }
    >
      {/* Hero */}
      <section
        aria-label="Savings summary"
        className="relative overflow-hidden rounded-2xl bg-linear-to-br from-hero-from to-hero-to p-5 text-white"
      >
        <div aria-hidden className="absolute -top-12 -right-10 size-40 rounded-full bg-white/10" />
        <div aria-hidden className="absolute -right-4 -bottom-16 size-32 rounded-full bg-white/5" />
        <p className="relative flex items-center gap-1.5 text-sm font-medium text-white/85">
          <ShieldCheck className="size-4" /> Total locked
        </p>
        <p className="relative mt-1 text-4xl font-extrabold tracking-tight tabular-nums">
          {formatAmount(totalLocked, decimals)}
          <span className="ml-1.5 text-lg font-semibold text-white/85">{symbol}</span>
        </p>
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-medium">
            <Wallet className="size-3.5" />
            <span className="tabular-nums">
              {formatAmount(balance, decimals)} {symbol}
            </span>{" "}
            available
          </span>
          {readyCount > 0 && (
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-hero-to">
              {readyCount} ready to withdraw
            </span>
          )}
        </div>
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
            You need {symbol} to create a vault. On testnet, mint some with the project's mint
            script.
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
                  <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                    {status === "locked"
                      ? `Unlocks in ${formatCountdown(Number(unlockAt(vault)) - now)}`
                      : status === "matured"
                        ? "Ready to withdraw"
                        : `Matured ${formatDate(vault.maturity)}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p
                    className={
                      "font-bold tabular-nums " + (status === "withdrawn" ? "text-muted-foreground" : "")
                    }
                  >
                    {formatAmount(vault.amount, decimals)}
                  </p>
                  <StatusBadge status={status} />
                </div>
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
