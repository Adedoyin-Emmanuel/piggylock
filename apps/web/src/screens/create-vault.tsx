import { CalendarClock, Info, Lock, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { erc20Abi, formatUnits, parseEventLogs, parseUnits, type Address } from "viem";
import { useConfig } from "wagmi";
import { readContract, simulateContract, writeContract } from "wagmi/actions";
import { DetailRow } from "../components/detail-row";
import { Screen } from "../components/screen";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { Separator } from "../components/ui/separator";
import type { Savings } from "../hooks/use-savings";
import { phaseLabel, useTransaction } from "../hooks/use-transaction";
import { savingsVaultAbi, vaultAbiWithTokenErrors } from "../lib/abi";
import { isMainnet, vaultAddress } from "../lib/env";
import { formatAmount, formatBps, formatDate, splitFee } from "../lib/format";
import { readAtFreshBlock } from "../lib/fresh-reads";
import { saveGoalName } from "../lib/goal-names";

const DAY = 86_400;
const DURATIONS = [
  { label: "1 minute", seconds: 60, testOnly: true },
  { label: "5 minutes", seconds: 300, testOnly: true },
  { label: "1 week", seconds: 7 * DAY },
  { label: "1 month", seconds: 30 * DAY },
  { label: "3 months", seconds: 90 * DAY },
  { label: "6 months", seconds: 180 * DAY },
  { label: "1 year", seconds: 365 * DAY },
];
const MAX_NAME = 40;

/** Parse a user-typed decimal into token base units, or explain why not. */
function parseAmount(input: string, decimals: number): bigint | string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  if (!/^\d*\.?\d*$/.test(value) || value === ".") return "Enter a number, like 25 or 10.50.";
  const fraction = value.split(".")[1] ?? "";
  if (fraction.length > decimals) return `Use at most ${decimals} decimal places.`;
  const amount = parseUnits(value, decimals);
  if (amount === 0n) return "Enter an amount greater than zero.";
  return amount;
}

