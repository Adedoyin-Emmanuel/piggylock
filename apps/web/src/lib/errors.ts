import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  WaitForTransactionReceiptTimeoutError,
} from "viem";

const REVERT_MESSAGES: Record<string, string> = {
  ZeroAmount: "Enter an amount greater than zero.",
  InvalidLockDuration: "That lock duration isn't allowed.",
  UnsupportedTokenBehavior: "This token isn't supported by the vault.",
  VaultNotFound: "That vault doesn't exist.",
  NotVaultOwner: "Only the wallet that created this vault can withdraw it.",
  VaultNotMatured:
    "The network hasn't reached the unlock time yet. Try again in a few seconds.",
  AlreadyWithdrawn: "This vault has already been withdrawn.",
  ERC20InsufficientBalance: "Your balance is too low for this amount.",
  ERC20InsufficientAllowance:
    "Your approval hasn't reached the network yet. Try again in a few seconds.",
  SafeERC20FailedOperation: "The token transfer failed. No funds moved.",
};

/** Turn wallet/RPC/contract errors into a short, user-facing message. */
export function friendlyError(error: unknown): string {
  console.error(error); // full detail for debugging

  // MiniPay reports rejection as code -32604; standard wallets use 4001.
  const code = (error as { code?: number })?.code;
  if (code === -32604 || code === 4001) return "You cancelled the request.";

  if (error instanceof BaseError) {
    if (error.walk((e) => e instanceof UserRejectedRequestError)) {
      return "You cancelled the request.";
    }
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && REVERT_MESSAGES[name]) return REVERT_MESSAGES[name];
      return "The contract rejected this transaction. No funds moved.";
    }
    if (error.walk((e) => e instanceof InsufficientFundsError)) {
      return "Not enough balance to pay the network fee.";
    }
    if (error.walk((e) => e instanceof WaitForTransactionReceiptTimeoutError)) {
      return "Still waiting for the network. Check the explorer before trying again.";
    }
  }
  return "Transaction failed. Please try again.";
}
