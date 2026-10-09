import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, maxUint256, parseUnits, zeroAddress } from "viem";

const DAY = 24n * 60n * 60n;
const FEE_BPS = 25n;
const MIN_LOCK = DAY;
const usdt = (value: string) => parseUnits(value, 6);

async function deployFixture() {
  const [deployer, alice, bob, treasury] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const token = await hre.viem.deployContract("MockUSDT", [6]);
  const vault = await hre.viem.deployContract("SavingsVault", [
    token.address,
    6,
    treasury.account.address,
    FEE_BPS,
    MIN_LOCK,
  ]);

  for (const user of [alice, bob]) {
    await token.write.mint([user.account.address, usdt("1000")]);
  }

  const as = async (wallet: typeof alice) => ({
    vault: await hre.viem.getContractAt("SavingsVault", vault.address, {
      client: { wallet },
    }),
    token: await hre.viem.getContractAt("MockUSDT", token.address, {
      client: { wallet },
    }),
  });

  /** Approve and create a vault as `wallet`; returns the new vault id. */
  async function createVault(
    wallet: typeof alice,
    amount: bigint,
    duration: bigint,
  ) {
    const c = await as(wallet);
    await c.token.write.approve([vault.address, amount]);
    const id = await vault.read.vaultCount();
    await c.vault.write.createVault([amount, duration]);
    return id;
  }

  const balanceOf = (address: `0x${string}`) =>
    token.read.balanceOf([address]);

  /** Invariant: vault holds at least all un-withdrawn principal + accrued fees. */
  async function expectSolvent() {
    const count = await vault.read.vaultCount();
    let owed = await vault.read.accruedFees();
    for (let id = 0n; id < count; id++) {
      const v = await vault.read.getVault([id]);
      if (!v.withdrawn) owed += v.amount;
    }
    expect((await balanceOf(vault.address)) >= owed).to.equal(true);
    return owed;
  }

  return {
    token,
    vault,
    deployer,
    alice,
    bob,
    treasury,
    publicClient,
    as,
    createVault,
    balanceOf,
    expectSolvent,
  };
}

