import { readFileSync } from "node:fs";
import hre from "hardhat";

/** Reads an address that Ignition recorded for the current network; the first key found wins. */
export async function deployedAddress(...keys: string[]): Promise<`0x${string}`> {
  const chainId = await (await hre.viem.getPublicClient()).getChainId();
  const file = `ignition/deployments/chain-${chainId}/deployed_addresses.json`;
  const addresses = JSON.parse(readFileSync(file, "utf8"));
  const key = keys.find((k) => addresses[k]);
  if (!key) throw new Error(`${keys.join(" / ")} not found in ${file}`);
  return addresses[key];
}
