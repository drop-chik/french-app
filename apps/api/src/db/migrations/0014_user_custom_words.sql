-- 0014_user_custom_words
-- Words created by individual users — they go into the same `words` table
-- but are scoped to their owner via created_by_user_id. NULL = global word
-- (the default content the seed ships). All queries that list words now
-- filter `created_by_user_id IS NULL OR created_by_user_id = $current_user`.

ALTER TABLE words ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- The original unique constraint was on (french) — that breaks when a user
-- creates a word that already exists in the global set. Replace it with a
-- partial unique index that only enforces uniqueness for GLOBAL words.
-- Custom user words can shadow / duplicate a French entry without conflict.
DO $$ BEGIN
  ALTER TABLE words DROP CONSTRAINT IF EXISTS uq_words_french;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_words_french_global ON words(french) WHERE created_by_user_id IS NULL;

-- Filter index — most queries either want global only or user's own.
CREATE INDEX IF NOT EXISTS idx_words_created_by ON words(created_by_user_id) WHERE created_by_user_id IS NOT NULL;
