'use client';

/**
 * Main Dashboard / Landing Page
 * Stitch-designed Neural Interface
 */

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import TaskCard from '@/components/TaskCard';
import { useTaskCounter, useTaskDetails, useNodeInfo, useRegisterNode } from '@/lib/contracts/hooks';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

/* ─── Shared Nav Header ───────────────────────────────────────────────────── */
function NavHeader({ active }: { active: 'dashboard' | 'worker' | 'company' | 'marketplace' }) {
    return (
        <header className="sticky top-0 z-50 w-full glass-panel">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative size-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/30 shadow-neon">
                        <span className="material-symbols-outlined text-primary font-bold" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>neurology</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">NEURA</h1>
                        <p className="text-[10px] text-slate-500 leading-none">Neural Interface</p>
                    </div>
                </Link>

                {/* Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {[
                        { href: '/', label: 'TASKS', key: 'dashboard' },
                        { href: '/worker', label: 'WORKER', key: 'worker' },
                        { href: '/company', label: 'COMPANY', key: 'company' },
                    ].map(item => (
                        <Link
                            key={item.key}
                            href={item.href}
                            prefetch={true}
                            className={`text-sm font-medium tracking-wide py-1 border-b-2 transition-all ${active === item.key
                                ? 'text-primary border-primary'
                                : 'text-slate-400 border-transparent hover:text-white hover:border-white/20'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Wallet + Network */}
                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-1">
                        <span className="text-[10px] text-slate-500">Network</span>
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Avalanche
                        </span>
                    </div>
                    <ConnectButton />
                </div>
            </div>
        </header>
    );
}

