import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.AVALANCHE_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Minimal ABI - only functions backend needs to call
const ABI = [
    'function postTask(string memory _ipfsHash, uint256 _rewardPerVote, uint256 _requiredVotes) external payable',
    'function finalizeTask(uint256 _taskId) external',
];

const contract = new ethers.Contract(
    process.env.NEURA_CORE_ADDRESS,
    ABI,
    wallet
);

/**
 * Post a new task to the blockchain
 * @param {string} ipfsHash - Pinata CID for the task image
 * @param {number} rewardPerWorker - AVAX per worker
 * @param {number} requiredWorkers - Number of workers needed
 */
export async function postTaskOnChain(ipfsHash, rewardPerWorker, requiredWorkers = 5) {
    const rewardWei = ethers.parseEther(String(rewardPerWorker));
    const totalValue = rewardWei * BigInt(requiredWorkers);

    const tx = await contract.postTask(ipfsHash, rewardWei, requiredWorkers, {
        value: totalValue,
    });
    const receipt = await tx.wait();
    console.log(`✅ Task posted on chain: ${receipt.hash}`);
    return receipt.hash;
}

/**
 * Finalize task on blockchain to trigger reward distribution
 * The contract handles reward distribution internally
 * @param {number} taskId - Blockchain task ID
 */
export async function distributeRewards(taskId, correctWorkers, rewardPerWorker) {
    // Call finalizeTask on the smart contract
    // The contract will handle reward distribution based on commit-reveal
    const tx = await contract.finalizeTask(taskId);
    const receipt = await tx.wait();
    return receipt.hash;
}

/**
 * Get backend wallet address (for info/debugging)
 */
export function getBackendWallet() {
    return wallet.address;
}

export default { postTaskOnChain, distributeRewards, getBackendWallet };
