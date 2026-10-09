import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Local development: a freely mintable 6-decimal test USDT plus the
 * SavingsVault configured to accept only that token.
 *
 * Celo Sepolia uses `SavingsVault.ts` with Circle's test USDC instead, which
 * MiniPay recognises and the Circle faucet hands out.
 *
 * The module ID "Lockbox" is the app's former name (it's now PiggyLock). It is
 * kept because Ignition's deployment records (and the mint/claim scripts) key
 * contracts by it, e.g. "Lockbox#SavingsVault". Renaming it would orphan the
 * existing Celo Sepolia deployment.
 */
export default buildModule("Lockbox", (m) => {
  const treasury = m.getParameter<string>("treasury");
  const feeBps = m.getParameter("feeBps", 25); // 0.25%
  const minLockDuration = m.getParameter("minLockDuration", 86_400); // seconds

  const usdt = m.contract("MockUSDT", [6]);
  const vault = m.contract("SavingsVault", [
    usdt,
    6,
    treasury,
    feeBps,
    minLockDuration,
  ]);

  return { usdt, vault };
});
