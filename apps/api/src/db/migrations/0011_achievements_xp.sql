-- Add XP counter to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp" integer DEFAULT 0 NOT NULL;

-- Per-user achievements (one row per unlock)
CREATE TABLE IF NOT EXISTS "user_achievements" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "achievement_id" varchar(60) NOT NULL,
  "unlocked_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_achievements_pk" UNIQUE ("user_id", "achievement_id")
);

CREATE INDEX IF NOT EXISTS "idx_user_achievements_user" ON "user_achievements" ("user_id");
