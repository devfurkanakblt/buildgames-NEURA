'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

interface Task {
    id: number; title: string; target_object: string; original_url: string;
    cols: number; rows: number; current_workers: number; required_workers: number;
    status: string; reward_per_worker: string;
}

const CATEGORY_OPTIONS = ['All', 'Medical', 'Traffic', 'Agriculture', 'Satellites', 'Sport', 'Fashion'];

export default function MarketplacePage() {
    const { isConnected } = useAccount();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState<'reward' | 'progress' | 'newest'>('newest');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch(`${BACKEND_URL}/api/worker/tasks`);
                const data = await res.json();
                setTasks(data.tasks || []);
            } catch (e) {
                console.error(e);
            } finally { setLoading(false); }
        })();
    }, []);

    const sorted = [...tasks].sort((a, b) => {
        let diff = 0;
        if (sortBy === 'reward') diff = parseFloat(a.reward_per_worker || '0') - parseFloat(b.reward_per_worker || '0');
        if (sortBy === 'progress') diff = (a.current_workers / a.required_workers) - (b.current_workers / b.required_workers);
        if (sortBy === 'newest') diff = a.id - b.id;
        return sortDirection === 'desc' ? -diff : diff;
    });

    const totalRewards = tasks.reduce((sum, t) => sum + parseFloat(t.reward_per_worker || '0') * t.required_workers, 0);
    const activeTasks = tasks.filter(t => t.status === 'active').length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col relative overflow-x-hidden">
            {/* Background blobs */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[5%] left-[10%] w-80 h-80 bg-primary/8 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[40%] right-[5%] w-96 h-96 bg-secondary/6 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[5%] left-[30%] w-64 h-64 bg-purple-600/6 rounded-full blur-[80px] animate-blob animation-delay-4000" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full glass-panel">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="relative size-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-blue-600/20 border border-primary/30 shadow-neon">
                            <span className="material-symbols-outlined text-primary font-bold" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>neurology</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">NEURA</h1>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        {[{ href: '/', l: 'TASKS' }, { href: '/worker', l: 'WORKER' }, { href: '/company', l: 'COMPANY' }, { href: '/marketplace', l: 'MARKETPLACE', active: true }].map(n => (
                            <Link key={n.href} href={n.href} className={`text-sm font-medium tracking-wide py-1 border-b-2 transition-all ${n.active ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-white hover:border-white/20'}`}>{n.l}</Link>
                        ))}
                    </nav>
                    <ConnectButton />
                </div>
            </header>

            <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
                {/* Hero section */}
                <div className="mb-10 text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Live Task Marketplace
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                            Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Labeling Tasks</span>
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Discover AI training tasks, earn AVAX rewards, and build your on-chain reputation. All verifiable on Avalanche.
                        </p>
                    </motion.div>
                </div>

                {/* Stats banner */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                >
                    {[
                        { icon: 'assignment', label: 'Total Tasks', value: tasks.length, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
                        { icon: 'play_circle', label: 'Active', value: activeTasks, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
                        { icon: 'task_alt', label: 'Completed', value: completedTasks, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                        { icon: 'payments', label: 'Total Staked', value: `${totalRewards.toFixed(2)} AVAX`, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    ].map(s => (
                        <div key={s.label} className={`flex items-center gap-3 p-4 rounded-2xl ${s.bg} border ${s.border} glass-card`}>
                            <span className={`material-symbols-outlined ${s.color}`} style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                            <div>
                                <div className="text-xs text-slate-500">{s.label}</div>
                                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat
                                        ? 'bg-primary text-black'
                                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Sort by</span>
                        {(['newest', 'reward', 'progress'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => {
                                    if (sortBy === s) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                                    else { setSortBy(s); setSortDirection('desc'); }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${sortBy === s
                                        ? 'bg-white/10 border border-white/20 text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                {sortBy === s && (
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                                        {sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Task grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="neural-spinner" />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center glass-card rounded-2xl py-20 text-center gap-4">
                        <div className="text-5xl opacity-20">🔍</div>
                        <p className="text-xl text-slate-400">No tasks available</p>
                        <p className="text-slate-600 text-sm">Be the first to create a labeling task!</p>
                        <Link href="/company" className="mt-2 px-5 py-2.5 rounded-xl border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                            + Create Task
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {sorted.map((task, i) => {
                            const progress = Math.round((task.current_workers / task.required_workers) * 100);
                            const isCompleted = task.status === 'completed';
                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="glass-card rounded-2xl overflow-hidden flex flex-col group"
                                >
                                    {/* Image */}
                                    <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
                                        <img src={task.original_url} alt={task.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent" />
                                        {/* Status badge */}
                                        <div className={`absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isCompleted ? 'bg-secondary/20 border border-secondary/40 text-secondary' : 'bg-primary/20 border border-primary/40 text-primary'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-secondary' : 'bg-primary animate-pulse'}`} />
                                            {isCompleted ? 'Completed' : 'Active'}
                                        </div>
                                        {/* Task ID */}
                                        <div className="absolute top-3 right-3 px-2 py-1 bg-background-dark/80 rounded-lg border border-white/10 text-xs text-slate-400 font-mono">
                                            #{task.id}
                                        </div>
                                        {/* Reward */}
                                        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-background-dark/90 backdrop-blur-sm rounded-lg border border-primary/30 text-xs font-bold text-primary">
                                            {parseFloat(task.reward_per_worker || '0').toFixed(3)} AVAX/worker
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex-grow space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-white text-sm leading-tight truncate">{task.title}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">Find: <span className="text-primary font-medium">{task.target_object}</span></p>
                                        </div>
                                        {/* Progress */}
                                        <div>
                                            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                                <span>{task.current_workers}/{task.required_workers} workers</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isCompleted ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-blue-400'}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        {/* Total reward */}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Total pool</span>
                                            <span className="font-bold text-amber-400">
                                                {(parseFloat(task.reward_per_worker || '0') * task.required_workers).toFixed(3)} AVAX
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="px-4 pb-4">
                                        <Link
                                            href={isConnected ? `/worker` : '#'}
                                            className={`w-full py-2.5 text-center text-sm font-bold rounded-xl block transition-all ${isCompleted
                                                    ? 'border border-white/10 text-slate-500 cursor-not-allowed'
                                                    : 'border border-primary/30 text-primary hover:bg-primary hover:text-black group-hover:shadow-neon'
                                                }`}
                                        >
                                            {isCompleted ? '✓ Closed' : (
                                                <span className="flex items-center justify-center gap-1">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>work</span>
                                                    Label & Earn
                                                </span>
                                            )}
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Bottom CTA */}
                {!isConnected && (
                    <motion.div
                        className="mt-12 glass-card rounded-2xl p-8 text-center"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Earning?</h3>
                        <p className="text-slate-400 mb-6">Connect your wallet to start labeling and earning AVAX instantly</p>
                        <ConnectButton />
                    </motion.div>
                )}
            </main>

            <footer className="relative z-10 border-t border-slate-800/50 bg-background-dark/80 backdrop-blur-sm py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">© 2024 Neura Protocol · Powered by Avalanche C-Chain</p>
                </div>
            </footer>
        </div>
    );
}
