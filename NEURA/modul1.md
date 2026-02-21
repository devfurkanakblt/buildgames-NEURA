**COMMAND:** Generate the **NeuraCore.sol** Smart Contract.

**LOGIC REQUIREMENTS:**
1.  **Structs:**
    - `Task`: `id`, `ipfsHash`, `rewardPerVote`, `requiredVotes` (redundancy), `voteCount`, `isActive`.
    - `Node`: `walletAddress`, `reputationScore` (starts at 100), `stakedAmount`.
2.  **Functions:**
    - `registerNode()`: Payable. User stakes AVAX to become a "Neural Node".
    - `postTask(...)`: Requester deposits funds to create a labeling task.
    - `submitSignal(uint256 taskId, string choice)`: Node submits a label. 
      - *CRITICAL:* Use a commit-reveal scheme OR a simple hash check to prevent nodes from copying each other's answers in the mempool.
    - `finalizeTask(uint256 taskId)`: Checks if `voteCount` >= `requiredVotes`. Distributes rewards to the majority, slashes the minority (reduces reputation).
3.  **Events:** `NodeRegistered`, `TaskPosted`, `SignalTransmitted`, `ReputationUpdate`.

**STYLE:** - Use OpenZeppelin libraries (Ownable, ReentrancyGuard).
- Add extensive comments explaining *why* you did what you did (for Hackathon judges to read).