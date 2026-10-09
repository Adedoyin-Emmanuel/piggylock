# PiggyLock

A MiniPay mini-app for locking USDT on Celo until a date you choose. No one can withdraw early, including you, the deployer or the fee recipient. At maturity the owner withdraws, minus a fixed 0.25% fee.

> Personal prototype. **Not audited.** Testnet only; don't use real funds.

## Stack

- `apps/contracts`: Solidity 0.8.28, Hardhat 2, viem, OpenZeppelin
- `apps/web`: Vite, React 19, TypeScript, Tailwind v4, wagmi v3

No backend. All vault data comes from the chain. Goal names are optional and stored only in the browser.

## Setup

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm contracts:test      # contract tests
pnpm contracts:compile   # also regenerates the web ABI
pnpm web:dev             # http://localhost:5173
pnpm web:build
```

## Local development

```bash
pnpm contracts:node            # terminal 1: local chain, 1s blocks
pnpm contracts:deploy:local    # terminal 2
MINT_TO=0x… pnpm --filter hardhat mint:local
```

Then set `apps/web/.env.local`:

```
VITE_CHAIN_ID=31337
VITE_VAULT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

A desktop browser needs an injected wallet (e.g. MetaMask) on `http://127.0.0.1:8545`.

## Celo Sepolia

1. Put a **testnet-only** key in `apps/contracts/.env` (see `.env.example`) and fund it from the [faucet](https://faucet.celo.org/celo-sepolia).
2. Set `treasury` in `apps/contracts/ignition/parameters/celo-sepolia.json`.
3. Deploy and mint test USDT:

```bash
pnpm contracts:deploy:celo-sepolia
MINT_TO=0xYourMiniPayAddress pnpm --filter hardhat mint:celo-sepolia
```

The faucet doesn't give out USDT, so testnet uses `MockUSDT` (tUSDT, 6 decimals, no value).

| Contract | Address (Celo Sepolia) |
|---|---|
| SavingsVault | [`0xFf3807056f68aD2ae94304E31f5305157a03C935`](https://celo-sepolia.blockscout.com/address/0xFf3807056f68aD2ae94304E31f5305157a03C935) |
| MockUSDT | [`0x3f87B269bFB595baf1151b76c3aE0F50Fcd1E599`](https://celo-sepolia.blockscout.com/address/0x3f87B269bFB595baf1151b76c3aE0F50Fcd1E599) |

## Testing in MiniPay

1. MiniPay → Settings → About: tap the version number to unlock developer mode.
2. Developer settings: enable **Developer Mode** and **Use Testnet**.
3. Get test USDC or CELO for your MiniPay address; MiniPay uses it for network fees.
4. Set `apps/web/.env.local` to `VITE_CHAIN_ID=11142220` and the Sepolia vault address.
5. Run `pnpm web:dev`, expose it with an HTTPS tunnel (`ngrok http 5173`), and open the URL via **Load test page**.

## Environment variables

| File | Variable | Purpose |
|---|---|---|
| `apps/contracts/.env` | `PRIVATE_KEY` | Testnet deployer key (secret) |
| | `CELO_SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY` | Optional |
| `apps/web/.env.local` | `VITE_CHAIN_ID` | `11142220` Sepolia, `31337` local |
| | `VITE_VAULT_ADDRESS` | SavingsVault address |
| | `VITE_RPC_URL` | Optional read RPC |

## Contract

`SavingsVault` has no owner, admin, pause or upgrade path. State changes are limited to `createVault`, `withdraw` and `claimFees`.

- Accepts one immutable token and rejects fee-on-transfer tokens.
- Maturity is set once at creation. Only the owner can withdraw, once, after maturity.
- The fee (25 bps, immutable, capped at 1%) accrues in the contract. Anyone can call `claimFees()` to send it to the fixed treasury, so a blocked treasury can't freeze user withdrawals.
- Uses `SafeERC20` and `ReentrancyGuard`, and raw base units with no decimal scaling.

Mainnet isn't configured in `hardhat.config.ts` on purpose.

## Known risks

- No professional audit, fork tests or fuzz tests yet.
- USDT's issuer can freeze the vault or a user, which blocks withdrawals.
- Withdrawals always go to the creating wallet; a lost key means lost funds.
- Tokens sent directly to the contract can't be recovered.

> Formerly "Lockbox". The Ignition module ID and `lockbox:` storage keys keep that name for compatibility.
