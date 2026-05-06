ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "streak_repair_used_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "streak_repair_saved_value" integer DEFAULT 0;