/* ─── Home / Landing Page ─────────────────────────────────────────────────── */
export default function HomePage() {
    const { address, isConnected } = useAccount();
    const { totalTasks } = useTaskCounter();
    const { node } = useNodeInfo(address);
    const { register, isRegistering, isRegistered } = useRegisterNode();
    const [activeTaskIds, setActiveTaskIds] = useState<number[]>([]);
    const [stats, setStats] = useState({ tasksCompleted: 0, totalEarned: '0', reputation: 50 });

    const fetchWorkerStats = useCallback(async () => {
        if (!address) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/worker/tasks?worker_address=${address}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (e) {
            console.error('Failed to fetch worker stats', e);
        }
    }, [address]);

    useEffect(() => {
        if (isConnected) fetchWorkerStats();
    }, [isConnected, fetchWorkerStats]);

    useEffect(() => {
        if (totalTasks > 0) {
            setActiveTaskIds(Array.from({ length: totalTasks }, (_, i) => i + 1));
        }
    }, [totalTasks]);

    const isNode = node && node.stakedAmount > 0n;

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-black">
            {/* Ambient background glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob" />
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full mix-blend-screen filter blur-[100px] opacity-25 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-secondary/10 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-4000" />
            </div>

            <NavHeader active="dashboard" />

            <main className="relative z-10 flex-grow">
                <AnimatePresence mode="wait">
                    {!isConnected ? (
                        /* ── Landing / Not connected ── */
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 text-center"
                        >
                            <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-12">
                                {/* Hero visual */}
                                <div className="relative group">
                                    <div className="absolute inset-0 -m-8 rounded-full border border-primary/10 animate-[pulse_4s_ease-in-out_infinite]" />
                                    <div className="absolute inset-0 -m-4 rounded-full border border-primary/20 animate-[pulse_3s_ease-in-out_infinite]" />
                                    <div className="relative size-36 md:size-44 rounded-full flex items-center justify-center bg-surface-dark neon-ring backdrop-blur-sm">
                                        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
                                        <span className="text-7xl md:text-8xl animate-pulse-slow">🧠</span>
                                    </div>
                                </div>

                                {/* Headline */}
                                <div className="space-y-5 max-w-2xl">
                                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                                        The Future of<br />
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">AI Data Labeling</span>
                                    </h2>
                                    <p className="text-lg md:text-xl text-slate-400 font-light max-w-xl mx-auto leading-relaxed">
                                        Join the decentralized workforce. Label data, train models, and earn instant rewards on the Avalanche network.
                                    </p>
                                </div>

                                {/* Feature pills */}
                                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                                    {[
                                        { icon: 'lock', label: 'Commit-Reveal Protocol' },
                                        { icon: 'bolt', label: 'Instant AVAX Rewards' },
                                        { icon: 'globe', label: 'Avalanche Powered' },
                                    ].map(f => (
                                        <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-dark border border-slate-700 shadow-lg backdrop-blur-md">
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{f.icon}</span>
                                            <span className="text-sm font-medium text-slate-300">{f.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className="pt-2">
                                    <ConnectButton.Custom>
                                        {({ openConnectModal }) => (
                                            <button
                                                onClick={openConnectModal}
                                                className="holo-border group relative flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg min-w-[260px] overflow-hidden transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <span className="material-symbols-outlined">account_balance_wallet</span>
                                                Connect Wallet to Earn
                                            </button>
                                        )}
                                    </ConnectButton.Custom>
                                    <p className="mt-4 text-xs text-slate-500 font-medium tracking-wide uppercase">Powered by Avalanche Subnet</p>
                                </div>

                                {/* Trust stats */}
                                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-800/50 pt-10 w-full text-center">
                                    {[
                                        { value: '$4.2M', label: 'Paid to Labelers' },
                                        { value: '125K+', label: 'Tasks Completed' },
                                        { value: '12.5s', label: 'Avg Finality' },
                                        { value: '15K+', label: 'Active Workers' },
                                    ].map(s => (
                                        <div key={s.label} className="space-y-1">
                                            <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : !isNode ? (
                        /* ── Register as Node ── */
                        <motion.div
                            key="register"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16"
                        >
                            <div className="glass-card rounded-2xl max-w-md w-full p-8 space-y-6 text-center">
                                <div className="text-5xl">⚡</div>
                                <h2 className="text-2xl font-bold text-white">Become a Neural Node</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Stake 0.01 AVAX to register as a Neural Node and start earning rewards by labeling data.
                                </p>
                                <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-left space-y-2">
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Benefits</p>
                                    {['Earn AVAX for accurate labeling', 'Build reputation score', 'Access to all labeling tasks'].map(b => (
                                        <div key={b} className="flex items-center gap-2 text-sm text-white">
                                            <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>check_circle</span>
                                            {b}
                                        </div>
                                    ))}
                                </div>
                                <motion.button
                                    className="w-full py-4 rounded-xl font-bold text-black bg-gradient-to-r from-primary to-blue-400 shadow-neon hover:shadow-[0_0_30px_rgba(0,242,255,0.6)] transition-all"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => register?.()}
                                    disabled={isRegistering || isRegistered}
                                >
                                    {isRegistering ? 'Registering...' : isRegistered ? '✓ Registered!' : 'Register (0.01 AVAX)'}
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        /* ── Active Worker Dashboard ── */
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-10"
                        >
                            {/* Welcome + AVAX price ticker */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-4xl font-bold text-white mb-1 tracking-tight">Active Worker Dashboard</h2>
                                    <p className="text-slate-400">Manage your labeling tasks and track your earnings in real-time.</p>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 self-start md:self-auto">
                                    <span className="material-symbols-outlined text-secondary" style={{ fontSize: '16px' }}>trending_up</span>
                                    <span className="text-sm font-medium text-secondary">AVAX Live on Avalanche</span>
                                </div>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        icon: 'military_tech', color: 'text-primary', bg: 'bg-primary/15',
                                        label: 'Reputation Score',
                                        value: stats.reputation,
                                        sub: '+2.5%', subColor: 'text-secondary',
                                        barColor: 'bg-primary shadow-neon', barW: '85%',
                                    },
                                    {
                                        icon: 'check_circle', color: 'text-secondary', bg: 'bg-secondary/15',
                                        label: 'Tasks Completed',
                                        value: stats.tasksCompleted,
                                        sub: '+4 today', subColor: 'text-secondary',
                                        barColor: 'bg-secondary shadow-neon-green', barW: '60%',
                                    },
                                    {
                                        icon: 'paid', color: 'text-purple-400', bg: 'bg-purple-500/15',
                                        label: 'Earnings',
                                        value: `${stats.totalEarned} AVAX`,
                                        sub: stats.tasksCompleted > 0 ? `${stats.tasksCompleted} tasks done` : 'No tasks yet',
                                        subColor: 'text-secondary',
                                        barColor: 'bg-gradient-to-r from-primary to-purple-500',
                                        barW: stats.tasksCompleted > 0
                                            ? `${Math.min(Number(stats.totalEarned) > 0 ? 100 : 50, 100)}%`
                                            : '0%',
                                    },
                                ].map(s => (
                                    <div key={s.label} className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <span className={`material-symbols-outlined text-6xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                                                </span>
                                                <span className="text-slate-300 font-medium text-sm">{s.label}</span>
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <span className="text-5xl font-bold text-white tracking-tighter">{String(s.value)}</span>
                                                <span className={`text-sm font-bold mb-2 flex items-center ${s.subColor}`}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_upward</span>
                                                    {s.sub}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${s.barColor}`} style={{ width: s.barW }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tasks section */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white">Available Tasks</h3>
                                        {activeTaskIds.length > 0 && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary text-black">
                                                {activeTaskIds.length} New
                                            </span>
                                        )}
                                    </div>
                                    <Link href="/worker" prefetch={true} className="flex items-center gap-1 text-sm text-primary hover:text-white transition-colors">
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                                        Worker Mode
                                    </Link>
                                </div>

                                {activeTaskIds.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center min-h-[35vh] rounded-2xl border border-white/5 glass-card p-12 text-center gap-4"
                                    >
                                        <div className="text-5xl opacity-40">📋</div>
                                        <p className="text-xl text-slate-400">No active tasks available</p>
                                        <p className="text-sm text-slate-600">Check back soon for new labeling tasks</p>
                                        <Link href="/company" prefetch={true} className="mt-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                                            + Create Task as Company
                                        </Link>
                                    </motion.div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {activeTaskIds.map((taskId, index) => (
                                            <TaskCardWrapper key={taskId} taskId={taskId} index={index} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* AI bot FAB */}
            <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary/20 backdrop-blur-md border border-primary text-primary hover:bg-primary hover:text-black hover:shadow-neon transition-all flex items-center justify-center z-50 group">
                <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </button>
        </div>
    );
}

/* ─── Task Card Wrapper ───────────────────────────────────────────────────── */
function TaskCardWrapper({ taskId, index }: { taskId: number; index: number }) {
    const { task, isLoading } = useTaskDetails(taskId);
    if (isLoading || !task || !task.isActive) return null;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
        >
            <TaskCard
                taskId={taskId}
                ipfsHash={task.ipfsHash}
                reward={task.rewardPerVote}
                requiredVotes={task.requiredVotes}
                currentVotes={task.currentVotes}
                isActive={task.isActive}
            />
        </motion.div>
    );
}
