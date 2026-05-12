-- 0013_session_limits_and_dismiss
-- Per-user session size limits + a way to permanently dismiss a word.

-- Per-user session size limits. Default 10 new + 20 due (research-backed
-- balance for daily SRS — Anki and Memrise default to similar numbers).
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_new_words_limit INTEGER NOT NULL DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_due_words_limit INTEGER NOT NULL DEFAULT 20;

-- Dismissed words — user explicitly said "I already know this, never show
-- it again". Filtered out of getStudySession but still visible in Dictionary
-- (with a flag) so the user can un-dismiss later.
ALTER TABLE word_progress ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_word_progress_dismissed ON word_progress(user_id, dismissed_at) WHERE dismissed_at IS NOT NULL;
