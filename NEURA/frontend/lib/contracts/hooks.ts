/**
 * Custom Wagmi hooks for NeuraCore contract interactions
 * Updated for Wagmi v2 API
 */

import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { keccak256, encodePacked } from 'viem';
import { NEURA_CORE_ADDRESS, NEURA_CORE_ABI } from './NeuraCore';
import { useState, useEffect } from 'react';

/**
 * Generate a random secret for commit-reveal
 */
function generateSecret(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Compute commitment hash for commit-reveal scheme
 */
function computeCommitHash(taskId: number, choice: string, secret: string): `0x${string}` {
    return keccak256(encodePacked(
        ['uint256', 'string', 'string'],
        [BigInt(taskId), choice, secret]
    ));
}

/**
 * Store secret in sessionStorage
 */
function storeSecret(taskId: number, secret: string, choice: string) {
    sessionStorage.setItem(`neura_secret_${taskId}`, JSON.stringify({ secret, choice }));
}

/**
 * Retrieve secret from sessionStorage
 */
function getStoredSecret(taskId: number): { secret: string; choice: string } | null {
    const stored = sessionStorage.getItem(`neura_secret_${taskId}`);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Clear secret from sessionStorage
 */
function clearSecret(taskId: number) {
    sessionStorage.removeItem(`neura_secret_${taskId}`);
}

/**
 * Hook to commit a signal (Phase 1)
 * Automatically generates secret and stores it locally
 */
export function useCommitSignal(taskId: number, choice: 'YES' | 'NO') {
    const [secret, setSecret] = useState<string>('');
    const [commitHash, setCommitHash] = useState<`0x${string}` | null>(null);

    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    // Generate secret and hash when choice is provided
    useEffect(() => {
        if (choice) {
            const newSecret = generateSecret();
            setSecret(newSecret);
            const hash = computeCommitHash(taskId, choice, newSecret);
            setCommitHash(hash);
            // Store secret for later reveal
            storeSecret(taskId, newSecret, choice);
        }
    }, [taskId, choice]);

    const commit = () => {
        if (!commitHash) return;

        writeContract({
            address: NEURA_CORE_ADDRESS,
            abi: NEURA_CORE_ABI,
            functionName: 'commitSignal',
            args: [BigInt(taskId), commitHash],
        });
    };

    return {
        commit,
        isCommitting: isPending,
        isCommitted: isSuccess,
        error,
    };
}

/**
 * Hook to reveal a signal (Phase 2)
 * Retrieves secret from local storage
 */
export function useRevealSignal(taskId: number) {
    const stored = getStoredSecret(taskId);
    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const reveal = () => {
        if (!stored) return;

        writeContract({
            address: NEURA_CORE_ADDRESS,
            abi: NEURA_CORE_ABI,
            functionName: 'revealSignal',
            args: [BigInt(taskId), stored.choice, stored.secret],
        });
    };

    // Clear secret after successful reveal
    useEffect(() => {
        if (isSuccess) {
            clearSecret(taskId);
        }
    }, [isSuccess, taskId]);

    return {
        reveal,
        isRevealing: isPending,
        isRevealed: isSuccess,
        canReveal: !!stored,
        error,
    };
}

/**
 * Hook to fetch task details
 */
export function useTaskDetails(taskId: number) {
    const { data, isLoading, isError, refetch } = useReadContract({
        address: NEURA_CORE_ADDRESS,
        abi: NEURA_CORE_ABI,
        functionName: 'getTask',
        args: [BigInt(taskId)],
    });

    return {
        task: data ? {
            id: data[0],
            ipfsHash: data[1],
            rewardPerVote: data[2],
            requiredVotes: data[3],
            currentVotes: data[4],
            isActive: data[5],
            requester: data[6],
            totalDeposit: data[7],
        } : null,
        isLoading,
        isError,
        refetch,
    };
}

/**
 * Hook to fetch node information
 */
export function useNodeInfo(address?: `0x${string}`) {
    const { data, isLoading, isError } = useReadContract({
        address: NEURA_CORE_ADDRESS,
        abi: NEURA_CORE_ABI,
        functionName: 'getNode',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        },
    });

    return {
        node: data ? {
            walletAddress: data[0],
            reputationScore: data[1],
            stakedAmount: data[2],
            tasksCompleted: data[3],
            correctAnswers: data[4],
        } : null,
        isLoading,
        isError,
    };
}

/**
 * Hook to get total task count
 */
export function useTaskCounter() {
    const { data, isLoading } = useReadContract({
        address: NEURA_CORE_ADDRESS,
        abi: NEURA_CORE_ABI,
        functionName: 'taskCounter',
    });

    return {
        totalTasks: data ? Number(data) : 0,
        isLoading,
    };
}

/**
 * Hook to register as a node
 */
export function useRegisterNode() {
    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const register = () => {
        writeContract({
            address: NEURA_CORE_ADDRESS,
            abi: NEURA_CORE_ABI,
            functionName: 'registerNode',
            value: BigInt(0.01 * 10 ** 18), // 0.01 AVAX in wei
        });
    };

    return {
        register,
        isRegistering: isPending,
        isRegistered: isSuccess,
        error,
    };
}
