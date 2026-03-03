'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

// ── Types ────────────────────────────────────────────────────────────────────

interface CreatedTask { task_id: number; original_url: string; cols: number; rows: number; }
interface TaskResult {
    task: {
        id: number; title: string; target_object: string; status: string;
        consensus_tiles: number[]; current_workers: number; required_workers: number; original_url: string;
    };
    submissions: { worker_address: string; selected_tiles: number[]; is_correct: boolean }[];
}
type BulkResults = { created: { task_id: number; title: string; original_url: string }[]; failed: { index: number; filename: string; error: string }[] };

const TASK_TYPES = [
    'Image Classification',
    'Object Detection (Bounding Box)',
];

const REWARD_PER_WORKER = 0.05; // AVAX

// ── Step Indicator ────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
    const steps = [
        { label: 'Dataset', icon: 'upload_file' },
        { label: 'Configure', icon: 'tune' },
        { label: 'Review', icon: 'rocket_launch' },
    ];
    return (
        <div className="flex items-center w-full max-w-2xl">
            {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                    <div key={s.label} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${done ? 'bg-primary/20 border border-primary text-primary shadow-[0_0_10px_rgba(0,242,255,0.3)]' :
                                active ? 'bg-gradient-to-r from-primary to-blue-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' :
                                    'bg-surface-dark border border-white/15 text-slate-500'
                                }`}>
                                {done
                                    ? <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                    : <span className="material-symbols-outlined text-base">{s.icon}</span>
                                }
                            </div>
                            <span className={`text-[11px] font-semibold ${active ? 'text-white' : done ? 'text-primary' : 'text-slate-500'}`}>{s.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-[1px] mx-3 mb-5 transition-all ${done ? 'bg-gradient-to-r from-primary to-primary/60' : 'bg-white/10'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ── Nav Header ────────────────────────────────────────────────────────────────

function NavHeader() {
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

                {/* Nav links */}
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
                            className={`text-sm font-medium tracking-wide py-1 border-b-2 transition-all ${item.key === 'company'
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

// ── Step 1: Dataset Upload ────────────────────────────────────────────────────

interface Step1Props {
    files: File[];
    setFiles: (files: File[]) => void;
    onNext: () => void;
}
function Step1Upload({ files, setFiles, onNext }: Step1Props) {
    const isBulk = files.length > 1;
    const preview = files.length === 1 ? URL.createObjectURL(files[0]) : null;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (accepted) => {
            if (accepted.length === 0) return;
            // Merge with existing but keep unique
            const merged = [...files, ...accepted];
            const unique = merged.filter((f, i, arr) =>
                arr.findIndex(x => x.name === f.name && x.size === f.size) === i
            );
            setFiles(unique.slice(0, 100)); // Cap at 100
        },
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        maxSize: 10 * 1024 * 1024,
        multiple: true,
    });

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex flex-col gap-6 max-w-3xl"
        >
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">Create Labeling Task</h2>
                <p className="text-slate-400">Upload one image for a single task, or multiple images to create a batch of tasks at once.</p>
            </div>

            {/* Unified dropzone */}
            <div
                {...getRootProps()}
                className={`relative group rounded-2xl p-1 cursor-pointer transition-all overflow-hidden border-2 border-dashed ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/50'
                    }`}
            >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
                <input {...getInputProps()} />
                <div className="py-12 flex flex-col items-center justify-center text-center bg-background-dark/30 rounded-xl">
                    {files.length === 0 && (
                        <>
                            <div className="relative mb-5">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-glow" />
                                <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-neon">
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '36px' }}>cloud_upload</span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Drag &amp; Drop Images</h3>
                            <p className="text-slate-400 text-sm mb-5 max-w-sm">
                                Upload <span className="text-primary font-medium">one image</span> for a single task, or <span className="text-primary font-medium">multiple</span> for a bulk batch.
                                <br />JPG, PNG, WebP · Max 10 MB each
                            </p>
                            <div className="px-5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-medium text-sm transition-all hover:shadow-neon flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">folder_open</span>
                                Browse Files
                            </div>
                        </>
                    )}
                    {files.length === 1 && (
                        <div className="space-y-4">
                            <div className="relative group/preview mx-auto flex items-center justify-center">
                                <img src={preview!} alt="preview" className="max-h-52 rounded-xl shadow-neon object-contain border border-white/10" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity bg-black/40 rounded-xl">
                                    <span className="text-xs font-bold text-white bg-primary/80 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Change Image
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400">
                                <span className="text-white font-medium">{files[0].name}</span> · Ready for single task
                                <br />
                                <span className="text-[10px] text-slate-500 mt-1 block">Drop more files to switch to bulk mode</span>
                            </p>
                        </div>
                    )}
                    {isBulk && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-3xl">photo_library</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                {files.length} / 100 images ready for bulk deployment
                            </div>
                            <p className="text-xs text-slate-500">Drop more to add, or manage them below</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Thumbnail grid for bulk — outside dropzone to avoid click conflicts */}
            {isBulk && (
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-white/5 rounded-2xl border border-white/5">
                    {files.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="relative group/thumb rounded-lg overflow-hidden border border-white/10 aspect-square">
                            <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/70 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center z-10 hover:bg-red-500"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-slate-300 px-1 truncate">{i + 1}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mode status badge */}
            {files.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full animate-pulse ${isBulk ? 'bg-purple-400' : 'bg-primary'}`} />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {isBulk ? `Bulk Mode: ${files.length} Tasks` : 'Single Task Mode'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-xs font-semibold text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Clear all
                    </button>
                </div>
            )}

            <button
                onClick={onNext}
                disabled={files.length === 0}
                className="self-start flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-blue-400 hover:shadow-neon hover:scale-[1.02] transition-all"
            >
                Continue to Configuration
                <span className="material-symbols-outlined">arrow_forward</span>
            </button>
        </motion.div>
    );
}

// ── Step 2: Configuration ─────────────────────────────────────────────────────

interface Step2Props {
    title: string; setTitle: (v: string) => void;
    taskType: string; setTaskType: (v: string) => void;
    targetObject: string; setTargetObject: (v: string) => void;
    rewardPerWorker: string; setRewardPerWorker: (v: string) => void;
    minReputation: number; setMinReputation: (v: number) => void;
    requiredWorkers: string; setRequiredWorkers: (v: string) => void;
    onBack: () => void; onNext: () => void;
    fileCount: number;
}
function Step2Config({ title, setTitle, taskType, setTaskType, targetObject, setTargetObject, rewardPerWorker, setRewardPerWorker, minReputation, setMinReputation, requiredWorkers, setRequiredWorkers, onBack, onNext, fileCount }: Step2Props) {
    const isBulk = fileCount > 1;
    const taskCount = fileCount;
    const workersCount = Number(requiredWorkers) || 1;
    const totalCost = parseFloat(rewardPerWorker || '0') * workersCount * taskCount;
    const platformFee = totalCost * 0.01;
    const totalWithFee = totalCost + platformFee;

    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
            {/* Left: Form */}
            <div className="lg:col-span-7 flex flex-col gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Task Configuration</h2>
                    <p className="text-slate-400">Set task parameters. Configuration impacts quality and labeler selection.</p>
                </div>

                <div className="glass-card rounded-2xl p-6 space-y-5">
                    <div className="flex items-center gap-2 pb-4 border-b border-white/8">
                        <span className="material-symbols-outlined text-primary">tune</span>
                        <h3 className="font-bold text-white">Task Settings</h3>
                    </div>

                    {/* Task Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Type</label>
                        <div className="relative">
                            <select
                                value={taskType}
                                onChange={e => setTaskType(e.target.value)}
                                className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 px-4 py-3 text-sm font-medium text-white appearance-none cursor-pointer focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                                style={{ background: 'rgba(5,11,24,0.5)' }}
                            >
                                {TASK_TYPES.map(t => <option key={t} value={t} className="bg-surface-dark">{t}</option>)}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                    </div>

                    {/* Project name / prefix */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {isBulk ? 'Title Prefix' : 'Project Name'}
                        </label>
                        <input
                            type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder={isBulk ? 'e.g. Dog Classifier (→ Dog Classifier #1, #2…)' : 'e.g. Traffic Light Detection v2'}
                            className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                        {isBulk && (
                            <p className="text-[11px] text-slate-600">Tasks will be named: <span className="text-primary font-mono">{title || 'My Dataset'} #1 … #{fileCount}</span></p>
                        )}
                    </div>

                    {/* Target object */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Object</label>
                        <input
                            type="text" value={targetObject} onChange={e => setTargetObject(e.target.value)}
                            placeholder="e.g. traffic light, stop sign, person"
                            className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all"
                        />
                    </div>

                    {/* Reward per worker */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reward per Worker</label>
                        <div className="relative">
                            <input
                                type="number" value={rewardPerWorker} onChange={e => setRewardPerWorker(e.target.value)}
                                step="0.001" min="0.001"
                                className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 pl-10 pr-16 py-3 text-sm font-medium text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <span className="text-primary font-bold">⬡</span>
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold">AVAX</div>
                        </div>
                    </div>

                    {/* Required Workers */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required Workers per Task</label>
                        <input
                            type="number" value={requiredWorkers} onChange={e => setRequiredWorkers(e.target.value.replace(/^0+/, '') || '')}
                            min="1"
                            className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 px-4 py-3 text-sm font-medium text-white placeholder-slate-600 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>

                    {/* Min Reputation */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Min Reputation Score</label>
                            <span className="text-xs font-bold text-primary">{minReputation}+</span>
                        </div>
                        <div className="relative h-12 flex items-center">
                            <input
                                type="range" min={0} max={100} value={minReputation}
                                onChange={e => setMinReputation(Number(e.target.value))}
                                className="w-full h-1 appearance-none rounded-full cursor-pointer accent-primary"
                                style={{ background: `linear-gradient(to right, #00f2ff ${minReputation}%, rgba(255,255,255,0.1) ${minReputation}%)` }}
                            />
                            <div className="absolute bottom-0 left-0 text-[10px] text-slate-600">0</div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-slate-600">50</div>
                            <div className="absolute bottom-0 right-0 text-[10px] text-slate-600">100</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={onBack} className="flex items-center gap-1 px-5 py-3 rounded-xl border border-white/12 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={!title || !targetObject}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-blue-400 hover:shadow-neon hover:scale-[1.02] transition-all"
                    >
                        {isBulk ? `Review ${fileCount} Tasks` : 'Review & Deploy'}
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Right: Cost Estimator */}
            <div className="lg:col-span-5">
                <div className="sticky top-24 glass-card rounded-2xl p-6 border-t-4 border-t-purple-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 blur-2xl rounded-full -mr-10 -mt-10" />
                    <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2 relative z-10">
                        <span className="material-symbols-outlined text-purple-400">calculate</span>
                        Real-time Estimator
                    </h3>
                    <div className="space-y-3 mb-5 relative z-10">
                        {[
                            ...(isBulk ? [{ label: 'Images (Tasks)', value: String(fileCount) }] : []),
                            { label: 'Workers / Task', value: String(requiredWorkers) },
                            { label: 'Reward / Worker', value: `${parseFloat(rewardPerWorker || '0').toFixed(3)} AVAX` },
                            { label: 'Subtotal', value: `${totalCost.toFixed(3)} AVAX` },
                        ].map(r => (
                            <div key={r.label} className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">{r.label}</span>
                                <span className="text-white font-mono">{r.value}</span>
                            </div>
                        ))}
                        <div className="h-px bg-white/10 my-1" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-1">
                                Platform Fee (1%)
                                <span className="material-symbols-outlined text-xs text-slate-500" title="1% protocol fee">info</span>
                            </span>
                            <span className="text-purple-400 font-mono">{platformFee.toFixed(3)} AVAX</span>
                        </div>
                    </div>
                    <div className="bg-surface-dark/60 rounded-xl p-4 mb-5 border border-white/5 relative z-10">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-slate-300">Total Cost</span>
                            <span className="text-xl font-bold text-white font-mono">{totalWithFee.toFixed(3)} AVAX</span>
                        </div>
                        <div className="text-right text-xs text-slate-500">~{(totalWithFee * 14).toFixed(1)} USD approx.</div>
                    </div>

                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start gap-2 text-sm relative z-10">
                        <span className="material-symbols-outlined text-amber-400 text-base mt-0.5">info</span>
                        <p className="text-slate-300">Funds are held in escrow and released to labelers after consensus is reached.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Step 3: Review & Fund ─────────────────────────────────────────────────────

interface Step3Props {
    files: File[];
    title: string;
    taskType: string;
    targetObject: string;
    rewardPerWorker: string;
    minReputation: number;
    requiredWorkers: string;
    address: string | undefined;
    isCreating: boolean;
    uploadProgress: string;
    error: string;
    createdTask: CreatedTask | null;
    bulkResults: BulkResults | null;
    onBack: () => void;
    onDeploy: () => void;
}
function Step3Review({ files, title, taskType, targetObject, rewardPerWorker, minReputation, requiredWorkers, address, isCreating, uploadProgress, error, createdTask, bulkResults, onBack, onDeploy }: Step3Props) {
    const isBulk = files.length > 1;
    const imagePreview = files.length === 1 ? URL.createObjectURL(files[0]) : null;
    const taskCount = files.length;
    const workersCount = Number(requiredWorkers) || 1;
    const totalCost = parseFloat(rewardPerWorker || '0') * workersCount * taskCount;
    const platformFee = totalCost * 0.01;
    const totalWithFee = totalCost + platformFee;

    // ── Bulk success screen ──
    if (isBulk && bulkResults) {
        return (
            <motion.div
                key="bulk-success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-10 max-w-2xl mx-auto text-center"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-secondary/30 blur-2xl rounded-full" />
                    <div className="relative w-20 h-20 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{bulkResults.created.length} Tasks Deployed! 🎉</h3>
                    {bulkResults.failed.length > 0 && (
                        <p className="text-amber-400 text-sm">{bulkResults.failed.length} image{bulkResults.failed.length > 1 ? 's' : ''} failed to upload</p>
                    )}
                </div>
                {/* Thumbnail grid */}
                <div className="w-full grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {bulkResults.created.map((t) => (
                        <div key={t.task_id} className="relative rounded-lg overflow-hidden aspect-square border border-secondary/30">
                            <img src={t.original_url} alt={t.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-secondary px-1 font-mono">#{t.task_id}</div>
                        </div>
                    ))}
                    {bulkResults.failed.map((f) => (
                        <div key={f.index} className="relative rounded-lg overflow-hidden aspect-square border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-400" style={{ fontSize: '24px' }}>error</span>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] text-red-400 px-1 truncate">{f.filename}</div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 justify-center w-full mt-4">
                    <Link href="/worker" prefetch={true} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-400 text-black text-sm font-bold hover:shadow-neon transition-all">View as Worker</Link>
                </div>
            </motion.div>
        );
    }

    // ── Single success screen ──
    if (createdTask) {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-lg mx-auto"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-secondary/30 blur-2xl rounded-full" />
                    <div className="relative w-20 h-20 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Task Deployed! 🎉</h3>
                    <p className="text-slate-400">Your labeling task is now live on the Neura network.</p>
                </div>
                <div className="w-full glass-card rounded-2xl p-6 text-left space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-sm">Task ID</span>
                        <span className="text-3xl font-mono font-bold text-primary">#{createdTask.task_id}</span>
                    </div>
                    <div className="relative rounded-xl overflow-hidden bg-surface-dark bg-opacity-20 aspect-video">
                        <img src={createdTask.original_url} alt="task preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background-dark/70 text-[10px] font-semibold text-primary capitalize">
                            {taskType}
                        </div>
                    </div>
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-slate-400">
                        💡 Save your Task ID to retrieve results later.
                    </div>
                </div>
                <div className="flex gap-3 justify-center w-full mt-2">
                    <Link href="/worker" prefetch={true} className="w-full max-w-xs py-3 text-center rounded-xl bg-gradient-to-r from-primary to-blue-400 text-black text-sm font-bold hover:shadow-neon transition-all">
                        View as Worker
                    </Link>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start pb-20"
        >
            {/* Left: Task Overview */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="px-1">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">fact_check</span>
                        Task Overview
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">Review your configuration before deploying to the network.</p>
                </div>

                {/* Overview card */}
                <div className="rounded-3xl border border-[#224749] bg-surface-dark overflow-hidden shadow-2xl">
                    {/* Image banner — single or first bulk image */}
                    {files.length > 0 && (
                        <div className="relative w-full h-48 overflow-hidden">
                            <img
                                src={isBulk ? URL.createObjectURL(files[0]) : imagePreview!}
                                alt="Task image"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1e20] via-transparent to-transparent" />
                            <div className="absolute bottom-4 left-5 flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isBulk ? 'Bulk Campaign' : 'Single Task'}</span>
                                <span className="text-xl font-bold text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px]">{title}</span>
                            </div>
                            <span className="absolute bottom-4 right-5 text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-1 rounded">
                                {isBulk ? `${files.length} tasks` : files[0].name}
                            </span>
                        </div>
                    )}

                    {/* Details grid */}
                    <div className="p-8 grid grid-cols-2 gap-x-10 gap-y-6">
                        {[
                            { icon: 'my_location', label: 'Target Object', value: targetObject || '—' },
                            { icon: 'category', label: 'Task Type', value: taskType },
                            { icon: 'shield_person', label: 'Min Reputation', value: `${minReputation}+` },
                            { icon: 'group', label: 'Total Workers', value: String(taskCount * workersCount) },
                            { icon: 'payments', label: 'Reward / Task', value: `${(parseFloat(rewardPerWorker || '0') * workersCount).toFixed(3)} AVAX` },
                            { icon: 'account_balance_wallet', label: 'Funding Required', value: `${totalWithFee.toFixed(3)} AVAX` },
                        ].map(row => (
                            <div key={row.label} className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary mt-1" style={{ fontSize: '20px' }}>{row.icon}</span>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{row.label}</p>
                                    <p className="text-sm font-semibold text-white mt-0.5 truncate">{row.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info strip */}
                    <div className="px-8 py-5 flex items-start gap-3 text-xs text-slate-400 bg-white/3 border-t border-white/5">
                        <span className="material-symbols-outlined text-amber-500/80" style={{ fontSize: '18px' }}>info</span>
                        <p className="leading-relaxed">
                            A <span className="text-slate-200">1% protocol fee</span> ({platformFee.toFixed(4)} AVAX) is included. Rewards are escrowed and released upon verified consensus.
                        </p>
                    </div>
                </div>

                {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 shadow-lg">❌ {error}</div>}
                {uploadProgress && (
                    <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-sm text-primary flex items-center gap-3">
                        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        {uploadProgress}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onBack} disabled={isCreating} className="flex items-center gap-1 px-5 py-3 rounded-xl border border-white/12 text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all text-sm font-medium">
                        <span className="material-symbols-outlined text-base">arrow_back</span>
                        Back
                    </button>
                </div>
            </div>

            {/* Right: Action Card */}
            <div className="sticky top-24">
                <div className="rounded-3xl p-8 flex flex-col gap-8 relative overflow-hidden"
                    style={{
                        boxShadow: '0 0 40px rgba(0,245,255,0.15)',
                        border: '1px solid rgba(0,245,255,0.2)',
                        background: 'linear-gradient(180deg, rgba(20,30,35,0.9) 0%, rgba(5,15,20,1) 100%)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <div className="flex flex-col gap-2">
                        <span className="text-slate-500 text-[10px] font-bold tracking-[0.3em] uppercase">Final Deployment</span>
                        <h3 className="text-2xl font-bold text-white">Review & Funding</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                            <span className="text-slate-400">Network Fee Est.</span>
                            <span className="text-slate-300 font-mono">~0.002 AVAX</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                            <span className="text-slate-400 text-sm font-medium pb-1">Total Due</span>
                            <div className="text-right">
                                <p className="text-3xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                                    {totalWithFee.toFixed(4)} <span className="text-base text-primary/80">AVAX</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onDeploy}
                        disabled={isCreating || !address}
                        className="relative w-full text-black font-bold text-lg h-16 rounded-2xl flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(0,242,255,0.3)] overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        style={{ background: 'linear-gradient(90deg,#00F5FF,#7C3AED)' }}
                    >
                        {/* Shimmer */}
                        <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                            <span className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-30deg] -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000" />
                        </span>

                        {isCreating ? (
                            <>
                                <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                <span className="animate-pulse">Processing…</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">rocket_launch</span>
                                {isBulk ? `Deploy ${taskCount} Tasks` : 'Confirm & Deploy'}
                            </>
                        )}
                    </button>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            Escrow secured by Avalanche Smart Contracts
                        </div>
                    </div>
                </div>
            </div>
        </motion.div >
    );
}

// ── Results Tab ───────────────────────────────────────────────────────────────

function ResultsTab({ address }: { address: string | undefined }) {
    const [taskIdInput, setTaskIdInput] = useState('');
    const [taskResult, setTaskResult] = useState<TaskResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleQuery = async () => {
        if (!taskIdInput) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(`${BACKEND_URL}/api/company/tasks/${taskIdInput}/results`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTaskResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Task not found');
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white mb-1">Query Task Results</h2>
                <p className="text-slate-400">Enter your Task ID to see real-time worker submissions and consensus data.</p>
            </div>
            <div className="glass-card rounded-2xl p-5">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style={{ fontSize: '18px' }}>search</span>
                        <input
                            type="number" value={taskIdInput} onChange={e => setTaskIdInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleQuery()}
                            placeholder="Task ID (e.g. 1, 2, 3…)"
                            className="w-full rounded-xl bg-[#050B18]/50 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-primary/50 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                    </div>
                    <button
                        onClick={handleQuery}
                        disabled={!taskIdInput || loading}
                        className="px-6 py-3 rounded-xl font-bold text-black disabled:opacity-40 bg-gradient-to-r from-primary to-blue-400 hover:shadow-neon transition-all"
                    >
                        {loading ? '⏳' : 'Query'}
                    </button>
                </div>
                {error && <p className="mt-2 text-sm text-red-400">❌ {error}</p>}
            </div>

            {taskResult && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Task summary */}
                    <div className="glass-card rounded-2xl p-5 space-y-4">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                            {taskResult.task.title}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Target Object', value: taskResult.task.target_object },
                                { label: 'Status', value: taskResult.task.status === 'completed' ? '✅ Completed' : '⏳ In Progress' },
                                { label: 'Workers', value: `${taskResult.task.current_workers}/${taskResult.task.required_workers}` },
                                { label: 'Consensus Tiles', value: taskResult.task.consensus_tiles?.length > 0 ? `[${taskResult.task.consensus_tiles.join(', ')}]` : '—' },
                            ].map(s => (
                                <div key={s.label} className="px-3 py-2.5 rounded-xl bg-white/3 border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</p>
                                    <p className="text-sm font-semibold text-white mt-0.5">{s.value}</p>
                                </div>
                            ))}
                        </div>
                        {taskResult.task.original_url && (
                            <img src={taskResult.task.original_url} alt="task" className="w-full rounded-xl object-cover max-h-48 shadow-lg" />
                        )}
                    </div>

                    {/* Submissions */}
                    <div className="glass-card rounded-2xl p-5 space-y-3">
                        <h4 className="font-bold text-purple-400 flex items-center gap-2">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                            Worker Submissions ({taskResult.submissions.length})
                        </h4>
                        {taskResult.submissions.length === 0 ? (
                            <p className="text-slate-500 text-sm py-4 text-center italic">No submissions yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {taskResult.submissions.map((sub, i) => (
                                    <div key={i} className={`rounded-xl p-3 border ${sub.is_correct === true ? 'bg-green-500/8 border-green-500/25' :
                                        sub.is_correct === false ? 'bg-red-500/8 border-red-500/25' :
                                            'bg-white/3 border-white/8'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-mono text-slate-400">{sub.worker_address.slice(0, 6)}...{sub.worker_address.slice(-4)}</p>
                                            <span className="text-[10px] font-bold uppercase">{sub.is_correct === true ? '✅ Correct' : sub.is_correct === false ? '❌ Wrong' : '⏳ Pending'}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Tiles: [{sub.selected_tiles.join(', ')}]</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CompanyDashboard() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<'create' | 'results'>('create');
    const [step, setStep] = useState(0);

    // Upload state — unified: 1 file = single task, >1 = bulk
    const [files, setFiles] = useState<File[]>([]);
    const [bulkResults, setBulkResults] = useState<BulkResults | null>(null);
    const isBulk = files.length > 1;

    // Form state
    const [taskType, setTaskType] = useState(TASK_TYPES[0]);
    const [title, setTitle] = useState('');
    const [targetObject, setTargetObject] = useState('traffic light');
    const [rewardPerWorker, setRewardPerWorker] = useState(REWARD_PER_WORKER.toString());
    const [minReputation, setMinReputation] = useState<number>(50);
    const [requiredWorkers, setRequiredWorkers] = useState<string>('5');

    // Submission state
    const [isCreating, setIsCreating] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [createdTask, setCreatedTask] = useState<CreatedTask | null>(null);
    const [error, setError] = useState('');

    /** Deploy — auto-detects single vs bulk from files[] */
    const handleDeploy = async () => {
        if (files.length === 0 || !title || !targetObject || !address) return;
        setIsCreating(true); setError('');

        if (isBulk) {
            // ── Bulk path ──
            setUploadProgress(`🚀 Uploading ${files.length} images to IPFS in parallel…`);
            const formData = new FormData();
            files.forEach(f => formData.append('images', f));
            formData.append('title_prefix', title);
            formData.append('target_object', targetObject);
            formData.append('reward_per_worker', rewardPerWorker);
            formData.append('company_wallet', address);
            formData.append('task_type', taskType);
            formData.append('required_workers', String(requiredWorkers));
            formData.append('min_reputation', String(minReputation));
            try {
                const res = await fetch(`${BACKEND_URL}/api/company/tasks/bulk`, { method: 'POST', body: formData });
                if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Bulk upload failed'); }
                const data: BulkResults = await res.json();
                setBulkResults(data); setUploadProgress('');
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'An error occurred');
                setUploadProgress('');
            } finally { setIsCreating(false); }
        } else {
            // ── Single path ──
            const imageFile = files[0];
            setUploadProgress(taskType === 'Image Classification' ? '📸 Uploading image to IPFS...' : '🔪 Processing & uploading to IPFS...');
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('title', title);
            formData.append('target_object', targetObject);
            formData.append('reward_per_worker', rewardPerWorker);
            formData.append('company_wallet', address);
            formData.append('task_type', taskType);
            formData.append('required_workers', String(requiredWorkers));
            formData.append('min_reputation', String(minReputation));
            try {
                const res = await fetch(`${BACKEND_URL}/api/company/tasks`, { method: 'POST', body: formData });
                if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Upload failed'); }
                const data = await res.json();
                setCreatedTask(data); setUploadProgress('');
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : 'An error occurred');
                setUploadProgress('');
            } finally { setIsCreating(false); }
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col overflow-x-hidden relative">
            {/* Cyber grid background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px] mix-blend-screen" />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%230de7f2' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E\")" }}
                />
            </div>

            {/* Navbar */}
            <NavHeader />

            <main className="relative z-10 flex-grow px-6 lg:px-10 py-10 max-w-4xl mx-auto w-full">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Connect Your Wallet</h2>
                        <p className="text-slate-400">Connect to access the Company dashboard and create labeling tasks</p>
                        <ConnectButton />
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-2 mb-8">
                            {(['create', 'results'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); if (tab === 'create' && (createdTask || bulkResults)) { setStep(0); setCreatedTask(null); setBulkResults(null); setFiles([]); } }}
                                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab
                                        ? 'bg-primary/15 border border-primary/50 text-primary'
                                        : 'bg-white/4 border border-white/8 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {tab === 'create' ? '➕ Create Task' : '📊 Query Results'}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'create' && (
                                <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">
                                    {/* Step indicator */}
                                    {(!createdTask && !bulkResults) && <StepIndicator step={step} />}

                                    <AnimatePresence mode="wait">
                                        {step === 0 && (
                                            <Step1Upload
                                                files={files}
                                                setFiles={(f) => { setFiles(f); setCreatedTask(null); setBulkResults(null); setError(''); }}
                                                onNext={() => setStep(1)}
                                            />
                                        )}
                                        {step === 1 && (
                                            <Step2Config
                                                title={title} setTitle={setTitle}
                                                taskType={taskType} setTaskType={setTaskType}
                                                targetObject={targetObject} setTargetObject={setTargetObject}
                                                rewardPerWorker={rewardPerWorker} setRewardPerWorker={setRewardPerWorker}
                                                minReputation={minReputation} setMinReputation={setMinReputation}
                                                requiredWorkers={requiredWorkers} setRequiredWorkers={setRequiredWorkers}
                                                onBack={() => setStep(0)}
                                                onNext={() => setStep(2)}
                                                fileCount={files.length}
                                            />
                                        )}
                                        {step === 2 && (
                                            <Step3Review
                                                files={files}
                                                title={title}
                                                taskType={taskType}
                                                targetObject={targetObject}
                                                rewardPerWorker={rewardPerWorker}
                                                minReputation={minReputation}
                                                requiredWorkers={requiredWorkers}
                                                address={address}
                                                isCreating={isCreating}
                                                uploadProgress={uploadProgress}
                                                error={error}
                                                createdTask={createdTask}
                                                bulkResults={bulkResults}
                                                onBack={() => setStep(1)}
                                                onDeploy={handleDeploy}
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {activeTab === 'results' && (
                                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <ResultsTab address={address} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </main>
        </div>
    );
}
