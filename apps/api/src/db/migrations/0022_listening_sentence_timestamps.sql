-- 0022_listening_sentence_timestamps
-- Adds an optional jsonb column to listening_exercises that stores precise
-- per-sentence start times (seconds, float). Populated by a one-off batch
-- script that runs each existing audio_data through Whisper API with
-- word-level timestamps, then aligns word timings back to the transcript's
-- sentence boundaries.
--
-- Shape: [0.0, 4.32, 9.15, 13.4, ...] — one float per sentence, monotonic.
-- The frontend prefers this array when present and falls back to its old
-- word-weighted estimate otherwise. NULL = legacy exercise, still works.

ALTER TABLE listening_exercises
  ADD COLUMN IF NOT EXISTS sentence_timestamps JSONB;
