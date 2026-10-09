import { ArrowUpRight, CalendarClock, CircleCheck, Hash, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Address } from "viem";
import { useConfig, useReadContract } from "wagmi";
import { simulateContract, writeContract } from "wagmi/actions";
import { RowsSkeleton, VaultRowSkeleton } from "../components/skeletons";
import { Button, Card, Row, Screen, Separator } from "../components/ui";
import { StatusBadge, VaultIcon } from "../components/vault";
import type { Savings } from "../hooks/use-savings";
import { phaseLabel, useTransaction } from "../hooks/use-transaction";
import { savingsVaultAbi, vaultAbiWithTokenErrors } from "../lib/abi";
import { vaultAddress } from "../lib/env";
import { formatAmount, formatBps, formatDate } from "../lib/format";
import { getGoalName, vaultLabel } from "../lib/goal-names";
import { unlockAt, vaultStatus } from "../lib/vault-status";

export function VaultDetails({
  savings,
  address,
  vaultId,
  now,
  onBack,
}: {
  savings: Savings;
  address: Address;
  vaultId: bigint;
  now: number;
  onBack: () => void;
}) {
  const config = useConfig();
  const tx = useTransaction();
  const [submitting, setSubmitting] = useState(false);
  const { decimals = 6, symbol = "", feeBps = 0n } = savings;
  const vault = savings.vaults?.find((v) => v.id === vaultId);

  // The contract's own preview is what the withdrawal will actually pay.
  const preview = useReadContract({
    address: vaultAddress,
    abi: savingsVaultAbi,
    functionName: "previewWithdrawal",
    args: [vault?.amount ?? 0n],
    query: { enabled: !!vault, staleTime: Infinity },
  });

  if (!vault) {
    return (
      <Screen title="Vault" onBack={onBack}>
        <VaultRowSkeleton />
        <p className="text-center text-sm text-muted-foreground" role="status">
          Loading this vault… If it doesn't appear shortly, go back and reopen PiggyLock.
        </p>
      </Screen>
    );
  }

  const status = vaultStatus(vault, now);
  const [net, fee] = preview.data ?? [];
  const fmt = (v: bigint) => `${formatAmount(v, decimals, decimals)} ${symbol}`;

  async function withdraw() {
    setSubmitting(true);
    try {
      const receipt = await tx.run("Withdraw", async () => {
        const { request } = await simulateContract(config, {
          account: address,
          address: vaultAddress!,
          abi: vaultAbiWithTokenErrors,
          functionName: "withdraw",
          args: [vaultId],
        });
        return writeContract(config, request);
      });
      if (receipt) {
        await savings.refetchUntil((vaults) => !!vaults.find((v) => v.id === vaultId)?.withdrawn);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title={vaultLabel(vault.id)} onBack={submitting ? undefined : onBack}>
      {/* Summary */}
      <Card className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <VaultIcon status={status} className="size-14 [&>svg]:size-7" />
        <div>
          <p className="text-sm text-muted-foreground">Amount locked</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight tabular-nums">
            {formatAmount(vault.amount, decimals, decimals)}
            <span className="ml-1.5 text-base font-semibold text-muted-foreground">{symbol}</span>
          </p>
        </div>
        <StatusBadge status={status} />
      </Card>

      {status === "locked" && <Countdown seconds={Number(unlockAt(vault)) - now} />}

      <Card className="px-4 py-2">
        <dl>
          <Row
            label={
              <span className="flex items-center gap-2">
                <CalendarClock className="size-4" /> Matures on
              </span>
            }
            value={formatDate(vault.maturity)}
          />
          <Separator />
          <Row
            label={
              <span className="flex items-center gap-2">
                <Hash className="size-4" /> Vault ID
              </span>
            }
            value={vault.id.toString()}
          />
        </dl>
      </Card>

      {status === "locked" && (
        <p className="flex gap-2 rounded-lg bg-accent p-3 text-sm leading-relaxed text-accent-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Locked until maturity. No one — not you, the app's creator, or the fee recipient — can
          withdraw early.
        </p>
      )}

      {status === "matured" && (
        <>
          <Card className="p-4">
            <h2 className="font-bold">Withdrawal</h2>
            {preview.data ? (
              <dl className="mt-1">
                <Row label="Principal" value={fmt(vault.amount)} />
                <Row label={`Fee (${formatBps(feeBps)})`} value={`− ${fmt(fee!)}`} />
                <Separator className="my-1" />
                <Row label="You receive" value={fmt(net!)} strong />
              </dl>
            ) : (
              <RowsSkeleton />
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              The fee goes to the PiggyLock treasury. MiniPay shows the network fee before you
              confirm.
            </p>
          </Card>
          <div className="mt-auto pt-2">
            <Button
              className="w-full"
              onClick={withdraw}
              disabled={net === undefined}
              loading={submitting}
            >
              {!submitting && <ArrowUpRight className="size-5" />}
              {submitting
                ? phaseLabel(tx.phase, "Updating…")
                : net !== undefined
                  ? `Withdraw ${fmt(net)}`
                  : "Loading…"}
            </Button>
          </div>
        </>
      )}

      {status === "withdrawn" && (
        <Card className="flex items-center gap-3 border-primary/30 bg-accent/50 p-4">
          <CircleCheck className="size-6 shrink-0 text-primary" />
          <p className="text-sm">
            <span className="font-semibold">Withdrawn.</span>{" "}
            {net !== undefined ? `${fmt(net)} was sent to your wallet.` : "Sent to your wallet."}
          </p>
        </Card>
      )}

      {!getGoalName(vault.id) && (
        <p className="text-center text-xs text-muted-foreground">
          Goal names are saved on the device that created the vault.
        </p>
      )}
    </Screen>
  );
}

function Countdown({ seconds }: { seconds: number }) {
  const s = Math.max(0, seconds);
  const parts = [
    { label: "days", value: Math.floor(s / 86_400) },
    { label: "hours", value: Math.floor((s % 86_400) / 3600) },
    { label: "mins", value: Math.floor((s % 3600) / 60) },
    { label: "secs", value: s % 60 },
  ];
  return (
    <section aria-label="Time remaining">
      <p className="mb-2 text-sm font-semibold">Unlocks in</p>
      <div className="grid grid-cols-4 gap-2" role="timer" aria-live="off">
        {parts.map((p) => (
          <div key={p.label} className="rounded-xl border bg-card py-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">
              {p.value.toString().padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">{p.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
