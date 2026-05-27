-- 0024_performance_indexes
-- Performance pass before public traffic. Three hot paths:
--
--  1. Dictionary search — `lower(french) LIKE %q%` and the same on
--     translation are sequential scans today. With pg_trgm + a GIN index
--     on (french || translation) we get sub-millisecond LIKE'd queries
--     instead of a full table scan per keystroke.
--
--  2. Activity feed — `WHERE user_id IN (followees) ORDER BY created_at
--     DESC` paginates the social timeline. Without (user_id, created_at)
--     composite, Postgres falls back to a heap scan + sort on each load.
--
--  3. Word-progress lookup — the SRS planner repeatedly hits
--     `WHERE user_id = $1 AND next_review <= NOW()`. A composite on
--     (user_id, next_review) lets it pick due cards in index order.
--
-- pg_trgm extension is part of contrib and is available on Railway
-- Postgres by default. CREATE IF NOT EXISTS is safe to re-apply.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Dictionary search: trigram GIN on lower(french) — supports
-- `lower(french) LIKE '%foo%'` cheaply. Lower-case version because the
-- browse query already lowercases the input.
CREATE INDEX IF NOT EXISTS idx_words_french_trgm
  ON words USING gin (lower(french) gin_trgm_ops)
  WHERE is_active = true;

-- Same for translation — multilingual search lookup. Less hot than french
-- but cheap to add given the same trigram cost model.
CREATE INDEX IF NOT EXISTS idx_words_translation_trgm
  ON words USING gin (lower(translation) gin_trgm_ops)
  WHERE is_active = true;

-- 2. Activity feed: composite for paginated social timeline. Used by
-- /social/feed which fetches "events from people I follow" ordered by
-- recent. DESC matches the query's ORDER BY direction.
CREATE INDEX IF NOT EXISTS idx_activity_events_user_created
  ON activity_events (user_id, created_at DESC);

-- 3. Word progress due-review lookup. SRS planner runs this on every
-- /words/session call, gets larger as users accumulate cards.
CREATE INDEX IF NOT EXISTS idx_word_progress_due
  ON word_progress (user_id, next_review)
  WHERE status IN ('learning', 'review');

-- BONUS: reading_progress lookup by user (profile/home queries iterate
-- everyone's reading completed). Cheap, no impact on writes.
CREATE INDEX IF NOT EXISTS idx_reading_progress_user
  ON reading_progress (user_id, completed_at DESC);
