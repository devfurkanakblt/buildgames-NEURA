-- Neura DB Schema (up to date)
-- Run in Supabase Dashboard → SQL Editor

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  title VARCHAR(255) NOT NULL,
  target_object VARCHAR(255) NOT NULL,
  task_type VARCHAR(100) DEFAULT 'Object Detection (Bounding Box)',
  original_image_cid TEXT NOT NULL,
  grid_metadata JSONB DEFAULT '[]',
  grid_cols INTEGER DEFAULT 3,
  grid_rows INTEGER DEFAULT 4,
  reward_per_worker DECIMAL NOT NULL,
  total_reward DECIMAL NOT NULL,
  required_workers INTEGER DEFAULT 5,
  current_workers INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  consensus_tiles INTEGER[],
  consensus_answer VARCHAR(10),           -- 'yes' | 'no' for Image Classification tasks
  created_at TIMESTAMP DEFAULT NOW()
);

-- Submissions table
-- NOTE: signature is optional (not collected from frontend anymore)
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  worker_address VARCHAR(42) NOT NULL,
  selected_tiles INTEGER[],
  classification_answer VARCHAR(10),      -- 'yes' | 'no' for Image Classification tasks
  signature TEXT DEFAULT NULL,
  is_correct BOOLEAN DEFAULT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, worker_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_submissions_task ON submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_worker ON submissions(worker_address);

-- ⚠️  If the DB already exists, run these ALTER statements instead:
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS consensus_answer VARCHAR(10);
-- ALTER TABLE submissions ADD COLUMN IF NOT EXISTS classification_answer VARCHAR(10);
