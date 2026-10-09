import hre from "hardhat";
import { formatUnits } from "viem";
import { deployedAddress } from "./deployment";

// Sends accrued withdrawal fees to the vault's fixed treasury. Anyone may run it.
//   pnpm claim-fees:celo-sepolia
async function main() {
  const vault = await hre.viem.getContractAt(
    "SavingsVault",
    await deployedAddress("Lockbox#SavingsVault"),
  );
  const accrued = await vault.read.accruedFees();
  if (accrued === 0n) return console.log("No fees to claim.");
  const hash = await vault.write.claimFees();
  await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash });
  console.log(`Sent ${formatUnits(accrued, 6)} to treasury ${await vault.read.treasury()} (tx ${hash})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
