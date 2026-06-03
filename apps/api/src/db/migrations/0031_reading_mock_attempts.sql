CREATE TABLE IF NOT EXISTS "reading_mock_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level" "language_level" NOT NULL,
	"text_ids" jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp,
	"time_limit_seconds" integer DEFAULT 2700 NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" integer,
	"max_score" integer
);
--> statement-breakpoint
ALTER TABLE "reading_mock_attempts" ADD CONSTRAINT "reading_mock_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reading_mock_user_finalized" ON "reading_mock_attempts" USING btree ("user_id","finalized_at");
