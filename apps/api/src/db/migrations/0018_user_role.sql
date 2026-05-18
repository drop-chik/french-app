-- 0018_user_role
-- Adds a coarse role flag to gate the admin panel. 'user' is the default
-- for everyone; 'admin' unlocks /admin (UI) and the /admin API group.
-- A partial index keeps the common role='user' rows out of the index —
-- only the handful of admins are indexed.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role <> 'user';
