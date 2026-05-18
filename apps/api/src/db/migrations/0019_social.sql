-- 0019_social
-- Social layer: a unique @handle per user, an asymmetric follow graph
-- (Duolingo-style — no approval), an activity-feed event log, and reactions.

-- 1. Unique @tag for every user. Add nullable, backfill deterministically
--    from the first name-word slug + 4 hex of the user id (collision-proof
--    in practice), then enforce NOT NULL + UNIQUE.
ALTER TABLE users ADD COLUMN IF NOT EXISTS tag VARCHAR(30);

UPDATE users
SET tag = lower(regexp_replace(coalesce(nullif(split_part(name, ' ', 1), ''), 'user'), '[^a-zA-Z0-9]', '', 'g'))
          || '-' || substr(md5(id::text), 1, 4)
WHERE tag IS NULL;

-- A name that slugified to empty leaves a leading "-xxxx" — prefix 'user'.
UPDATE users SET tag = 'user' || tag WHERE tag LIKE '-%';

ALTER TABLE users ALTER COLUMN tag SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_tag_uq ON users(tag);

-- 2. Follow graph: follower_id follows followee_id. Asymmetric, no approval.
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON follows(followee_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);

-- 3. Activity-feed events. dedupe_key + the partial unique index make
--    milestone emits (streak/level/achievement) idempotent.
CREATE TABLE IF NOT EXISTS activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type varchar(30) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  dedupe_key varchar(80),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_events(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_dedupe
  ON activity_events(user_id, type, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- 4. Reactions (👏) on feed events. One per (event, user).
CREATE TABLE IF NOT EXISTS activity_reactions (
  event_id uuid NOT NULL REFERENCES activity_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reactions_event ON activity_reactions(event_id);
