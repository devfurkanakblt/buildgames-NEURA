// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NeuraCore
 * @author Neura Team
 * @notice Core smart contract for decentralized "Label-to-Earn" data labeling platform
 * @dev Workers commit tile-selection hashes, then backend calls finalizeTask to distribute rewards.
 *
 * KEY INNOVATION: Redundancy-based consensus. The same task is sent to multiple Neural Nodes.
 * Only those who agree with the majority (determined by the backend off-chain service) get
 * rewarded. This creates a self-regulating ecosystem incentivizing honest, accurate labeling.
 */
contract NeuraCore is Ownable, ReentrancyGuard {

    // ============================================
    // STRUCTS
    // ============================================

    /**
     * @dev Task represents a data labeling job posted by a company (Requester).
     * @notice ipfsHash points to the image uploaded to IPFS/Pinata.
     */
    struct Task {
        uint256 id;
        string ipfsHash;
        uint256 rewardPerVote;      // AVAX per correct worker (in wei)
        uint256 requiredVotes;      // Redundancy factor (typically 5)
        uint256 currentVotes;       // Submissions so far
        bool isActive;
        address requester;
        uint256 totalDeposit;
        address[] voters;           // All workers who committed (for iteration in finalizeTask)
        mapping(address => bool) hasVoted;
    }

    /**
     * @dev Neural Node = a worker who staked AVAX to participate in labeling.
     */
    struct Node {
        address walletAddress;
        uint256 reputationScore;    // Starts at 100
        uint256 stakedAmount;
        uint256 tasksCompleted;
        uint256 correctAnswers;
    }

    /**
     * @dev Commit-reveal scheme to prevent mempool snooping.
     * Workers first commit keccak256(taskId + tilesCsv + secret), then reveal later.
     */
    struct Commit {
        bytes32 commitHash;
        uint256 timestamp;
        bool revealed;
        string choice;              // Comma-separated tile indices after reveal
    }

    // ============================================
    // STATE
    // ============================================

    mapping(uint256 => Task) public tasks;
    mapping(address => Node) public nodes;
    mapping(uint256 => mapping(address => Commit)) public commits;

    uint256 public taskCounter;
    uint256 public constant MIN_STAKE = 0.01 ether;
    uint256 public constant REPUTATION_SLASH = 10;
    uint256 public constant REPUTATION_REWARD = 5;
    uint256 public constant REVEAL_WINDOW = 1 hours;

    // ============================================
    // EVENTS
    // ============================================

    event NodeRegistered(address indexed nodeAddress, uint256 stakedAmount, uint256 reputationScore);
    event TaskPosted(uint256 indexed taskId, address indexed requester, string ipfsHash, uint256 rewardPerVote);
    event SignalCommitted(uint256 indexed taskId, address indexed node, bytes32 commitHash);
    event SignalRevealed(uint256 indexed taskId, address indexed node, string choice);
    event TaskFinalized(uint256 indexed taskId, string majorityAnswer, uint256 rewardDistributed);
    event ReputationUpdate(address indexed node, uint256 newReputation, bool wasSlashed);

    // ============================================
    // CONSTRUCTOR
    // ============================================

    constructor() Ownable(msg.sender) {
        taskCounter = 0;
    }

    // ============================================
    // NODE MANAGEMENT
    // ============================================

    /**
     * @notice Register as a Neural Node by staking AVAX.
     * @dev Minimum stake prevents Sybil attacks. Reputation starts at 100.
     */
    function registerNode() external payable nonReentrant {
        require(msg.value >= MIN_STAKE, "Insufficient stake: minimum 0.01 AVAX required");
        require(nodes[msg.sender].walletAddress == address(0), "Node already registered");

        nodes[msg.sender] = Node({
            walletAddress: msg.sender,
            reputationScore: 100,
            stakedAmount: msg.value,
            tasksCompleted: 0,
            correctAnswers: 0
        });

        emit NodeRegistered(msg.sender, msg.value, 100);
    }

    // ============================================
    // TASK LIFECYCLE
    // ============================================

    /**
     * @notice Post a new data labeling task with full reward pre-funded.
     * @param _ipfsHash IPFS CID of the image
     * @param _rewardPerVote AVAX reward per correct worker (wei)
     * @param _requiredVotes How many workers must label this task
     */
    function postTask(
        string memory _ipfsHash,
        uint256 _rewardPerVote,
        uint256 _requiredVotes
    ) external payable nonReentrant {
        require(_requiredVotes > 0, "Required votes must be > 0");
        require(_rewardPerVote > 0, "Reward must be > 0");

        uint256 totalReward = _rewardPerVote * _requiredVotes;
        require(msg.value >= totalReward, "Insufficient funds: deposit rewardPerVote * requiredVotes");

        taskCounter++;
        Task storage newTask = tasks[taskCounter];
        newTask.id = taskCounter;
        newTask.ipfsHash = _ipfsHash;
        newTask.rewardPerVote = _rewardPerVote;
        newTask.requiredVotes = _requiredVotes;
        newTask.currentVotes = 0;
        newTask.isActive = true;
        newTask.requester = msg.sender;
        newTask.totalDeposit = msg.value;
        // newTask.voters is initialized as empty dynamic array by default

        emit TaskPosted(taskCounter, msg.sender, _ipfsHash, _rewardPerVote);
    }

    /**
     * @notice Phase 1 of commit-reveal: submit a hash of your tile selection.
     * @param _taskId Task to vote on
     * @param _commitHash keccak256(abi.encodePacked(taskId, tilesCsv, secret))
     */
    function commitSignal(uint256 _taskId, bytes32 _commitHash) external {
        require(tasks[_taskId].isActive, "Task is not active");
        require(nodes[msg.sender].walletAddress != address(0), "Not a registered node");
        require(!tasks[_taskId].hasVoted[msg.sender], "Already voted on this task");
        require(commits[_taskId][msg.sender].timestamp == 0, "Already committed");

        commits[_taskId][msg.sender] = Commit({
            commitHash: _commitHash,
            timestamp: block.timestamp,
            revealed: false,
            choice: ""
        });

        // Track this voter so we can iterate them during finalization
        tasks[_taskId].voters.push(msg.sender);

        emit SignalCommitted(_taskId, msg.sender, _commitHash);
    }

    /**
     * @notice Phase 2 of commit-reveal: reveal your tile selection.
     * @param _taskId Task to reveal for
     * @param _choice Comma-separated tile indices (e.g., "0,3,7")
     * @param _secret Random nonce used in original commit
     */
    function revealSignal(
        uint256 _taskId,
        string memory _choice,
        string memory _secret
    ) external nonReentrant {
        Task storage task = tasks[_taskId];
        Commit storage commit = commits[_taskId][msg.sender];

        require(task.isActive, "Task is not active");
        require(commit.timestamp > 0, "No commit found - call commitSignal first");
        require(!commit.revealed, "Already revealed");
        require(
            block.timestamp <= commit.timestamp + REVEAL_WINDOW,
            "Reveal window expired (1 hour)"
        );

        // Verify revealed data matches original commit
        bytes32 computedHash = keccak256(abi.encodePacked(_taskId, _choice, _secret));
        require(computedHash == commit.commitHash, "Reveal does not match commit hash");

        commit.revealed = true;
        commit.choice = _choice;
        task.hasVoted[msg.sender] = true;
        task.currentVotes++;

        emit SignalRevealed(_taskId, msg.sender, _choice);

        // Auto-finalize when enough votes are in
        if (task.currentVotes >= task.requiredVotes) {
            _finalizeTask(_taskId);
        }
    }

    /**
     * @notice Public entry point to finalize a task (callable by backend after all votes in).
     * @param _taskId Task to finalize
     */
    function finalizeTask(uint256 _taskId) external nonReentrant {
        _finalizeTask(_taskId);
    }

    /**
     * @notice Internal finalization: find majority answer, pay winners, slash losers.
     * @dev Iterates task.voters[] — each voter must have committed+revealed.
     *
     * CONSENSUS LOGIC:
     *   - Collect all revealed choices
     *   - Majority = the choice that >= ceil(n/2) workers agreed on
     *   - Winners receive rewardPerVote from the contract's balance
     *   - Losers get reputation slashed (no stake loss in v1)
     */
    function _finalizeTask(uint256 _taskId) internal {
        Task storage task = tasks[_taskId];
        require(task.isActive, "Task already finalized");
        require(task.currentVotes >= task.requiredVotes, "Not enough votes yet");

        task.isActive = false;

        // Collect revealed choices to find the majority
        address[] memory voterList = task.voters;
        uint256 n = voterList.length;

        string[] memory choices = new string[](n);
        uint256 revealedCount = 0;

        for (uint256 i = 0; i < n; i++) {
            Commit storage c = commits[_taskId][voterList[i]];
            if (c.revealed) {
                choices[revealedCount] = c.choice;
                revealedCount++;
            }
        }

        // Find the most common choice (majority)
        string memory majorityAnswer = "";
        uint256 maxVotes = 0;

        for (uint256 i = 0; i < revealedCount; i++) {
            uint256 count = 0;
            for (uint256 j = 0; j < revealedCount; j++) {
                if (_strEq(choices[i], choices[j])) count++;
            }
            if (count > maxVotes) {
                maxVotes = count;
                majorityAnswer = choices[i];
            }
        }

        // Pay correct workers and update reputations
        uint256 rewardDistributed = 0;
        uint256 threshold = (n / 2) + 1; // strict majority

        for (uint256 i = 0; i < n; i++) {
            address voter = voterList[i];
            Commit storage c = commits[_taskId][voter];
            Node storage node = nodes[voter];

            if (!c.revealed) continue;

            bool isCorrect = _strEq(c.choice, majorityAnswer) && maxVotes >= threshold;

            if (isCorrect) {
                // Pay the worker
                uint256 reward = task.rewardPerVote;
                if (address(this).balance >= reward) {
                    (bool sent, ) = payable(voter).call{value: reward}("");
                    if (sent) rewardDistributed += reward;
                }

                // Boost reputation (cap at 500)
                if (node.reputationScore + REPUTATION_REWARD <= 500) {
                    node.reputationScore += REPUTATION_REWARD;
                } else {
                    node.reputationScore = 500;
                }
                node.correctAnswers++;
                emit ReputationUpdate(voter, node.reputationScore, false);
            } else {
                // Slash reputation (floor at 0)
                if (node.reputationScore >= REPUTATION_SLASH) {
                    node.reputationScore -= REPUTATION_SLASH;
                } else {
                    node.reputationScore = 0;
                }
                emit ReputationUpdate(voter, node.reputationScore, true);
            }

            node.tasksCompleted++;
        }

        emit TaskFinalized(_taskId, majorityAnswer, rewardDistributed);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function getTask(uint256 _taskId) external view returns (
        uint256 id,
        string memory ipfsHash,
        uint256 rewardPerVote,
        uint256 requiredVotes,
        uint256 currentVotes,
        bool isActive,
        address requester,
        uint256 totalDeposit
    ) {
        Task storage t = tasks[_taskId];
        return (t.id, t.ipfsHash, t.rewardPerVote, t.requiredVotes, t.currentVotes, t.isActive, t.requester, t.totalDeposit);
    }

    function getNode(address _nodeAddress) external view returns (
        address walletAddress,
        uint256 reputationScore,
        uint256 stakedAmount,
        uint256 tasksCompleted,
        uint256 correctAnswers
    ) {
        Node storage node = nodes[_nodeAddress];
        return (node.walletAddress, node.reputationScore, node.stakedAmount, node.tasksCompleted, node.correctAnswers);
    }

    function getTaskVoters(uint256 _taskId) external view returns (address[] memory) {
        return tasks[_taskId].voters;
    }

    // ============================================
    // ADMIN
    // ============================================

    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    // ============================================
    // INTERNAL HELPERS
    // ============================================

    function _strEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }
}
