-- 0015_remove_dismiss
-- The "dismiss / hide forever" feature was added in 0013 and removed after
-- realising it duplicates `mastered` semantics without adding value. SRS
-- canon (Anki/Memrise/Duolingo) doesn't have this concept for a reason.
--
-- Migration steps:
-- 1. For anyone currently dismissed, mark the word as mastered so the user
--    doesn't lose their "don't show me this" decision — mastered already
--    pushes a word out of regular rotation.
-- 2. Drop the index, then the column.

UPDATE word_progress
SET status = 'mastered',
    interval = GREATEST(interval, 365),
    repetitions = GREATEST(repetitions, 10),
    next_review = NOW() + INTERVAL '365 days'
WHERE dismissed_at IS NOT NULL;

DROP INDEX IF EXISTS idx_word_progress_dismissed;
ALTER TABLE word_progress DROP COLUMN IF EXISTS dismissed_at;
