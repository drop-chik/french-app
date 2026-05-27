-- Track failed login attempts per email so we can lock accounts even when
-- the brute-force is distributed across many IPs (rate-limit on /auth/login
-- is per-IP; distributed attacks slip past). On 5 failures within the
-- LOCKOUT_WINDOW the account is locked for LOCKOUT_DURATION_MS; success
-- clears the counter. Counters are also auto-stale after the window so
-- this table never grows unboundedly.

ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP;

-- Partial index — only rows actively being attacked are interesting.
CREATE INDEX IF NOT EXISTS users_lockout_until_idx
  ON users(lockout_until)
  WHERE lockout_until IS NOT NULL;