export function CreateVault({
  savings,
  address,
  now,
  onBack,
  onCreated,
}: {
  savings: Savings;
  address: Address;
  now: number;
  onBack: () => void;
  onCreated: (id: bigint) => void;
}) {
  const config = useConfig();
  const tx = useTransaction();
  const ids = { name: useId(), amount: useId(), duration: useId() };
  const {
    decimals = 6,
    symbol = "",
    balance = 0n,
    feeBps = 0n,
    minLockDuration = 0n,
    tokenAddress,
  } = savings;

  const durations = DURATIONS.filter(
    (d) => d.seconds >= Number(minLockDuration) && !(d.testOnly && isMainnet),
  );

  const [name, setName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [duration, setDuration] = useState(
    () => durations.find((d) => !d.testOnly)?.seconds ?? durations[0]?.seconds ?? 0,
  );
  const [understood, setUnderstood] = useState(false);
  // Covers the whole approve → lock → refresh flow, not just one transaction,
  // so the form can't be submitted twice.
  const [submitting, setSubmitting] = useState(false);

  const parsed = parseAmount(amountInput, decimals);
  const amount = typeof parsed === "bigint" ? parsed : undefined;
  const amountError =
    typeof parsed === "string"
      ? parsed
      : amount !== undefined && amount > balance
        ? `You only have ${formatAmount(balance, decimals, decimals)} ${symbol}.`
        : undefined;

  const { fee, net } = splitFee(amount ?? 0n, feeBps);
  // Estimate only — the contract sets maturity from the block it's mined in.
  const unlockEstimate = now + duration;
  const canSubmit =
    amount !== undefined && !amountError && duration > 0 && understood && !submitting;
  const fmt = (v: bigint) => `${formatAmount(v, decimals, decimals)} ${symbol}`;

  async function submit() {
    if (!amount || !tokenAddress || !vaultAddress) return;
    const token = tokenAddress;
    const vault = vaultAddress;
    setSubmitting(true);
    try {
      // Pinned reads: never act on state older than our own last transaction.
      const allowance = await readAtFreshBlock(config, (blockNumber) =>
        readContract(config, {
          address: token,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, vault],
          blockNumber,
        }),
      );
      if (allowance < amount) {
        const approved = await tx.run(`Approve ${symbol}`, async () => {
          const { request } = await readAtFreshBlock(config, (blockNumber) =>
            simulateContract(config, {
              account: address,
              address: token,
              abi: erc20Abi,
              functionName: "approve",
              args: [vault, amount],
              blockNumber,
            }),
          );
          return writeContract(config, request);
        });
        if (!approved) return;
      }

      const receipt = await tx.run("Lock savings", async () => {
        const { request } = await readAtFreshBlock(config, (blockNumber) =>
          simulateContract(config, {
            account: address,
            address: vault,
            abi: vaultAbiWithTokenErrors,
            functionName: "createVault",
            args: [amount, BigInt(duration)],
            blockNumber,
          }),
        );
        return writeContract(config, request);
      });
      if (!receipt) return;

      const [created] = parseEventLogs({
        abi: savingsVaultAbi,
        eventName: "VaultCreated",
        logs: receipt.logs,
        args: { owner: address },
      });
      if (created) {
        const id = created.args.vaultId;
        saveGoalName(id, name);
        await savings.refetchUntil((vaults) => vaults.some((v) => v.id === id));
        onCreated(id);
      } else {
        await savings.refetchUntil(() => true);
        onBack();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen title="New savings vault" onBack={submitting ? undefined : onBack}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.name} hint="Saved on this device only">
          Goal name <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={ids.name}
          value={name}
          maxLength={MAX_NAME}
          placeholder="e.g. School fees"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label
          htmlFor={ids.amount}
          hint={`Available ${formatAmount(balance, decimals)} ${symbol}`}
        >
          Amount
        </Label>
        <Input
          id={ids.amount}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={30}
          value={amountInput}
          placeholder="0.00"
          aria-invalid={!!amountError}
          aria-describedby={`${ids.amount}-msg`}
          onChange={(e) => setAmountInput(e.target.value.replaceAll(",", ".").replace(/\s/g, ""))}
          suffix={
            <>
              <span className="text-sm font-semibold text-muted-foreground">{symbol}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="-mr-1.5 h-8"
                disabled={balance === 0n}
                onClick={() => setAmountInput(formatUnits(balance, decimals))}
              >
                Max
              </Button>
            </>
          }
        />
        <div id={`${ids.amount}-msg`} aria-live="polite" className="min-h-0 text-sm">
          {amountError && <p className="text-destructive">{amountError}</p>}
          {!amountError && amount !== undefined && amount === balance && (
            <p className="flex items-start gap-1.5 text-warning">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              Locking your whole balance may leave nothing to pay the network fee.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.duration}>Lock for</Label>
        <Select
          id={ids.duration}
          value={duration}
          onChange={setDuration}
          options={durations.map((d) => ({
            value: d.seconds,
            label: d.label,
            hint: d.testOnly ? "testing" : undefined,
          }))}
        />
      </div>

      <Card className="p-4">
        <h2 className="flex items-center gap-2 font-bold">
          <CalendarClock className="size-4 text-primary" /> Summary
        </h2>
        <dl className="mt-2">
          <DetailRow label="You lock" value={fmt(amount ?? 0n)} />
          <DetailRow label="Unlocks around" value={formatDate(unlockEstimate)} />
          <DetailRow label={`Withdrawal fee (${formatBps(feeBps)})`} value={`− ${fmt(fee)}`} />
          <Separator className="my-1" />
          <DetailRow label="You receive at maturity" value={fmt(net)} strong />
        </dl>
        <p className="mt-3 flex gap-2 rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          The {formatBps(feeBps)} fee is taken from your savings when you withdraw and is fixed in
          the contract. MiniPay shows the small network fee before you confirm each step.
        </p>
      </Card>

      <Checkbox checked={understood} onChange={setUnderstood}>
        I understand these funds <strong>cannot be withdrawn early</strong> by anyone, including
        me.
      </Checkbox>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button onClick={submit} disabled={!canSubmit} loading={submitting}>
          {!submitting && <Lock className="size-4" />}
          {submitting ? phaseLabel(tx.phase, "Updating…") : "Lock savings"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You may be asked to confirm twice: approve {symbol}, then lock it.
        </p>
      </div>
    </Screen>
  );
}
