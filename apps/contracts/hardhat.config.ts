import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import { existsSync } from "node:fs";

// Load apps/contracts/.env without an extra dependency (Node >= 20.12).
if (existsSync(".env")) process.loadEnvFile(".env");

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // `pnpm contracts:node` sets INTERVAL_MINING so the local node makes a
    // block every second like Celo. Tests leave it off to keep exact control
    // of block timestamps.
    hardhat: process.env.INTERVAL_MINING
      ? { mining: { auto: true, interval: 1000 } }
      : {},
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
    },
    "celo-sepolia": {
      url:
        process.env.CELO_SEPOLIA_RPC_URL ||
        "https://forno.celo-sepolia.celo-testnet.org",
      accounts,
      chainId: 11142220,
    },
    // Celo mainnet is intentionally NOT configured. Deploying real-value
    // contracts must be a deliberate, reviewed change — see README.
  },
  etherscan: {
    apiKey: {
      "celo-sepolia": process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celo-sepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=11142220",
          browserURL: "https://sepolia.celoscan.io",
        },
      },
    ],
  },
  sourcify: { enabled: false },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};

export default config;
