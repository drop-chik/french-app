-- 0023_password_reset_tokens
-- One-time tokens for the "forgot password" email flow. We store only the
-- bcrypt hash of the token — the raw value lives in the URL we email the
-- user and nowhere else. A DB leak therefore can't be used to reset
-- arbitrary accounts (an attacker would need to brute-force each bcrypt).
--
-- Tokens expire 1 hour after creation. Once consumed (used_at IS NOT NULL)
-- they cannot be reused. We keep used rows around for a few days for audit
-- purposes; a periodic cleanup is good-to-have but not required for safety.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  used_at      TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Lookup-by-hash index for the verify path. Hash is unique by construction
-- (random 32 bytes hex), so make the index unique to be defensive.
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_hash
  ON password_reset_tokens (token_hash);

-- For invalidating all active tokens when a user changes their password
-- from a logged-in session, or when we rotate them on attack.
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user
  ON password_reset_tokens (user_id, used_at);
