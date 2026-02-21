'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

interface Task {
    id: number;
    title: string;
    target_object: string;
    task_type: string;
    original_url: string;
    cols: number;
    rows: number;
    current_workers: number;
    required_workers: number;
    status: string;
    reward_per_worker: string;
}

const isClassification = (t: Task) => t.task_type === 'Image Classification';

/* ─── Unified Task Modal ───────────────────────────────────────────────────── */
function TaskModal({
    task,
    onClose,
    onBBoxSubmit,
    onClassificationSubmit,
}: {
    task: Task;
    onClose: () => void;
    onBBoxSubmit: (taskId: number, tiles: number[]) => Promise<void>;
    onClassificationSubmit: (taskId: number, answer: 'yes' | 'no') => Promise<void>;
}) {
    const clf = isClassification(task);

    // BBox state
    const [selected, setSelected] = useState<number[]>([]);
    // Shared state
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [chosen, setChosen] = useState<'yes' | 'no' | null>(null);

    const handleTileToggle = (idx: number) =>
        setSelected(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

    const handleBBoxSubmit = async () => {
        if (selected.length === 0) return;
        setSubmitting(true);
        await onBBoxSubmit(task.id, selected);
        setDone(true);
        setSubmitting(false);
        setTimeout(onClose, 1800);
    };

    const handleVote = async (answer: 'yes' | 'no') => {
        setChosen(answer);
        setSubmitting(true);
        await onClassificationSubmit(task.id, answer);
        setDone(true);
        setSubmitting(false);
        setTimeout(onClose, 1800);
    };

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div className="absolute inset-0 bg-background-dark/80 backdrop-blur-md" onClick={onClose} />
            <motion.div
                className={`relative z-10 w-full glass-card rounded-3xl overflow-hidden ${clf ? 'max-w-lg' : 'max-w-2xl'}`}
                initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
            >
                {/* Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                            style={clf
                                ? { background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00F5FF' }
                                : { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                        >
                            {clf ? 'Image Classification' : 'Bounding Box'}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{task.title}</h3>
                        {!clf && (
                            <p className="text-sm text-slate-400">
                                Select ALL tiles containing: <span className="text-primary font-semibold">{task.target_object}</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    {done ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                            <div className="text-5xl">{clf ? (chosen === 'yes' ? '✅' : '❌') : '✅'}</div>
                            <h4 className="text-xl font-bold text-secondary">Submission Recorded!</h4>
                            <p className="text-slate-400 text-sm">
                                {clf
                                    ? <>You voted <span className="font-bold text-white">&ldquo;{chosen}&rdquo;</span> — committed to consensus pool.</>
                                    : 'Your tiles have been committed to the consensus pool.'}
                            </p>
                        </div>
                    ) : clf ? (
                        /* ── Classification: full image + Yes/No ── */
                        <>
                            <div className="relative w-full rounded-2xl overflow-hidden mb-5" style={{ aspectRatio: '4/3' }}>
                                <img src={task.original_url} alt={task.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-slate-400 text-sm mb-1">Does this image contain:</p>
                                <p className="text-2xl font-bold">
                                    <span className="text-primary">{task.target_object}</span>
                                    <span className="text-slate-300"> ?</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => handleVote('no')}
                                    disabled={submitting}
                                    className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-400/60 transition-all disabled:opacity-40 group"
                                >
                                    <span className="text-4xl font-black text-red-400 group-hover:text-red-300 transition-colors">✗</span>
                                    <span className="text-lg font-bold text-red-400 group-hover:text-red-300">No</span>
                                    <span className="text-xs text-slate-500">Not present in image</span>
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => handleVote('yes')}
                                    disabled={submitting}
                                    className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border-2 border-primary/30 bg-primary/10 hover:bg-primary/20 hover:border-primary/60 transition-all disabled:opacity-40 group"
                                >
                                    <span className="text-4xl font-black text-primary group-hover:text-white transition-colors">✓</span>
                                    <span className="text-lg font-bold text-primary group-hover:text-white">Yes</span>
                                    <span className="text-xs text-slate-500">Object is present</span>
                                </motion.button>
                            </div>

                            <p className="text-center text-xs text-slate-600 mt-4">
                                Earn <span className="text-primary font-bold">{parseFloat(task.reward_per_worker || '0').toFixed(4)} AVAX</span> if your answer matches consensus
                            </p>
                        </>
                    ) : (
                        /* ── BBox: tile grid ── */
                        <>
                            <div
                                className="relative w-full rounded-xl overflow-hidden mb-4 select-none"
                                style={{ aspectRatio: `${task.cols}/${task.rows}` }}
                            >
                                <img src={task.original_url} alt={task.title} className="absolute inset-0 w-full h-full object-cover" />
                                <div
                                    className="absolute inset-0 grid"
                                    style={{ gridTemplateColumns: `repeat(${task.cols}, 1fr)`, gridTemplateRows: `repeat(${task.rows}, 1fr)` }}
                                >
                                    {Array.from({ length: task.cols * task.rows }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleTileToggle(i)}
                                            className={`border border-primary/20 transition-all flex items-center justify-center cursor-pointer ${selected.includes(i)
                                                ? 'bg-primary/50 border-primary shadow-[inset_0_0_10px_rgba(0,242,255,0.3)]'
                                                : 'hover:bg-primary/10'}`}
                                        >
                                            {selected.includes(i) && (
                                                <span className="material-symbols-outlined text-white font-bold" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-slate-400">
                                    {selected.length > 0 ? `${selected.length} tile${selected.length > 1 ? 's' : ''} selected` : 'Tap tiles to select them'}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setSelected([])} className="px-4 py-2 rounded-xl text-sm border border-white/10 hover:bg-white/10 transition-all text-slate-300">
                                        Clear
                                    </button>
                                    <button
                                        onClick={handleBBoxSubmit}
                                        disabled={selected.length === 0 || submitting}
                                        className="px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 bg-gradient-to-r from-primary to-blue-400 text-black hover:shadow-neon transition-all"
                                    >
                                        {submitting ? 'Submitting...' : `Submit ${selected.length > 0 ? `(${selected.length})` : ''}`}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─── Worker Task Card ─────────────────────────────────────────────────────── */
function WorkerTaskCard({ task, onSelect }: { task: Task; onSelect: () => void }) {
    const progress = Math.round((task.current_workers / task.required_workers) * 100);
    const earnEst = parseFloat(task.reward_per_worker || '0').toFixed(3);
    const clf = isClassification(task);

    return (
        <motion.div
            onClick={onSelect}
            className="glass-card rounded-2xl overflow-hidden cursor-pointer group relative flex flex-col"
            whileHover={{ y: -6 }}
            style={{ transform: 'translateZ(0)' }}
        >
            {/* Image */}
            <div className="relative overflow-hidden" style={{ aspectRatio: clf ? '4/3' : `${task.cols ?? 3}/${task.rows ?? 4}` }}>
                <img
                    src={task.original_url}
                    alt={task.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Grid overlay for BBox */}
                {!clf && (
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            backgroundImage: `linear-gradient(rgba(0,242,255,0.3) 1px, transparent 1px),linear-gradient(90deg, rgba(0,242,255,0.3) 1px, transparent 1px)`,
                            backgroundSize: `${100 / (task.cols ?? 3)}% ${100 / (task.rows ?? 4)}%`,
                        }}
                    />
                )}
                {/* Yes/No hover hint for Classification */}
                {clf && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-8 bg-black/40">
                        <span className="text-3xl font-black text-red-400">✗</span>
                        <span className="text-slate-400 text-xl">/</span>
                        <span className="text-3xl font-black text-primary">✓</span>
                    </div>
                )}
                {/* Reward badge */}
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-background-dark/80 backdrop-blur-sm border border-primary/30 text-xs font-bold text-primary">
                    {earnEst} AVAX
                </div>
                {/* Task type badge */}
                <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm"
                    style={clf
                        ? { background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.3)', color: '#00F5FF' }
                        : { background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                >
                    {clf ? 'Classify' : 'BBox'}
                </div>
            </div>

            {/* Info */}
            <div className="p-3 space-y-2 flex-grow">
                <p className="font-semibold text-white text-sm leading-tight truncate">{task.title}</p>
                <p className="text-xs text-slate-400">
                    <span className="text-primary font-medium">{task.target_object}</span>
                </p>
                <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>{task.current_workers}/{task.required_workers} workers</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${clf ? 'bg-gradient-to-r from-primary to-teal-400' : 'bg-gradient-to-r from-purple-500 to-blue-400'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* CTA button */}
            <div className="px-3 pb-3">
                <div className={`w-full py-2 text-center text-xs font-bold rounded-lg border transition-all ${clf
                    ? 'border-primary/30 text-primary group-hover:bg-primary group-hover:text-black'
                    : 'border-purple-500/30 text-purple-400 group-hover:bg-purple-500 group-hover:text-white'}`}>
                    <span className="material-symbols-outlined mr-1" style={{ fontSize: '14px', verticalAlign: 'text-top' }}>
                        {clf ? 'fact_check' : 'edit'}
                    </span>
                    {clf ? 'Classify' : 'Label Now'}
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Worker Page ─────────────────────────────────────────────────────── */
export default function WorkerPage() {
    const { address, isConnected } = useAccount();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ tasksCompleted: 0, totalEarned: '0', reputation: 0 });

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const url = address
                ? `${BACKEND_URL}/api/worker/tasks?worker_address=${address}`
                : `${BACKEND_URL}/api/worker/tasks`;
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            setTasks(data.tasks || []);
            if (data.stats) setStats(data.stats);
        } catch (e) {
            console.error('Failed to fetch tasks', e);
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleBBoxSubmit = async (taskId: number, selectedTiles: number[]) => {
        if (!address) return;
        await fetch(`${BACKEND_URL}/api/worker/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, worker_address: address, selected_tiles: selectedTiles }),
        });
        await fetchTasks();
    };

    const handleClassificationSubmit = async (taskId: number, answer: 'yes' | 'no') => {
        if (!address) return;
        await fetch(`${BACKEND_URL}/api/worker/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId, worker_address: address, classification_answer: answer }),
        });
        await fetchTasks();
    };

    const filtered = tasks.filter(t => {
        const matchStatus = filter === 'all' || t.status === filter;
        const matchSearch = !searchQuery
            || t.title.toLowerCase().includes(searchQuery.toLowerCase())
            || t.target_object.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col relative overflow-x-hidden">
            {/* Background glows */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] right-[5%] w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[5%] w-80 h-80 bg-secondary/8 rounded-full blur-[100px]" />
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
                        {[{ href: '/', l: 'TASKS' }, { href: '/worker', l: 'WORKER', active: true }, { href: '/company', l: 'COMPANY' }, { href: '/marketplace', l: 'MARKETPLACE' }].map(n => (
                            <Link key={n.href} href={n.href} className={`text-sm font-medium tracking-wide py-1 border-b-2 transition-all ${n.active ? 'text-primary border-primary' : 'text-slate-400 border-transparent hover:text-white hover:border-white/20'}`}>{n.l}</Link>
                        ))}
                    </nav>
                    <ConnectButton />
                </div>
            </header>

            <main className="relative z-10 flex-grow max-w-7xl mx-auto px-6 py-10 w-full">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4 text-center">
                        <div className="text-6xl">👤</div>
                        <h2 className="text-2xl font-bold text-white">Connect to Start Earning</h2>
                        <p className="text-slate-400">Connect your wallet to access labeling tasks and track your rewards</p>
                        <ConnectButton />
                    </div>
                ) : (
                    <>
                        {/* Page title */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-4xl font-bold text-white tracking-tight">Worker Portal</h2>
                                <p className="text-slate-400">Label data, earn AVAX, build your reputation</p>
                            </div>
                            <button
                                onClick={fetchTasks}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm font-medium hover:border-primary/30 transition-all self-start"
                            >
                                <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: '16px' }}>refresh</span>
                                Refresh
                            </button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { icon: 'neurology', label: 'Address', value: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '', bg: 'bg-primary/10', color: 'text-primary' },
                                { icon: 'check_circle', label: 'Completed', value: String(stats.tasksCompleted), bg: 'bg-secondary/10', color: 'text-secondary' },
                                { icon: 'payments', label: 'Earned', value: `${stats.totalEarned} AVAX`, bg: 'bg-amber-500/10', color: 'text-amber-400' },
                                { icon: 'military_tech', label: 'Reputation', value: String(stats.reputation), bg: 'bg-purple-500/10', color: 'text-purple-400' },
                            ].map(s => (
                                <div key={s.label} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                                    <span className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.color} shrink-0`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs text-slate-500">{s.label}</div>
                                        <div className="text-sm font-semibold text-white truncate">{s.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Filters + Search */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: '18px' }}>search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search tasks..."
                                    className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-primary/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                {(['all', 'active', 'completed'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${filter === f
                                            ? 'bg-primary/15 border border-primary/50 text-primary'
                                            : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Task Grid */}
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="neural-spinner" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center glass-card rounded-2xl py-16 text-center gap-4">
                                <div className="text-5xl opacity-30">📭</div>
                                <p className="text-xl text-slate-400 font-medium">No tasks found</p>
                                <p className="text-slate-600 text-sm">Try changing the filter or check back later</p>
                                <Link href="/company" className="mt-2 px-4 py-2 rounded-lg border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                                    + Create Task as Company
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {filtered.map((task, i) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <WorkerTaskCard task={task} onSelect={() => setSelectedTask(task)} />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="relative z-10 border-t border-slate-800/50 bg-background-dark/80 backdrop-blur-sm py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-slate-500 text-sm">© 2024 Neura Protocol · Powered by Avalanche C-Chain</p>
                </div>
            </footer>

            {/* Single AnimatePresence with one TaskModal child — no reconciliation ambiguity */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskModal
                        key={selectedTask.id}
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onBBoxSubmit={handleBBoxSubmit}
                        onClassificationSubmit={handleClassificationSubmit}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
