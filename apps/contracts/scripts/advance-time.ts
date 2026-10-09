import hre from "hardhat";

// Local node only: jump the chain clock forward so vaults mature.
//   SECONDS=86400 pnpm advance-time:local
async function main() {
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    throw new Error("advance-time is only for the local Hardhat network");
  }
  const seconds = Number(process.env.SECONDS ?? 86_400);
  const client = await hre.viem.getTestClient();
  await client.increaseTime({ seconds });
  await client.mine({ blocks: 1 });
  const block = await (await hre.viem.getPublicClient()).getBlock();
  console.log(`Advanced ${seconds}s. Chain time: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
