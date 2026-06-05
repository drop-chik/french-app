ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ai_credits_used" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ai_credits_reset_at" timestamp DEFAULT now() NOT NULL;
