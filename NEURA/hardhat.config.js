import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

// Validate private key
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const hasValidKey = PRIVATE_KEY && PRIVATE_KEY.length === 64;

if (!hasValidKey) {
    console.warn("⚠️  WARNING: No valid PRIVATE_KEY in .env file. Deployment will not work.");
    console.warn("   To deploy, add your MetaMask private key (without 0x) to .env file");
}

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        // Avalanche Fuji Testnet
        fuji: {
            url: process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
            chainId: 43113,
            accounts: hasValidKey ? [PRIVATE_KEY] : [],
            gasPrice: 225000000000, // 225 nAVAX
        },
        // Avalanche Mainnet (for future production deployment)
        avalanche: {
            url: "https://api.avax.network/ext/bc/C/rpc",
            chainId: 43114,
            accounts: hasValidKey ? [PRIVATE_KEY] : [],
            gasPrice: 225000000000,
        },
    },
    etherscan: {
        apiKey: {
            avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
            avalanche: process.env.SNOWTRACE_API_KEY || "",
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
