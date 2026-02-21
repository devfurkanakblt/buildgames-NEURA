# Neura - Module 1: NeuraCore Smart Contract

## 🎯 Overview

**NeuraCore.sol** is the foundational smart contract for Neura, a decentralized "Label-to-Earn" data labeling platform on Avalanche C-Chain. This contract implements a unique consensus-based reward system where data labeling tasks are distributed to multiple workers, and rewards are given based on majority agreement.

## 🔑 Key Features

### 1. **Neural Node Registration**
- Workers stake AVAX (minimum 0.1) to become "Neural Nodes"
- Each node starts with a reputation score of 100
- Stakes serve as collateral to prevent Sybil attacks

### 2. **Task Creation**
- Requesters (AI companies) create tasks by depositing AVAX
- Tasks reference IPFS-hosted data (images, text, etc.)
- Configurable redundancy factor (default: 5 workers per task)

### 3. **Commit-Reveal Scheme** ⭐
**Why it matters:** Prevents mempool snooping where malicious nodes could copy answers from pending transactions.

**How it works:**
1. **Commit Phase:** Node submits `keccak256(taskId + choice + secret)`
2. **Reveal Phase:** Node reveals actual `choice` and `secret`
3. Contract verifies the hash matches the original commitment

This ensures nodes cannot see others' answers before committing to their own.

### 4. **Consensus-Based Rewards**
- After required votes are collected, the majority answer is identified
- **Majority voters:** Receive reward + reputation boost (+5 points)
- **Minority voters:** No reward + reputation slash (-10 points)

This creates a Nash equilibrium where honest labeling is the optimal strategy.

## 📋 Contract Functions

### Worker Functions

#### `registerNode()` - Become a Neural Node
```solidity
function registerNode() external payable
```
- **Required:** Send ≥ 0.1 AVAX
- **Effect:** Registers caller as a worker with 100 reputation
- **Emits:** `NodeRegistered`

#### `commitSignal(uint256 taskId, bytes32 commitHash)` - Submit Answer (Phase 1)
```solidity
function commitSignal(uint256 _taskId, bytes32 _commitHash) external
```
- **Input:** Hash of your answer: `keccak256(abi.encodePacked(taskId, choice, secret))`
- **Effect:** Stores commitment with timestamp
- **Emits:** `SignalCommitted`

#### `revealSignal(uint256 taskId, string choice, string secret)` - Reveal Answer (Phase 2)
```solidity
function revealSignal(uint256 _taskId, string memory _choice, string memory _secret) external
```
- **Input:** Your actual choice and secret used in commit
- **Effect:** Verifies hash, records vote
- **Deadline:** Must reveal within 1 hour of commit
- **Emits:** `SignalRevealed`
- **Auto-finalizes:** If required votes reached

### Requester Functions

#### `postTask(...)`  - Create Labeling Task
```solidity
function postTask(
    string memory _ipfsHash,
    uint256 _rewardPerVote,
    uint256 _requiredVotes
) external payable
```
- **Inputs:**
  - `ipfsHash`: IPFS CID of data to label
  - `rewardPerVote`: AVAX per correct vote
  - `requiredVotes`: Number of workers needed
- **Required:** Send `rewardPerVote * requiredVotes` AVAX
- **Emits:** `TaskPosted`

### Admin/Public Functions

#### `finalizeTask(uint256 taskId)` - Distribute Rewards
```solidity
function finalizeTask(uint256 _taskId) external
```
- Can be called by anyone once required votes are in
- Identifies majority answer
- Distributes rewards to majority
- Slashes reputation of minority
- **Emits:** `TaskFinalized`, `ReputationUpdate`

## 🔒 Security Features

1. **ReentrancyGuard:** Protects all state-changing functions
2. **Ownable:** Admin emergency functions
3. **Commit-Reveal:** Prevents frontrunning
4. **Double-vote prevention:** `hasVoted` mapping
5. **Input validation:** Requires checks on all parameters

## ⚙️ Configuration Constants

```solidity
MIN_STAKE = 0.1 ether           // Minimum to become a node
REPUTATION_SLASH = 10           // Points deducted for wrong answers
REPUTATION_REWARD = 5           // Points earned for correct answers
REVEAL_WINDOW = 1 hours         // Time to reveal after commit
```

## 📁 Project Structure

```
contracts/
  ├── NeuraCore.sol        # Main contract (THIS FILE)
  └── Test.sol             # Simple test contract

scripts/
  └── deploy.js            # Deployment script

hardhat.config.js          # Avalanche C-Chain configuration
.env.example               # Environment variables template
```

## 🚀 Deployment Options

### Option 1: Hardhat (Recommended after fixing Windows issues)
```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Add your PRIVATE_KEY and SNOWTRACE_API_KEY

# 3. Compile
npx hardhat compile

# 4. Deploy to Fuji Testnet
npx hardhat run scripts/deploy.js --network fuji

# 5. Verify on Snowtrace
npx hardhat verify --network fuji <CONTRACT_ADDRESS>
```

### Option 2: Remix IDE (Quickest for MVP)
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create new file `NeuraCore.sol`
3. Paste contract code
4. Compile with Solidity 0.8.20
5. Deploy using "Injected Provider - MetaMask"
6. Set network to Avalanche Fuji Testnet in MetaMask

### Option 3: Foundry (Alternative to Hardhat)
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize Foundry project
forge init --no-commit
cp contracts/NeuraCore.sol src/

# Install OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts

# Compile
forge build

# Deploy
forge create NeuraCore \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --private-key $PRIVATE_KEY
```

## 🎨 Frontend Integration (Next Module)

The contract is designed to integrate seamlessly with Next.js + Wagmi + RainbowKit:

```typescript
// Example: Register as a node
const { write } = useContractWrite({
  address: NEURA_CORE_ADDRESS,
  abi: NeuraABI,
  functionName: 'registerNode',
  value: parseEther('0.1'),
});

// Example: Post a task
const { write } = useContractWrite({
  address: NEURA_CORE_ADDRESS,
  abi: NeuraABI,
  functionName: 'postTask',
  args: [ipfsHash, rewardPerVote, 5],
  value: totalReward,
});
```

## 📝 Notes & Known Issues

### ⚠️ Current Limitations (MVP)
1. **Voter tracking:** The `finalizeTask` function has a placeholder for iterating voters. In production, maintain a dynamic array of voters per task.
2. **Gas optimization:** The vote counting logic can be optimized by storing choices in an array instead of relying on mappings.
3. **Partial slashing:** Currently only reputation is slashed. Future versions could slash actual stake for repeated bad behavior.

### 🐛 Known Issue: Hardhat Compilation
There's a Hardhat configuration/compatibility issue on the current Windows environment. The contract itself is valid Solidity 0.8.20 code. **Recommended workarounds:**
- Use Remix IDE for immediate deployment
- Switch to Foundry (more reliable on Windows)
- Debug Hardhat issue by checking:
  - Node.js version compatibility
  - ESM vs CommonJS module conflicts
  - OpenZeppelin contracts version

## 📚 Further Reading

- [Avalanche C-Chain Docs](https://docs.avax.network/dapps/smart-contracts)
- [Commit-Reveal Schemes](https://karl.tech/learning-solidity-part-2-voting/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/)

## 🎯 Next Steps (Module 2)

1. Fix Hardhat setup or migrate to Foundry
2. Deploy to Avalanche Fuji Testnet
3. Write unit tests for all functions
4. Implement IPFS integration for data storage
5. Build Next.js frontend to interact with contract
6. Add USDC token support (currently uses native AVAX)

---

**Built with ❤️ for Avalanche BuildGames Hackathon**
