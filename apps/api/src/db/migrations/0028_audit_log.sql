-- Append-only audit trail for sensitive operations. The point isn't to
-- replace structured logging (we have Pino + Sentry) — it's to give us a
-- queryable historical record of who did what, when, on the user table.
-- Without this, "who changed Anna's role to admin in March?" requires
-- digging through Railway log retention (30 days, no full-text query).

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action. NULL = system (cron, migrations, etc).
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Discriminator: 'admin.user.update' | 'admin.user.reset_progress' |
  -- 'self.account.delete' | 'admin.user.delete' | future ones.
  -- Free-form string so we don't need a migration per new action.
  action VARCHAR(64) NOT NULL,

  -- Subject of the action — usually a user, but the column is just a
  -- UUID so we can repoint at other entities later.
  target_user_id UUID,

  -- Structured payload. For 'admin.user.update' we log before/after for
  -- the changed fields; for 'reset_progress' we log how many rows
  -- were wiped; for 'delete' the actor's IP (when available).
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Look up by target (e.g. "show me everything that ever happened to
-- this user") and by actor (e.g. "everything Anna-the-admin did").
CREATE INDEX IF NOT EXISTS audit_log_target_idx ON audit_log(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx  ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action, created_at DESC);
