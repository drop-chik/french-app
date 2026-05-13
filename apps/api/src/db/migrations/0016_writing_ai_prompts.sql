-- 0016_writing_ai_prompts
-- AI-generated writing prompts. Each is owned by a single user (created_by_user_id
-- = NOT NULL), unlike the curated seed-shipped prompts where the column is NULL.
-- The is_ai_generated flag is redundant with the FK but makes filtering and
-- analytics queries readable ("WHERE is_ai_generated = true").

ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE writing_prompts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT now();

-- The original slug uniqueness still applies. AI-generated slugs use a
-- per-user prefix like "ai-<userid>-<random>" so collisions are unlikely.

CREATE INDEX IF NOT EXISTS idx_writing_prompts_owner
  ON writing_prompts(created_by_user_id, created_at DESC)
  WHERE created_by_user_id IS NOT NULL;
