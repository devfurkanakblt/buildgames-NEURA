/**
 * NeuraCore Smart Contract Configuration
 * ABI and contract address for Avalanche C-Chain
 */

// Contract address - updated after redeploy (2026-02-20)
export const NEURA_CORE_ADDRESS = (process.env.NEXT_PUBLIC_NEURA_CORE_ADDRESS ||
    '0xBd76B0AD98626877c62332AAd9A64Cb2Ed707040') as `0x${string}`;

// Contract ABI - Generated from NeuraCore.sol
export const NEURA_CORE_ABI = [
    {
        type: 'constructor',
        inputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'registerNode',
        inputs: [],
        outputs: [],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'postTask',
        inputs: [
            { name: '_ipfsHash', type: 'string', internalType: 'string' },
            { name: '_rewardPerVote', type: 'uint256', internalType: 'uint256' },
            { name: '_requiredVotes', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'payable',
    },
    {
        type: 'function',
        name: 'commitSignal',
        inputs: [
            { name: '_taskId', type: 'uint256', internalType: 'uint256' },
            { name: '_commitHash', type: 'bytes32', internalType: 'bytes32' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'revealSignal',
        inputs: [
            { name: '_taskId', type: 'uint256', internalType: 'uint256' },
            { name: '_choice', type: 'string', internalType: 'string' },
            { name: '_secret', type: 'string', internalType: 'string' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'finalizeTask',
        inputs: [
            { name: '_taskId', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
    },
    {
        type: 'function',
        name: 'getTask',
        inputs: [
            { name: '_taskId', type: 'uint256', internalType: 'uint256' },
        ],
        outputs: [
            { name: 'id', type: 'uint256', internalType: 'uint256' },
            { name: 'ipfsHash', type: 'string', internalType: 'string' },
            { name: 'rewardPerVote', type: 'uint256', internalType: 'uint256' },
            { name: 'requiredVotes', type: 'uint256', internalType: 'uint256' },
            { name: 'currentVotes', type: 'uint256', internalType: 'uint256' },
            { name: 'isActive', type: 'bool', internalType: 'bool' },
            { name: 'requester', type: 'address', internalType: 'address' },
            { name: 'totalDeposit', type: 'uint256', internalType: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'getNode',
        inputs: [
            { name: '_nodeAddress', type: 'address', internalType: 'address' },
        ],
        outputs: [
            { name: 'walletAddress', type: 'address', internalType: 'address' },
            { name: 'reputationScore', type: 'uint256', internalType: 'uint256' },
            { name: 'stakedAmount', type: 'uint256', internalType: 'uint256' },
            { name: 'tasksCompleted', type: 'uint256', internalType: 'uint256' },
            { name: 'correctAnswers', type: 'uint256', internalType: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        name: 'taskCounter',
        inputs: [],
        outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
        stateMutability: 'view',
    },
    {
        type: 'event',
        name: 'NodeRegistered',
        inputs: [
            { name: 'nodeAddress', type: 'address', indexed: true, internalType: 'address' },
            { name: 'stakedAmount', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'reputationScore', type: 'uint256', indexed: false, internalType: 'uint256' },
        ],
    },
    {
        type: 'event',
        name: 'TaskPosted',
        inputs: [
            { name: 'taskId', type: 'uint256', indexed: true, internalType: 'uint256' },
            { name: 'requester', type: 'address', indexed: true, internalType: 'address' },
            { name: 'ipfsHash', type: 'string', indexed: false, internalType: 'string' },
            { name: 'reward', type: 'uint256', indexed: false, internalType: 'uint256' },
        ],
    },
    {
        type: 'event',
        name: 'SignalCommitted',
        inputs: [
            { name: 'taskId', type: 'uint256', indexed: true, internalType: 'uint256' },
            { name: 'node', type: 'address', indexed: true, internalType: 'address' },
            { name: 'commitHash', type: 'bytes32', indexed: false, internalType: 'bytes32' },
        ],
    },
    {
        type: 'event',
        name: 'SignalRevealed',
        inputs: [
            { name: 'taskId', type: 'uint256', indexed: true, internalType: 'uint256' },
            { name: 'node', type: 'address', indexed: true, internalType: 'address' },
            { name: 'choice', type: 'string', indexed: false, internalType: 'string' },
        ],
    },
    {
        type: 'event',
        name: 'TaskFinalized',
        inputs: [
            { name: 'taskId', type: 'uint256', indexed: true, internalType: 'uint256' },
            { name: 'majorityAnswer', type: 'string', indexed: false, internalType: 'string' },
            { name: 'rewardDistributed', type: 'uint256', indexed: false, internalType: 'uint256' },
        ],
    },
    {
        type: 'event',
        name: 'ReputationUpdate',
        inputs: [
            { name: 'node', type: 'address', indexed: true, internalType: 'address' },
            { name: 'newReputation', type: 'uint256', indexed: false, internalType: 'uint256' },
            { name: 'wasSlashed', type: 'bool', indexed: false, internalType: 'bool' },
        ],
    },
] as const;

// Type exports for TypeScript
export type Task = {
    id: bigint;
    ipfsHash: string;
    rewardPerVote: bigint;
    requiredVotes: bigint;
    currentVotes: bigint;
    isActive: boolean;
    requester: `0x${string}`;
    totalDeposit: bigint;
};

export type NodeInfo = {
    walletAddress: `0x${string}`;
    reputationScore: bigint;
    stakedAmount: bigint;
    tasksCompleted: bigint;
    correctAnswers: bigint;
};
