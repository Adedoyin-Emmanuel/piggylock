import { BaseError, ContractFunctionRevertedError } from "viem";
import type { Config } from "wagmi";
import { getBlockNumber } from "wagmi/actions";

/**
 * Public RPCs (e.g. Forno) are load-balanced, and a node can trail the chain
 * by a few blocks. Reading "latest" right after our own transaction can then
 * return state from *before* it — e.g. "not approved" just after approving,
 * or a stale allowance that makes us skip a needed approval.
 *
 * To avoid that, remember the block of our last confirmed transaction and pin
 * pre-signing reads/simulations to a block at least that new.
 */
let lastConfirmedBlock = 0n;

export function noteConfirmedBlock(blockNumber: bigint) {
  if (blockNumber > lastConfirmedBlock) lastConfirmedBlock = blockNumber;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A block number that includes all of our confirmed transactions. */
export async function freshBlockNumber(config: Config): Promise<bigint> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const head = await getBlockNumber(config, { cacheTime: 0 });
    if (head >= lastConfirmedBlock) return head;
    await sleep(1000);
  }
  return lastConfirmedBlock;
}

/**
 * Run a read pinned to `blockNumber`, retrying while the node serving the
 * request hasn't reached that block yet. Contract reverts are real answers
 * and are rethrown immediately.
 */
export async function readAtFreshBlock<T>(
  config: Config,
  read: (blockNumber: bigint) => Promise<T>,
): Promise<T> {
  const blockNumber = await freshBlockNumber(config);
  for (let attempt = 0; ; attempt++) {
    try {
      return await read(blockNumber);
    } catch (error) {
      const reverted =
        error instanceof BaseError &&
        error.walk((e) => e instanceof ContractFunctionRevertedError);
      if (reverted || attempt >= 4) throw error;
      await sleep(1000);
    }
  }
}