describe("SavingsVault", function () {
  describe("deployment", function () {
    it("stores immutable configuration", async function () {
      const { vault, token, treasury } = await loadFixture(deployFixture);
      expect(await vault.read.token()).to.equal(getAddress(token.address));
      expect(await vault.read.treasury()).to.equal(
        getAddress(treasury.account.address),
      );
      expect(await vault.read.feeBps()).to.equal(25n);
      expect(await vault.read.minLockDuration()).to.equal(MIN_LOCK);
    });

    it("rejects a fee above the 1% cap", async function () {
      const { token, treasury } = await loadFixture(deployFixture);
      await expect(
        hre.viem.deployContract("SavingsVault", [
          token.address,
          6,
          treasury.account.address,
          101n,
          MIN_LOCK,
        ]),
      ).to.be.rejectedWith("FeeTooHigh");
    });

    it("rejects zero token or treasury addresses", async function () {
      const { token, treasury } = await loadFixture(deployFixture);
      await expect(
        hre.viem.deployContract("SavingsVault", [
          token.address,
          6,
          zeroAddress,
          FEE_BPS,
          MIN_LOCK,
        ]),
      ).to.be.rejectedWith("ZeroAddress");
      await expect(
        hre.viem.deployContract("SavingsVault", [
          zeroAddress,
          6,
          treasury.account.address,
          FEE_BPS,
          MIN_LOCK,
        ]),
      ).to.be.rejectedWith("ZeroAddress");
    });

    it("rejects a token whose decimals differ from what the deployer expects", async function () {
      const { token, treasury } = await loadFixture(deployFixture);
      await expect(
        hre.viem.deployContract("SavingsVault", [
          token.address,
          18,
          treasury.account.address,
          FEE_BPS,
          MIN_LOCK,
        ]),
      ).to.be.rejectedWith("UnexpectedDecimals");
    });

    it("rejects a zero minimum lock duration", async function () {
      const { token, treasury } = await loadFixture(deployFixture);
      await expect(
        hre.viem.deployContract("SavingsVault", [
          token.address,
          6,
          treasury.account.address,
          FEE_BPS,
          0n,
        ]),
      ).to.be.rejectedWith("InvalidMinLockDuration");
      await expect(
        hre.viem.deployContract("SavingsVault", [
          token.address,
          6,
          treasury.account.address,
          FEE_BPS,
          3651n * DAY,
        ]),
      ).to.be.rejectedWith("InvalidMinLockDuration");
    });
  });

  describe("createVault", function () {
    it("locks tokens and records the vault", async function () {
      const { vault, alice, as, balanceOf, publicClient } =
        await loadFixture(deployFixture);
      const amount = usdt("100");
      const c = await as(alice);
      await c.token.write.approve([vault.address, amount]);

      const hash = await c.vault.write.createVault([amount, 30n * DAY]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const block = await publicClient.getBlock({
        blockNumber: receipt.blockNumber,
      });
      const expectedMaturity = block.timestamp + 30n * DAY;

      const v = await vault.read.getVault([0n]);
      expect(v.owner).to.equal(getAddress(alice.account.address));
      expect(v.amount).to.equal(amount);
      expect(v.maturity).to.equal(expectedMaturity);
      expect(v.withdrawn).to.equal(false);

      expect(await balanceOf(vault.address)).to.equal(amount);
      expect(await balanceOf(alice.account.address)).to.equal(usdt("900"));
      expect(await vault.read.vaultCount()).to.equal(1n);
      expect(await vault.read.getVaultIds([alice.account.address])).to.deep.equal([0n]);

      const events = await vault.getEvents.VaultCreated();
      expect(events).to.have.lengthOf(1);
      expect(events[0].args).to.deep.include({
        vaultId: 0n,
        owner: getAddress(alice.account.address),
        amount,
        maturity: expectedMaturity,
      });
    });

    it("rejects a zero amount", async function () {
      const { alice, as } = await loadFixture(deployFixture);
      const c = await as(alice);
      await expect(c.vault.write.createVault([0n, 30n * DAY])).to.be.rejectedWith(
        "ZeroAmount",
      );
    });

    it("rejects an amount above the caller's balance or allowance", async function () {
      const { vault, alice, as } = await loadFixture(deployFixture);
      const c = await as(alice);
      // No approval.
      await expect(
        c.vault.write.createVault([usdt("10"), 30n * DAY]),
      ).to.be.rejectedWith("ERC20InsufficientAllowance");
      // Approved, but more than the 1000 USDT balance.
      await c.token.write.approve([vault.address, usdt("5000")]);
      await expect(
        c.vault.write.createVault([usdt("5000"), 30n * DAY]),
      ).to.be.rejectedWith("ERC20InsufficientBalance");
    });

    it("rejects lock durations outside [minLockDuration, MAX_LOCK_DURATION]", async function () {
      const { vault, alice, as } = await loadFixture(deployFixture);
      const c = await as(alice);
      await c.token.write.approve([vault.address, usdt("10")]);
      await expect(
        c.vault.write.createVault([usdt("10"), MIN_LOCK - 1n]),
      ).to.be.rejectedWith("InvalidLockDuration");
      const max = await vault.read.MAX_LOCK_DURATION();
      await expect(
        c.vault.write.createVault([usdt("10"), max + 1n]),
      ).to.be.rejectedWith("InvalidLockDuration");
      // Boundaries are accepted.
      await c.vault.write.createVault([usdt("5"), MIN_LOCK]);
      await c.vault.write.createVault([usdt("5"), max]);
    });

    it("rejects fee-on-transfer tokens", async function () {
      const { alice, treasury } = await loadFixture(deployFixture);
      const fot = await hre.viem.deployContract("FeeOnTransferToken");
      const vault = await hre.viem.deployContract("SavingsVault", [
        fot.address,
        6,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      await fot.write.mint([alice.account.address, usdt("100")]);
      const fotAsAlice = await hre.viem.getContractAt(
        "FeeOnTransferToken",
        fot.address,
        { client: { wallet: alice } },
      );
      const vaultAsAlice = await hre.viem.getContractAt(
        "SavingsVault",
        vault.address,
        { client: { wallet: alice } },
      );
      await fotAsAlice.write.approve([vault.address, usdt("100")]);
      await expect(
        vaultAsAlice.write.createVault([usdt("100"), 30n * DAY]),
      ).to.be.rejectedWith("UnsupportedTokenBehavior");
    });
  });

  describe("withdraw", function () {
    it("rejects withdrawal before maturity, including one second before", async function () {
      const { vault, alice, as, createVault } = await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("100"), 30n * DAY);
      const c = await as(alice);

      await expect(c.vault.write.withdraw([id])).to.be.rejectedWith(
        "VaultNotMatured",
      );

      const { maturity } = await vault.read.getVault([id]);
      // The next tx is mined at maturity - 1.
      await time.setNextBlockTimestamp(maturity - 1n);
      await expect(c.vault.write.withdraw([id])).to.be.rejectedWith(
        "VaultNotMatured",
      );
    });

    it("pays principal minus fee to the owner at maturity and accrues the fee for the treasury", async function () {
      const { vault, alice, bob, treasury, as, createVault, balanceOf } =
        await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("100"), 30n * DAY);
      const { maturity } = await vault.read.getVault([id]);

      await time.setNextBlockTimestamp(maturity); // exactly at maturity
      await (await as(alice)).vault.write.withdraw([id]);

      expect(await balanceOf(alice.account.address)).to.equal(usdt("999.75"));
      expect(await vault.read.accruedFees()).to.equal(usdt("0.25"));
      expect(await balanceOf(treasury.account.address)).to.equal(0n);
      expect(await balanceOf(vault.address)).to.equal(usdt("0.25"));
      expect((await vault.read.getVault([id])).withdrawn).to.equal(true);

      // Anyone can push accrued fees to the fixed treasury.
      await (await as(bob)).vault.write.claimFees();
      expect(await balanceOf(treasury.account.address)).to.equal(usdt("0.25"));
      expect(await balanceOf(vault.address)).to.equal(0n);
      expect(await vault.read.accruedFees()).to.equal(0n);
      const claims = await vault.getEvents.FeesClaimed();
      expect(claims[0].args).to.deep.include({
        treasury: getAddress(treasury.account.address),
        amount: usdt("0.25"),
      });

      const events = await vault.getEvents.VaultWithdrawn({}, { fromBlock: 0n });
      expect(events[0].args).to.deep.include({
        vaultId: id,
        owner: getAddress(alice.account.address),
        netAmount: usdt("99.75"),
        fee: usdt("0.25"),
      });
    });

    it("rejects withdrawal by another wallet, even after maturity", async function () {
      const { alice, bob, as, createVault } = await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("100"), 30n * DAY);
      await time.increase(31n * DAY);
      await expect((await as(bob)).vault.write.withdraw([id])).to.be.rejectedWith(
        "NotVaultOwner",
      );
    });

    it("prevents double withdrawal", async function () {
      const { alice, as, createVault, balanceOf } = await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("100"), 30n * DAY);
      await time.increase(30n * DAY);
      const c = await as(alice);
      await c.vault.write.withdraw([id]);
      const after = await balanceOf(alice.account.address);

      await expect(c.vault.write.withdraw([id])).to.be.rejectedWith(
        "AlreadyWithdrawn",
      );
      expect(await balanceOf(alice.account.address)).to.equal(after);
    });

    it("rejects unknown vault ids", async function () {
      const { vault, alice, as } = await loadFixture(deployFixture);
      await expect((await as(alice)).vault.write.withdraw([42n])).to.be.rejectedWith(
        "VaultNotFound",
      );
      await expect(vault.read.getVault([42n])).to.be.rejectedWith("VaultNotFound");
    });
  });

  describe("fees", function () {
    it("charges exactly 25 bps and previews match the payout", async function () {
      const { vault } = await loadFixture(deployFixture);
      expect(await vault.read.previewWithdrawal([usdt("100")])).to.deep.equal([
        usdt("99.75"),
        usdt("0.25"),
      ]);
      expect(await vault.read.previewWithdrawal([usdt("1234.567891")])).to.deep.equal([
        1231481472n, // 1234567891 - fee
        3086419n, // floor(1234567891 * 25 / 10000) = floor(3086419.7275)
      ]);
    });

    it("rounds the fee down so users are never overcharged", async function () {
      const { vault } = await loadFixture(deployFixture);
      // 399 base units * 25 / 10000 = 0.9975 -> 0
      expect(await vault.read.previewWithdrawal([399n])).to.deep.equal([399n, 0n]);
      expect(await vault.read.previewWithdrawal([400n])).to.deep.equal([399n, 1n]);
      expect(await vault.read.previewWithdrawal([1n])).to.deep.equal([1n, 0n]);
    });

    it("does not overflow on very large amounts", async function () {
      const { vault } = await loadFixture(deployFixture);
      const [net, fee] = await vault.read.previewWithdrawal([maxUint256]);
      expect(fee).to.equal((maxUint256 * 25n) / 10_000n);
      expect(net + fee).to.equal(maxUint256);
    });

    it("accounts fees per vault in the treasury across multiple withdrawals", async function () {
      const { alice, bob, treasury, as, createVault, balanceOf } =
        await loadFixture(deployFixture);
      const a = await createVault(alice, usdt("200"), 30n * DAY);
      const b = await createVault(bob, usdt("40"), 30n * DAY);
      await time.increase(30n * DAY);
      await (await as(alice)).vault.write.withdraw([a]);
      await (await as(bob)).vault.write.withdraw([b]);
      // 0.5 + 0.1
      expect(await (await as(bob)).vault.read.accruedFees()).to.equal(usdt("0.6"));
      await (await as(treasury)).vault.write.claimFees();
      expect(await balanceOf(treasury.account.address)).to.equal(usdt("0.6"));
      expect(await balanceOf(bob.account.address)).to.equal(usdt("999.9"));
    });

    it("skips the treasury transfer when deployed with a zero fee", async function () {
      const { token, alice, treasury } = await loadFixture(deployFixture);
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        6,
        treasury.account.address,
        0n,
        MIN_LOCK,
      ]);
      const t = await hre.viem.getContractAt("MockUSDT", token.address, {
        client: { wallet: alice },
      });
      const v = await hre.viem.getContractAt("SavingsVault", vault.address, {
        client: { wallet: alice },
      });
      await t.write.approve([vault.address, usdt("10")]);
      await v.write.createVault([usdt("10"), MIN_LOCK]);
      await time.increase(MIN_LOCK);
      await v.write.withdraw([0n]);
      expect(await token.read.balanceOf([alice.account.address])).to.equal(
        usdt("1000"),
      );
      expect(await token.read.balanceOf([treasury.account.address])).to.equal(0n);
      await expect(v.write.claimFees()).to.be.rejectedWith("NoFeesToClaim");
    });

    it("never lets claimFees reach principal", async function () {
      const { vault, alice, bob, treasury, as, createVault, balanceOf, expectSolvent } =
        await loadFixture(deployFixture);
      const a = await createVault(alice, usdt("100"), 7n * DAY);
      await createVault(bob, usdt("500"), 90n * DAY);
      await expect((await as(treasury)).vault.write.claimFees()).to.be.rejectedWith(
        "NoFeesToClaim",
      );
      await time.increase(7n * DAY);
      await (await as(alice)).vault.write.withdraw([a]);
      await (await as(treasury)).vault.write.claimFees();
      await expect((await as(treasury)).vault.write.claimFees()).to.be.rejectedWith(
        "NoFeesToClaim",
      );
      expect(await balanceOf(treasury.account.address)).to.equal(usdt("0.25"));
      expect(await balanceOf(vault.address)).to.equal(usdt("500"));
      expect(await expectSolvent()).to.equal(usdt("500"));
    });
  });

  describe("token failures and reentrancy", function () {
    async function falseTokenFixture() {
      const [, alice, , treasury] = await hre.viem.getWalletClients();
      const token = await hre.viem.deployContract("FalseReturnToken");
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        6,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      await token.write.mint([alice.account.address, usdt("100")]);
      const t = await hre.viem.getContractAt("FalseReturnToken", token.address, {
        client: { wallet: alice },
      });
      const v = await hre.viem.getContractAt("SavingsVault", vault.address, {
        client: { wallet: alice },
      });
      return { token, vault, t, v, alice };
    }

    it("reverts deposits when transferFrom returns false", async function () {
      const { token, t, v, vault } = await loadFixture(falseTokenFixture);
      await t.write.approve([vault.address, usdt("100")]);
      await token.write.setFailTransfers([true]);
      await expect(v.write.createVault([usdt("100"), MIN_LOCK])).to.be.rejectedWith(
        "SafeERC20FailedOperation",
      );
      expect(await vault.read.vaultCount()).to.equal(0n);
    });

    it("reverts withdrawals when transfer returns false and keeps the vault withdrawable", async function () {
      const { token, t, v, vault, alice } = await loadFixture(falseTokenFixture);
      await t.write.approve([vault.address, usdt("100")]);
      await v.write.createVault([usdt("100"), MIN_LOCK]);
      await time.increase(MIN_LOCK);

      await token.write.setFailTransfers([true]);
      await expect(v.write.withdraw([0n])).to.be.rejectedWith(
        "SafeERC20FailedOperation",
      );
      expect((await vault.read.getVault([0n])).withdrawn).to.equal(false);

      await token.write.setFailTransfers([false]);
      await v.write.withdraw([0n]);
      expect(await token.read.balanceOf([alice.account.address])).to.equal(
        usdt("99.75"),
      );
    });

    it("blocks reentrant withdrawals from a malicious recipient", async function () {
      const [, , , treasury] = await hre.viem.getWalletClients();
      const token = await hre.viem.deployContract("ReentrantToken");
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        6,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      const attacker = await hre.viem.deployContract("ReentrancyAttacker", [
        vault.address,
      ]);
      await token.write.mint([attacker.address, usdt("200")]);
      await attacker.write.deposit([token.address, usdt("100"), MIN_LOCK]); // id 0
      await attacker.write.deposit([token.address, usdt("100"), MIN_LOCK]); // id 1
      await token.write.setHookTarget([attacker.address]);
      await time.increase(MIN_LOCK);

      // While receiving vault 0's payout, try to withdraw vault 1.
      await attacker.write.arm([1n]);
      await expect(attacker.write.withdraw([0n])).to.be.rejectedWith(
        "ReentrancyGuardReentrantCall",
      );
      expect((await vault.read.getVault([0n])).withdrawn).to.equal(false);
      expect((await vault.read.getVault([1n])).withdrawn).to.equal(false);
      expect(await token.read.balanceOf([vault.address])).to.equal(usdt("200"));

      // Re-entering createVault from the same hook is blocked too.
      await attacker.write.armCreate([token.address]);
      await expect(attacker.write.withdraw([0n])).to.be.rejectedWith(
        "ReentrancyGuardReentrantCall",
      );
      expect(await vault.read.vaultCount()).to.equal(2n);

      // Without the malicious hook, the attacker's own vault withdraws normally.
      // (The failed attempts reverted, so the attacker is still "armed".)
      await token.write.setHookTarget([zeroAddress]);
      await attacker.write.withdraw([0n]);
      expect((await vault.read.getVault([0n])).withdrawn).to.equal(true);
    });

    it("keeps withdrawals working when the issuer blocks the treasury", async function () {
      const [, alice, , treasury] = await hre.viem.getWalletClients();
      const token = await hre.viem.deployContract("BlocklistToken");
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        6,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      await token.write.mint([alice.account.address, usdt("100")]);
      const t = await hre.viem.getContractAt("BlocklistToken", token.address, {
        client: { wallet: alice },
      });
      const v = await hre.viem.getContractAt("SavingsVault", vault.address, {
        client: { wallet: alice },
      });
      await t.write.approve([vault.address, usdt("100")]);
      await v.write.createVault([usdt("100"), MIN_LOCK]);
      await time.increase(MIN_LOCK);

      await token.write.setBlocked([treasury.account.address, true]);
      await v.write.withdraw([0n]); // principal is not held hostage
      expect(await token.read.balanceOf([alice.account.address])).to.equal(usdt("99.75"));
      await expect(v.write.claimFees()).to.be.rejectedWith("Blocked");
      expect(await vault.read.accruedFees()).to.equal(usdt("0.25"));

      await token.write.setBlocked([treasury.account.address, false]);
      await v.write.claimFees();
      expect(await token.read.balanceOf([treasury.account.address])).to.equal(usdt("0.25"));
    });

    it("stays solvent if a transfer fee is switched on after deposit", async function () {
      const [, alice, , treasury] = await hre.viem.getWalletClients();
      const token = await hre.viem.deployContract("FeeOnTransferToken");
      await token.write.setFeeEnabled([false]);
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        6,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      await token.write.mint([alice.account.address, usdt("100")]);
      const t = await hre.viem.getContractAt("FeeOnTransferToken", token.address, {
        client: { wallet: alice },
      });
      const v = await hre.viem.getContractAt("SavingsVault", vault.address, {
        client: { wallet: alice },
      });
      await t.write.approve([vault.address, usdt("100")]);
      await v.write.createVault([usdt("100"), MIN_LOCK]);

      await token.write.setFeeEnabled([true]);
      await time.increase(MIN_LOCK);
      await v.write.withdraw([0n]);
      // The issuer's 1% comes out of what the user receives, not the vault's reserves.
      expect(await token.read.balanceOf([alice.account.address])).to.equal(
        usdt("99.75") - usdt("99.75") / 100n,
      );
      expect(await token.read.balanceOf([vault.address])).to.equal(usdt("0.25"));
      await v.write.claimFees();
      expect(await token.read.balanceOf([vault.address])).to.equal(0n);
    });

    it("ignores tokens sent directly to the contract (no sweep, accounting unaffected)", async function () {
      const { vault, token, alice, as, createVault, expectSolvent } =
        await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("10"), MIN_LOCK);
      await token.write.mint([vault.address, usdt("5")]); // donation
      await time.increase(MIN_LOCK);
      await (await as(alice)).vault.write.withdraw([id]);
      await vault.write.claimFees();
      expect(await expectSolvent()).to.equal(0n);
      expect(await token.read.balanceOf([vault.address])).to.equal(usdt("5"));
    });
  });

  describe("multiple vaults", function () {
    it("keeps independent maturity dates per vault", async function () {
      const { vault, alice, as, createVault, balanceOf } =
        await loadFixture(deployFixture);
      const short = await createVault(alice, usdt("10"), 7n * DAY);
      const long = await createVault(alice, usdt("20"), 90n * DAY);
      const shortV = await vault.read.getVault([short]);
      const longV = await vault.read.getVault([long]);
      expect(longV.maturity - shortV.maturity >= 83n * DAY).to.equal(true);

      await time.increaseTo(shortV.maturity);
      const c = await as(alice);
      await c.vault.write.withdraw([short]);
      await expect(c.vault.write.withdraw([long])).to.be.rejectedWith(
        "VaultNotMatured",
      );
      // The long vault's maturity was not touched by the other withdrawal.
      expect((await vault.read.getVault([long])).maturity).to.equal(longV.maturity);
      expect(await balanceOf(vault.address)).to.equal(usdt("20") + usdt("0.025"));

      await time.increaseTo(longV.maturity);
      await c.vault.write.withdraw([long]);
      expect(await vault.read.accruedFees()).to.equal(usdt("0.075"));
      expect(await balanceOf(vault.address)).to.equal(usdt("0.075"));
    });

    it("lists each owner's vaults separately", async function () {
      const { vault, alice, bob, createVault } = await loadFixture(deployFixture);
      await createVault(alice, usdt("1"), 7n * DAY);
      await createVault(bob, usdt("2"), 7n * DAY);
      await createVault(alice, usdt("3"), 14n * DAY);

      const [aliceIds, aliceVaults] = await vault.read.getVaults([
        alice.account.address,
      ]);
      expect(aliceIds).to.deep.equal([0n, 2n]);
      expect(aliceVaults.map((v) => v.amount)).to.deep.equal([usdt("1"), usdt("3")]);
      expect(await vault.read.getVaultIds([bob.account.address])).to.deep.equal([1n]);
    });
  });

  describe("decimals", function () {
    it("handles six-decimal USDT amounts exactly", async function () {
      const { vault, alice, treasury, as, createVault, balanceOf } =
        await loadFixture(deployFixture);
      const amount = usdt("1.234567");
      expect(amount).to.equal(1_234_567n);
      const id = await createVault(alice, amount, MIN_LOCK);
      expect((await vault.read.getVault([id])).amount).to.equal(1_234_567n);

      await time.increase(MIN_LOCK);
      await (await as(alice)).vault.write.withdraw([id]);
      // fee = floor(1234567 * 25 / 10000) = 3086 base units = 0.003086 USDT
      expect(await vault.read.accruedFees()).to.equal(3086n);
      await vault.write.claimFees();
      expect(await balanceOf(treasury.account.address)).to.equal(3086n);
      expect(await balanceOf(alice.account.address)).to.equal(
        usdt("1000") - 3086n,
      );
    });

    it("works unchanged with an 18-decimal token when configured for it", async function () {
      const [, alice, , treasury] = await hre.viem.getWalletClients();
      const token = await hre.viem.deployContract("MockUSDT", [18]);
      const vault = await hre.viem.deployContract("SavingsVault", [
        token.address,
        18,
        treasury.account.address,
        FEE_BPS,
        MIN_LOCK,
      ]);
      expect(await vault.read.previewWithdrawal([parseUnits("100", 18)])).to.deep.equal(
        [parseUnits("99.75", 18), parseUnits("0.25", 18)],
      );
      await token.write.mint([alice.account.address, parseUnits("100", 18)]);
      const t = await hre.viem.getContractAt("MockUSDT", token.address, {
        client: { wallet: alice },
      });
      const v = await hre.viem.getContractAt("SavingsVault", vault.address, {
        client: { wallet: alice },
      });
      await t.write.approve([vault.address, parseUnits("100", 18)]);
      await v.write.createVault([parseUnits("100", 18), MIN_LOCK]);
      await time.increase(MIN_LOCK);
      await v.write.withdraw([0n]);
      expect(await token.read.balanceOf([alice.account.address])).to.equal(
        parseUnits("99.75", 18),
      );
      expect(await vault.read.accruedFees()).to.equal(parseUnits("0.25", 18));
    });
  });

  describe("no privileged access", function () {
    it("exposes no state-changing functions besides createVault, withdraw and claimFees", async function () {
      const artifact = await hre.artifacts.readArtifact("SavingsVault");
      const mutating = artifact.abi
        .filter(
          (item) =>
            item.type === "function" &&
            !["view", "pure"].includes(item.stateMutability as string),
        )
        .map((item) => (item as { name: string }).name)
        .sort();
      expect(mutating).to.deep.equal(["claimFees", "createVault", "withdraw"]);
    });

    it("lets neither the deployer nor the treasury take principal or bypass maturity", async function () {
      const { vault, alice, deployer, treasury, as, createVault, balanceOf } =
        await loadFixture(deployFixture);
      const id = await createVault(alice, usdt("100"), 30n * DAY);
      const { maturity } = await vault.read.getVault([id]);

      for (const privileged of [deployer, treasury]) {
        const c = await as(privileged);
        await expect(c.vault.write.withdraw([id])).to.be.rejectedWith(
          "NotVaultOwner",
        );
      }
      await time.increase(31n * DAY);
      for (const privileged of [deployer, treasury]) {
        const c = await as(privileged);
        await expect(c.vault.write.withdraw([id])).to.be.rejectedWith(
          "NotVaultOwner",
        );
      }

      await expect((await as(treasury)).vault.write.claimFees()).to.be.rejectedWith(
        "NoFeesToClaim",
      );
      expect(await balanceOf(vault.address)).to.equal(usdt("100"));
      expect(await balanceOf(treasury.account.address)).to.equal(0n);
      expect((await vault.read.getVault([id])).maturity).to.equal(maturity);
    });
  });
});
