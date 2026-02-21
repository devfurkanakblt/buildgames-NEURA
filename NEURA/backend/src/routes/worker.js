import express from 'express';
import supabase from '../database/db.js';
import { getIpfsUrl } from '../services/pinata.js';
import { calculateConsensus, calculateClassificationConsensus } from '../services/consensus.js';
import { distributeRewards } from '../services/blockchain.js';

const router = express.Router();

const REQUIRED_WORKERS = 5;

// GET /api/worker/tasks?worker_address=0x...  (address is optional — shows public task feed)
router.get('/tasks', async (req, res) => {
    try {
        const { worker_address } = req.query;
        if (!supabase) return res.json({ tasks: [] });

        // Find tasks already submitted by this worker (skip if no address provided)
        let submittedIds = [];
        if (worker_address) {
            const { data: submitted } = await supabase
                .from('submissions')
                .select('task_id')
                .eq('worker_address', worker_address.toLowerCase());
            submittedIds = (submitted ?? []).map(s => s.task_id);
        }

        // Fetch active tasks that still have capacity
        let query = supabase
            .from('tasks')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (submittedIds.length > 0) {
            query = query.not('id', 'in', `(${submittedIds.join(',')})`);
        }

        const { data: tasks, error } = await query;
        if (error) throw new Error(error.message);

        const result = (tasks ?? []).map(t => ({
            id: t.id,
            title: t.title,
            target_object: t.target_object,
            task_type: t.task_type || 'Object Detection (Bounding Box)',
            original_url: getIpfsUrl(t.original_image_cid),
            reward_per_worker: t.reward_per_worker,
            required_workers: t.required_workers ?? REQUIRED_WORKERS,
            current_workers: t.current_workers ?? 0,
            workers_remaining: (t.required_workers ?? REQUIRED_WORKERS) - (t.current_workers ?? 0),
            status: t.status ?? 'active',
            cols: t.grid_cols ?? 3,
            rows: t.grid_rows ?? 4,
        }));

        // Optionally include worker stats if address provided
        let stats = null;
        if (worker_address) {
            const { data: workerSubs } = await supabase
                .from('submissions')
                .select('is_correct, task_id')
                .eq('worker_address', worker_address.toLowerCase());

            const completed = (workerSubs ?? []).length;
            const correct = (workerSubs ?? []).filter(s => s.is_correct).length;

            stats = {
                tasksCompleted: completed,
                totalEarned: '0',   // Earnings tracked on-chain, not in DB
                reputation: completed > 0 ? Math.round((correct / completed) * 100) : 50,
            };
        }

        res.json({ tasks: result, ...(stats ? { stats } : {}) });
    } catch (err) {
        console.error('Get worker tasks error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/worker/submit
 *
 * For Object Detection (BBox):
 *   Body: { task_id, worker_address, selected_tiles: number[] }
 *
 * For Image Classification:
 *   Body: { task_id, worker_address, classification_answer: 'yes' | 'no' }
 */
router.post('/submit', async (req, res) => {
    try {
        const { task_id, worker_address, selected_tiles, classification_answer } = req.body;

        if (!task_id || !worker_address)
            return res.status(400).json({ error: 'Missing required fields: task_id, worker_address' });

        if (!supabase) return res.status(503).json({ error: 'DB not available' });

        // Verify task exists and is active
        const { data: task, error: taskErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .eq('status', 'active')
            .single();

        if (taskErr || !task) return res.status(404).json({ error: 'Task not found or no longer active' });

        const isClassification = task.task_type === 'Image Classification';

        // Validate payload based on task type
        if (isClassification) {
            if (!classification_answer || !['yes', 'no'].includes(classification_answer))
                return res.status(400).json({ error: 'classification_answer must be "yes" or "no"' });
        } else {
            if (!Array.isArray(selected_tiles) || selected_tiles.length === 0)
                return res.status(400).json({ error: 'selected_tiles must be a non-empty array of tile indices' });
        }

        // Prevent duplicate submissions
        const { data: existing } = await supabase
            .from('submissions')
            .select('id')
            .eq('task_id', task_id)
            .eq('worker_address', worker_address.toLowerCase())
            .maybeSingle();

        if (existing) return res.status(409).json({ error: 'You have already submitted for this task' });

        // Record the submission
        const insertPayload = {
            task_id,
            worker_address: worker_address.toLowerCase(),
            ...(isClassification
                ? { classification_answer, selected_tiles: [] }
                : { selected_tiles }),
        };
        await supabase.from('submissions').insert(insertPayload);

        // Increment worker count
        const requiredWorkers = task.required_workers ?? REQUIRED_WORKERS;
        const newCount = (task.current_workers ?? 0) + 1;
        await supabase.from('tasks').update({ current_workers: newCount }).eq('id', task_id);

        const workers_remaining = requiredWorkers - newCount;
        const consensus_triggered = newCount >= requiredWorkers;

        if (consensus_triggered) {
            triggerConsensus(task_id, task.task_type, task.reward_per_worker).catch(e =>
                console.error('Consensus background error:', e.message)
            );
        }

        res.json({ success: true, workers_remaining, consensus_triggered });
    } catch (err) {
        console.error('Submit error:', err);
        res.status(500).json({ error: err.message });
    }
});

async function triggerConsensus(taskId, taskType, rewardPerWorker) {
    console.log(`\n🧮 Consensus triggered for task ${taskId} (type: ${taskType})...`);

    const isClassification = taskType === 'Image Classification';

    const { data: subs } = await supabase
        .from('submissions')
        .select('worker_address, selected_tiles, classification_answer')
        .eq('task_id', taskId);

    let correctWorkers = [];
    let dbUpdate = {};

    if (isClassification) {
        const { consensusAnswer, correctWorkers: winners } = calculateClassificationConsensus(subs ?? []);
        console.log(`✅ Consensus answer: ${consensusAnswer}, Correct workers: ${winners.length}`);
        correctWorkers = winners;
        dbUpdate = { consensus_answer: consensusAnswer, status: 'completed' };
    } else {
        const { consensusTiles, correctWorkers: winners } = calculateConsensus(subs ?? []);
        console.log(`✅ Consensus tiles: [${consensusTiles}], Correct workers: ${winners.length}`);
        correctWorkers = winners;
        dbUpdate = { consensus_tiles: consensusTiles, status: 'completed' };
    }

    // Mark submissions as correct/incorrect
    for (const sub of subs ?? []) {
        const isCorrect = correctWorkers.includes(sub.worker_address);
        await supabase.from('submissions')
            .update({ is_correct: isCorrect })
            .eq('task_id', taskId)
            .eq('worker_address', sub.worker_address);
    }

    // Mark task completed
    await supabase.from('tasks').update(dbUpdate).eq('id', taskId);

    // Distribute on-chain rewards to correct workers
    if (correctWorkers.length > 0) {
        try {
            const txHash = await distributeRewards(taskId, correctWorkers, rewardPerWorker);
            console.log(`💰 Rewards distributed: ${txHash}`);
        } catch (e) {
            console.error('Reward distribution failed:', e.message);
        }
    }

    console.log(`✅ Task ${taskId} finalized!\n`);
}

export default router;
