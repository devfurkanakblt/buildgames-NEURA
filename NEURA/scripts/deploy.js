import hre from "hardhat";
import fs from "fs";

async function main() {
    console.log("🚀 Deploying NeuraCore contract to Avalanche...");

    // Get the contract factory
    const NeuraCore = await hre.ethers.getContractFactory("NeuraCore");

    // Deploy the contract
    console.log("⏳ Deploying...");
    const neuraCore = await NeuraCore.deploy();

    await neuraCore.waitForDeployment();

    const contractAddress = await neuraCore.getAddress();

    console.log("✅ NeuraCore deployed successfully!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("\n📋 Next Steps:");
    console.log("1. Verify contract on Snowtrace (if on mainnet/testnet):");
    console.log(`   npx hardhat verify --network fuji ${contractAddress}`);
    console.log("\n2. Update your frontend .env with:");
    console.log(`   NEXT_PUBLIC_NEURA_CORE_ADDRESS=${contractAddress}`);
    console.log("\n3. Test the contract:");
    console.log("   - Register as a node");
    console.log("   - Post a test task");
    console.log("   - Submit and reveal signals");

    // Save deployment info to a file for frontend integration
    const deploymentInfo = {
        contractAddress: contractAddress,
        network: hre.network.name,
        deployedAt: new Date().toISOString(),
        chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    };

    fs.writeFileSync(
        "deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n💾 Deployment info saved to deployment-info.json");
}

// Error handling
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
