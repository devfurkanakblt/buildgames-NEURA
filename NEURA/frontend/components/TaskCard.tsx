'use client';

/**
 * TaskCard Component
 * Holographic card for data labeling tasks with commit-reveal interaction
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { formatEther } from 'viem';
import { getIpfsUrl } from '@/lib/ipfs';
import { useCommitSignal, useRevealSignal } from '@/lib/contracts/hooks';
import NeuralLoader from './NeuralLoader';

interface TaskCardProps {
    taskId: number;
    ipfsHash: string;
    reward: bigint;
    requiredVotes: bigint;
    currentVotes: bigint;
    isActive: boolean;
}

type VoteChoice = 'YES' | 'NO' | null;
type CardState = 'idle' | 'committing' | 'committed' | 'revealing' | 'completed';

export default function TaskCard({
    taskId,
    ipfsHash,
    reward,
    requiredVotes,
    currentVotes,
    isActive,
}: TaskCardProps) {
    const [choice, setChoice] = useState<VoteChoice>(null);
    const [cardState, setCardState] = useState<CardState>('idle');
    const [imageLoaded, setImageLoaded] = useState(false);

    // Commit-reveal hooks
    const commitHook = useCommitSignal(taskId, choice || 'YES');
    const revealHook = useRevealSignal(taskId);

    // Update card state based on transaction status
    useEffect(() => {
        if (commitHook.isCommitting) {
            setCardState('committing');
        } else if (commitHook.isCommitted && !revealHook.isRevealed) {
            setCardState('committed');
        } else if (revealHook.isRevealing) {
            setCardState('revealing');
        } else if (revealHook.isRevealed) {
            setCardState('completed');
        }
    }, [commitHook.isCommitting, commitHook.isCommitted, revealHook.isRevealing, revealHook.isRevealed]);

    const handleVote = (voteChoice: 'YES' | 'NO') => {
        if (cardState !== 'idle' && cardState !== 'committed') return;

        setChoice(voteChoice);

        if (cardState === 'idle') {
            // Phase 1: Commit
            setTimeout(() => {
                commitHook.commit?.();
            }, 100);
        } else if (cardState === 'committed') {
            // Phase 2: Reveal
            revealHook.reveal?.();
        }
    };

    return (
        <motion.div
            className="holographic-card group cursor-pointer p-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onHoverStart={() => {
                // Glitch effect on hover
                if (cardState === 'idle') {
                    document.getElementById(`card-${taskId}`)?.classList.add('animate-glitch');
                }
            }}
            onHoverEnd={() => {
                document.getElementById(`card-${taskId}`)?.classList.remove('animate-glitch');
            }}
        >
            <div id={`card-${taskId}`} className="glass rounded-xl p-6 space-y-4">
                {/* Task Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/30">
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="neural-spinner" />
                        </div>
                    )}
                    <Image
                        src={getIpfsUrl(ipfsHash)}
                        alt="Task data"
                        fill
                        className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        unoptimized // For IPFS images
                    />

                    {/* Task ID badge */}
                    <div className="absolute top-2 left-2 rounded-full bg-primary-cyan/20 backdrop-blur-sm px-3 py-1 text-xs font-bold text-primary-cyan">
                        Task #{taskId}
                    </div>

                    {/* Progress badge */}
                    <div className="absolute top-2 right-2 rounded-full bg-glass backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
                        {Number(currentVotes)}/{Number(requiredVotes)} votes
                    </div>
                </div>

                {/* Reward Display */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Reward</span>
                    <span className="text-2xl font-bold text-primary-cyan">
                        {formatEther(reward)} AVAX
                    </span>
                </div>

                {/* Loading State */}
                {(cardState === 'committing' || cardState === 'revealing') && (
                    <NeuralLoader
                        message={cardState === 'committing' ? 'Committing your answer...' : 'Revealing your choice...'}
                        step={cardState === 'committing' ? 'Step 1 of 2' : 'Step 2 of 2'}
                        progress={cardState === 'committing' ? 50 : 100}
                    />
                )}

                {/* Completed State */}
                {cardState === 'completed' && (
                    <motion.div
                        className="rounded-lg bg-success/10 border border-success p-4 text-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="text-lg font-bold text-success">✓ Vote Submitted!</div>
                        <div className="text-sm text-gray-400 mt-1">
                            Your choice: <span className="text-white font-semibold">{choice}</span>
                        </div>
                    </motion.div>
                )}

                {/* Action Buttons */}
                {cardState === 'idle' && (
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            className="neon-success py-4 text-lg font-bold"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVote('YES')}
                            disabled={!isActive}
                        >
                            ✓ YES
                        </motion.button>
                        <motion.button
                            className="neon-danger py-4 text-lg font-bold"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleVote('NO')}
                            disabled={!isActive}
                        >
                            ✗ NO
                        </motion.button>
                    </div>
                )}

                {/* Reveal Button (after commit) */}
                {cardState === 'committed' && revealHook.canReveal && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <div className="rounded-lg bg-primary-cyan/10 border border-primary-cyan p-3 text-center text-sm">
                            <div className="font-semibold text-primary-cyan">✓ Committed</div>
                            <div className="text-gray-400 mt-1">Now reveal your answer to complete the vote</div>
                        </div>
                        <motion.button
                            className="neon-button w-full bg-holographic py-4 text-lg font-bold"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => revealHook.reveal?.()}
                        >
                            🔓 Reveal Answer
                        </motion.button>
                    </motion.div>
                )}

                {/* Inactive State */}
                {!isActive && cardState !== 'completed' && (
                    <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-3 text-center text-sm text-gray-400">
                        This task is no longer active
                    </div>
                )}
            </div>
        </motion.div>
    );
}
