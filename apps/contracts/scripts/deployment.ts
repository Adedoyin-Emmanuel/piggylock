import { readFileSync } from "node:fs";
import hre from "hardhat";

/** Reads an address that Ignition recorded for the current network. */
export async function deployedAddress(key: string): Promise<`0x${string}`> {
  const chainId = await (await hre.viem.getPublicClient()).getChainId();
  const file = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
  const addresses = JSON.parse(readFileSync(file, "utf8"));
  if (!addresses[key]) throw new Error(`${key} not found in ${file}`);
  return addresses[key];
}
