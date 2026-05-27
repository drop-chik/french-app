-- 0026_weekly_digest
-- Per-user timestamp of the last weekly-digest email we successfully sent.
-- Used by scripts/weekly-digest.ts to skip users we already emailed in the
-- current week (idempotency — the cron may overlap a long-running send).
--
-- Also a digest_enabled flag so users can opt out from profile settings
-- (defaulting ON; "no email at all" is unverified-account behaviour).

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN DEFAULT TRUE NOT NULL;
