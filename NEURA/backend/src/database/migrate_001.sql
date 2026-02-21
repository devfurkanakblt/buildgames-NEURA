-- Migration: Add missing columns for Stitch redesign
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add grid_cols and grid_rows to tasks table
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS grid_cols INTEGER DEFAULT 3,
    ADD COLUMN IF NOT EXISTS grid_rows INTEGER DEFAULT 4,
    ADD COLUMN IF NOT EXISTS task_type VARCHAR(100) DEFAULT 'Object Detection (Bounding Box)';

-- 2. Make signature optional in submissions (we no longer collect it from frontend)
ALTER TABLE submissions
    ALTER COLUMN signature DROP NOT NULL,
    ALTER COLUMN signature SET DEFAULT NULL;

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name IN ('tasks', 'submissions')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
