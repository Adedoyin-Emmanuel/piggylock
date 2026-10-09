import hre from "hardhat";
import { isAddress, parseUnits } from "viem";
import { deployedAddress } from "./deployment";

// Mints worthless test USDT (MockUSDT) to an address, e.g. your MiniPay wallet.
//   MINT_TO=0x... MINT_AMOUNT=100 pnpm mint:celo-sepolia
async function main() {
  const to = process.env.MINT_TO;
  const amount = process.env.MINT_AMOUNT ?? "100";
  if (!to || !isAddress(to)) throw new Error("Set MINT_TO to a valid address");

  const usdt = await hre.viem.getContractAt(
    "MockUSDT",
    await deployedAddress("Lockbox#MockUSDT"),
  );
  const hash = await usdt.write.mint([to, parseUnits(amount, 6)]);
  await (await hre.viem.getPublicClient()).waitForTransactionReceipt({ hash });
  console.log(`Minted ${amount} tUSDT to ${to} (tx ${hash})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
