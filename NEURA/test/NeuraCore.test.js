import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("NeuraCore", function () {
    let NeuraCore;
    let neura;
    let owner;
    let requester;
    let node1, node2, node3, node4, node5;

    const MIN_STAKE = ethers.parseEther("0.01");
    const REWARD_PER_VOTE = ethers.parseEther("0.1");
    const REQUIRED_VOTES = 5n;
    const IPFS_HASH = "QmTestHash123456789";
    const SECRET1 = "secret1", SECRET2 = "secret2", SECRET3 = "secret3", SECRET4 = "secret4", SECRET5 = "secret5";

    beforeEach(async function () {
        [owner, requester, node1, node2, node3, node4, node5] = await ethers.getSigners();
        NeuraCore = await ethers.getContractFactory("NeuraCore");
        neura = await NeuraCore.deploy();
        // Wait for deployment is handled in v6 via target vs address but for hardhat environment deploy() is usually enough,
        // or we can use await neura.waitForDeployment() for ethers v6.
        if (neura.waitForDeployment) {
            await neura.waitForDeployment();
        }
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await neura.owner()).to.equal(owner.address);
        });

        it("Should initialize taskCounter to 0", async function () {
            expect(await neura.taskCounter()).to.equal(0n);
        });
    });

    describe("Node Registration", function () {
        it("Should register a node with correct initial state", async function () {
            await expect(neura.connect(node1).registerNode({ value: MIN_STAKE }))
                .to.emit(neura, "NodeRegistered")
                .withArgs(node1.address, MIN_STAKE, 100n);

            const n = await neura.getNode(node1.address);
            expect(n.walletAddress).to.equal(node1.address);
            expect(n.reputationScore).to.equal(100n);
            expect(n.stakedAmount).to.equal(MIN_STAKE);
            expect(n.tasksCompleted).to.equal(0n);
            expect(n.correctAnswers).to.equal(0n);
        });

        it("Should fail if stake is less than MIN_STAKE", async function () {
            const lowStake = ethers.parseEther("0.005");
            await expect(neura.connect(node1).registerNode({ value: lowStake }))
                .to.be.revertedWith("Insufficient stake: minimum 0.01 AVAX required");
        });

        it("Should fail if node attempts to register twice", async function () {
            await neura.connect(node1).registerNode({ value: MIN_STAKE });
            await expect(neura.connect(node1).registerNode({ value: MIN_STAKE }))
                .to.be.revertedWith("Node already registered");
        });
    });

    describe("Task Lifeycle", function () {
        beforeEach(async function () {
            // Register 5 nodes
            await neura.connect(node1).registerNode({ value: MIN_STAKE });
            await neura.connect(node2).registerNode({ value: MIN_STAKE });
            await neura.connect(node3).registerNode({ value: MIN_STAKE });
            await neura.connect(node4).registerNode({ value: MIN_STAKE });
            await neura.connect(node5).registerNode({ value: MIN_STAKE });
        });

        it("Should create a task correctly", async function () {
            const totalDeposit = REWARD_PER_VOTE * REQUIRED_VOTES;
            await expect(neura.connect(requester).postTask(IPFS_HASH, REWARD_PER_VOTE, REQUIRED_VOTES, { value: totalDeposit }))
                .to.emit(neura, "TaskPosted")
                .withArgs(1n, requester.address, IPFS_HASH, REWARD_PER_VOTE);

            const t = await neura.getTask(1n);
            expect(t.id).to.equal(1n);
            expect(t.ipfsHash).to.equal(IPFS_HASH);
            expect(t.rewardPerVote).to.equal(REWARD_PER_VOTE);
            expect(t.requiredVotes).to.equal(REQUIRED_VOTES);
            expect(t.currentVotes).to.equal(0n);
            expect(t.isActive).to.be.true;
            expect(t.requester).to.equal(requester.address);
            expect(t.totalDeposit).to.equal(totalDeposit);
        });

        it("Should fail to create task without sufficient deposit", async function () {
            const insufficientDeposit = REWARD_PER_VOTE * 4n;
            await expect(neura.connect(requester).postTask(IPFS_HASH, REWARD_PER_VOTE, REQUIRED_VOTES, { value: insufficientDeposit }))
                .to.be.revertedWith("Insufficient funds: deposit rewardPerVote * requiredVotes");
        });

        it("Should execute a full task consensus lifecycle", async function () {
            const totalDeposit = REWARD_PER_VOTE * REQUIRED_VOTES;
            await neura.connect(requester).postTask(IPFS_HASH, REWARD_PER_VOTE, REQUIRED_VOTES, { value: totalDeposit });

            // Node 1-4 choose "A", Node 5 chooses "B" (Node 5 is wrong)
            const choiceA = "1,2,3";
            const choiceB = "4,5,6";

            // Helper to generate commit hash
            const getCommitHash = (taskId, choice, secret) => {
                const encoded = ethers.solidityPacked(["uint256", "string", "string"], [taskId, choice, secret]);
                return ethers.keccak256(encoded);
            };

            const hash1 = getCommitHash(1n, choiceA, SECRET1);
            const hash2 = getCommitHash(1n, choiceA, SECRET2);
            const hash3 = getCommitHash(1n, choiceA, SECRET3);
            const hash4 = getCommitHash(1n, choiceA, SECRET4);
            const hash5 = getCommitHash(1n, choiceB, SECRET5);

            // Phase 1: Commit
            await expect(neura.connect(node1).commitSignal(1n, hash1)).to.emit(neura, "SignalCommitted");
            await neura.connect(node2).commitSignal(1n, hash2);
            await neura.connect(node3).commitSignal(1n, hash3);
            await neura.connect(node4).commitSignal(1n, hash4);
            await neura.connect(node5).commitSignal(1n, hash5);

            // Cannot commit twice
            await expect(neura.connect(node1).commitSignal(1n, hash1)).to.be.revertedWith("Already committed");

            // Phase 2: Reveal & Finalize. The 5th reveal triggers finalizeTask.
            await expect(neura.connect(node1).revealSignal(1n, choiceA, SECRET1)).to.emit(neura, "SignalRevealed");
            await neura.connect(node2).revealSignal(1n, choiceA, SECRET2);
            await neura.connect(node3).revealSignal(1n, choiceA, SECRET3);
            await neura.connect(node4).revealSignal(1n, choiceA, SECRET4);

            // Node 5 reveals early triggering finalization automatically
            await expect(neura.connect(node5).revealSignal(1n, choiceB, SECRET5))
                .to.emit(neura, "TaskFinalized").withArgs(1n, choiceA, REWARD_PER_VOTE * 4n)
                .to.emit(neura, "ReputationUpdate").withArgs(node1.address, 105n, false) // reward
                .to.emit(neura, "ReputationUpdate").withArgs(node5.address, 90n, true);  // slash

            const t = await neura.getTask(1n);
            expect(t.isActive).to.be.false;

            // Check reputation changes
            const n1 = await neura.getNode(node1.address);
            expect(n1.reputationScore).to.equal(105n);
            expect(n1.correctAnswers).to.equal(1n);

            const n5 = await neura.getNode(node5.address);
            expect(n5.reputationScore).to.equal(90n); // Slashed by 10
            expect(n5.correctAnswers).to.equal(0n);
        });

        it("Should revert reveal with invalid secret", async function () {
            const totalDeposit = REWARD_PER_VOTE * REQUIRED_VOTES;
            await neura.connect(requester).postTask(IPFS_HASH, REWARD_PER_VOTE, REQUIRED_VOTES, { value: totalDeposit });

            const choiceA = "1,2,3";
            const encoded = ethers.solidityPacked(["uint256", "string", "string"], [1n, choiceA, SECRET1]);
            const hash1 = ethers.keccak256(encoded);

            await neura.connect(node1).commitSignal(1n, hash1);

            await expect(neura.connect(node1).revealSignal(1n, choiceA, "wrongsecret"))
                .to.be.revertedWith("Reveal does not match commit hash");
        });
    });
});
