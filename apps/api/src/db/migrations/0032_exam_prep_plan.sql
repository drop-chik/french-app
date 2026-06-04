ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exam_date" timestamp;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exam_type" varchar(10);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "exam_target_level" "language_level";
