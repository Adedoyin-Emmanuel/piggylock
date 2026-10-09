import { createElement, useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { Hash, TransactionReceipt } from "viem";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { explorerTxUrl } from "../lib/env";
import { friendlyError } from "../lib/errors";
import { noteConfirmedBlock } from "../lib/fresh-reads";

export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed";

function withExplorerLink(message: string, hash?: Hash) {
  const url = hash && explorerTxUrl(hash);
  if (!url) return message;
  return createElement(
    "span",
    null,
    message,
    " ",
    createElement("a", { href: url, className: "font-semibold underline" }, "View"),
  );
}

/**
 * Runs one transaction through signing -> submitted -> confirmed/failed,
 * reporting each step in a single updating toast. Success is only reported
 * once the receipt is mined with status "success".
 */
export function useTransaction() {
  const config = useConfig();
  const [phase, setPhase] = useState<TxPhase>("idle");

  const run = useCallback(
    async (
      label: string,
      submit: () => Promise<Hash>,
    ): Promise<TransactionReceipt | undefined> => {
      const id = toast.loading(`${label}: confirm in MiniPay…`);
      setPhase("signing");
      let hash: Hash | undefined;
      try {
        hash = await submit();
        setPhase("pending");
        toast.loading(`${label}: waiting for confirmation…`, { id });
        const receipt = await waitForTransactionReceipt(config, { hash });
        noteConfirmedBlock(receipt.blockNumber);
        if (receipt.status !== "success") {
          setPhase("failed");
          toast.error(withExplorerLink(`${label} failed on-chain. No funds moved.`, hash), {
            id,
          });
          return undefined;
        }
        setPhase("confirmed");
        toast.success(withExplorerLink(`${label} confirmed.`, hash), { id });
        return receipt;
      } catch (error) {
        setPhase("failed");
        toast.error(withExplorerLink(friendlyError(error), hash), { id });
        return undefined;
      }
    },
    [config],
  );

  return { phase, run, busy: phase === "signing" || phase === "pending" };
}

/** Button label for the current phase. */
export function phaseLabel(phase: TxPhase, idle: string) {
  if (phase === "signing") return "Confirm in MiniPay…";
  if (phase === "pending") return "Confirming…";
  return idle;
}
