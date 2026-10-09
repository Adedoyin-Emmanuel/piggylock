import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Deploy SavingsVault against an existing token (e.g. a real USD₮ address).
 * Every value is required on purpose — there is no safe default for a token,
 * its decimals, or a treasury. Mainnet is not configured in hardhat.config.ts.
 */
export default buildModule("SavingsVault", (m) => {
  const token = m.getParameter<string>("token");
  const tokenDecimals = m.getParameter<number>("tokenDecimals");
  const treasury = m.getParameter<string>("treasury");
  const feeBps = m.getParameter<number>("feeBps");
  const minLockDuration = m.getParameter<number>("minLockDuration");

  const vault = m.contract("SavingsVault", [
    token,
    tokenDecimals,
    treasury,
    feeBps,
    minLockDuration,
  ]);

  return { vault };
});
