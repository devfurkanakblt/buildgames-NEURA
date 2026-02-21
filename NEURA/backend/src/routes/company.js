import express from 'express';
import multer from 'multer';
import supabase from '../database/db.js';
import { processAndUploadImage, uploadOriginalOnly } from '../services/imageProcessor.js';
import { getIpfsUrl } from '../services/pinata.js';

const router = express.Router();

const BULK_LIMIT = 100;

/** Pick the right processor based on task type */
function uploadImage(buffer, baseName, taskType) {
    return taskType === 'Image Classification'
        ? uploadOriginalOnly(buffer, baseName)
        : processAndUploadImage(buffer, baseName);
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images allowed'));
        cb(null, true);
    },
});

// ── POST /api/company/tasks  (single image) ────────────────────────────────
router.post('/tasks', upload.single('image'), async (req, res) => {
    try {
        const {
            title,
            target_object,
            reward_per_worker,
            company_wallet,
            task_type = 'Object Detection (Bounding Box)',
            required_workers = 5,
        } = req.body;

        if (!req.file) return res.status(400).json({ error: 'Image is required' });
        if (!title || !target_object || !reward_per_worker || !company_wallet)
            return res.status(400).json({ error: 'Missing required fields' });

        const baseName = title.replace(/\s+/g, '-').toLowerCase();
        const { originalCid, cols, rows } = await uploadImage(req.file.buffer, baseName, task_type);

        const originalUrl = getIpfsUrl(originalCid);
        const requiredWorkersInt = parseInt(required_workers, 10) || 5;
        const rewardPerWorkerFloat = parseFloat(reward_per_worker);
        const totalReward = rewardPerWorkerFloat * requiredWorkersInt;

        if (!supabase) {
            return res.json({ success: true, db_saved: false, task_id: null, original_url: originalUrl, cols, rows });
        }

        const { data: company, error: companyErr } = await supabase
            .from('companies')
            .upsert({ wallet_address: company_wallet.toLowerCase() }, { onConflict: 'wallet_address' })
            .select('id')
            .single();
        if (companyErr) throw new Error(companyErr.message);

        const { data: task, error: taskErr } = await supabase
            .from('tasks')
            .insert({
                company_id: company.id,
                title,
                target_object,
                task_type,
                original_image_cid: originalCid,
                grid_cols: cols,
                grid_rows: rows,
                grid_metadata: [],
                required_workers: requiredWorkersInt,
                reward_per_worker: rewardPerWorkerFloat,
                total_reward: totalReward,
                status: 'active',
                current_workers: 0,
            })
            .select('id')
            .single();
        if (taskErr) throw new Error(taskErr.message);

        res.json({ success: true, task_id: task.id, original_url: originalUrl, cols, rows });
    } catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/company/tasks/bulk  (up to 100 images, shared config) ────────
router.post('/tasks/bulk', upload.array('images', BULK_LIMIT), async (req, res) => {
    try {
        const {
            title_prefix,
            target_object,
            reward_per_worker,
            company_wallet,
            task_type = 'Object Detection (Bounding Box)',
            required_workers = 5,
        } = req.body;

        const files = req.files;
        if (!files || files.length === 0)
            return res.status(400).json({ error: 'At least one image is required' });
        if (!title_prefix || !target_object || !reward_per_worker || !company_wallet)
            return res.status(400).json({ error: 'Missing required fields' });

        const requiredWorkersInt = parseInt(required_workers, 10) || 5;
        const rewardPerWorkerFloat = parseFloat(reward_per_worker);
        const totalReward = rewardPerWorkerFloat * requiredWorkersInt;

        // 1. Upsert company
        let companyId = null;
        if (supabase) {
            const { data: company, error: companyErr } = await supabase
                .from('companies')
                .upsert({ wallet_address: company_wallet.toLowerCase() }, { onConflict: 'wallet_address' })
                .select('id')
                .single();
            if (companyErr) throw new Error(companyErr.message);
            companyId = company.id;
        }

        // 2. Upload all images in parallel (partial failure OK)
        const uploadResults = await Promise.allSettled(
            files.map(async (file, idx) => {
                const taskTitle = `${title_prefix} #${idx + 1}`;
                const baseName = `${title_prefix.replace(/\s+/g, '-').toLowerCase()}-${idx + 1}`;
                const { originalCid, cols, rows } = await uploadImage(file.buffer, baseName, task_type);
                return { idx, taskTitle, originalCid, cols, rows, filename: file.originalname };
            })
        );

        // 3. Separate successes and failures
        const succeeded = uploadResults
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        const failed = uploadResults
            .filter(r => r.status === 'rejected')
            .map((r, i) => ({
                index: i,
                filename: files[i]?.originalname ?? `file-${i}`,
                error: r.reason?.message ?? 'Unknown error',
            }));

        // 4. Batch DB insert for all successes
        let createdTasks = [];
        if (supabase && succeeded.length > 0) {
            const rows = succeeded.map(s => ({
                company_id: companyId,
                title: s.taskTitle,
                target_object,
                task_type,
                original_image_cid: s.originalCid,
                grid_cols: s.cols,
                grid_rows: s.rows,
                grid_metadata: [],
                required_workers: requiredWorkersInt,
                reward_per_worker: rewardPerWorkerFloat,
                total_reward: totalReward,
                status: 'active',
                current_workers: 0,
            }));

            const { data, error: insertErr } = await supabase
                .from('tasks')
                .insert(rows)
                .select('id, title');

            if (insertErr) throw new Error(insertErr.message);

            createdTasks = (data ?? []).map((t, i) => ({
                task_id: t.id,
                title: t.title,
                original_url: getIpfsUrl(succeeded[i].originalCid),
                cols: succeeded[i].cols,
                rows: succeeded[i].rows,
            }));
        } else if (!supabase) {
            // No DB: return upload results only
            createdTasks = succeeded.map(s => ({
                task_id: null,
                title: s.taskTitle,
                original_url: getIpfsUrl(s.originalCid),
                cols: s.cols,
                rows: s.rows,
            }));
        }

        res.json({
            success: true,
            created: createdTasks,
            failed,
            summary: `${createdTasks.length} created, ${failed.length} failed`,
        });
    } catch (err) {
        console.error('Bulk create error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/company/tasks?wallet=0x...  ──────────────────────────────────
router.get('/tasks', async (req, res) => {
    try {
        const { wallet } = req.query;
        if (!wallet) return res.status(400).json({ error: 'wallet required' });
        if (!supabase) return res.json({ tasks: [] });

        const { data, error } = await supabase
            .from('tasks')
            .select('*, companies!inner(wallet_address), submissions(count)')
            .eq('companies.wallet_address', wallet.toLowerCase())
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);

        const tasks = (data ?? []).map(t => ({
            ...t,
            original_url: getIpfsUrl(t.original_image_cid),
        }));

        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/company/tasks/:id/results  ──────────────────────────────────
router.get('/tasks/:id/results', async (req, res) => {
    try {
        if (!supabase) return res.status(503).json({ error: 'DB not available' });

        const { data: task, error: taskErr } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (taskErr) return res.status(404).json({ error: 'Task not found' });

        const { data: submissions } = await supabase
            .from('submissions')
            .select('worker_address, selected_tiles, classification_answer, is_correct, submitted_at')
            .eq('task_id', req.params.id);

        res.json({
            task: { ...task, original_url: getIpfsUrl(task.original_image_cid) },
            submissions: submissions ?? [],
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
