-- Writing mock exam (DELF PE — Production Écrite). A timed attempt over one
-- prompt; on submit it reuses the normal writing pipeline (saveSubmission +
-- generateFeedback 7-dim rubric) and records the composite score for history.
-- Unlike the MCQ mocks there is no server-side auto-finalize (the essay lives
-- client-side until submit) — submission_id is NULL while the attempt is open.
CREATE TABLE IF NOT EXISTS "writing_mock_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level" "language_level" NOT NULL,
	"prompt_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"time_limit_seconds" integer NOT NULL,
	"submission_id" uuid,
	"submitted_at" timestamp,
	"score" integer,
	"max_score" integer
);
--> statement-breakpoint
ALTER TABLE "writing_mock_attempts" ADD CONSTRAINT "writing_mock_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_writing_mock_user_submitted" ON "writing_mock_attempts" USING btree ("user_id","submitted_at");
