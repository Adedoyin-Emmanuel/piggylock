import { parseAbi } from "viem";
import { savingsVaultAbi } from "./savings-vault-abi";

export { savingsVaultAbi };

// Errors the token can bubble up through the vault, so viem can decode them.
const tokenErrors = parseAbi([
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
]);

export const vaultAbiWithTokenErrors = [...savingsVaultAbi, ...tokenErrors] as const;
