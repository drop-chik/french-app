-- 0025_email_verification
-- Adds email-verification fields to users + a separate token table for the
-- "confirm your email" flow. Mirrors the password-reset design (0023):
-- raw token in the URL we email, sha256 hash in DB so a leak doesn't let
-- an attacker confirm arbitrary accounts.
--
-- Tokens expire in 7 days (longer than password-reset's 1 hour — users
-- often delay clicking confirm). On verify, we mark used_at AND set
-- users.email_verified_at, then optionally cascade-delete other tokens
-- for the same user.

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   VARCHAR(255) NOT NULL,
  expires_at   TIMESTAMP NOT NULL,
  used_at      TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verification_tokens_hash
  ON email_verification_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user
  ON email_verification_tokens (user_id, used_at);
