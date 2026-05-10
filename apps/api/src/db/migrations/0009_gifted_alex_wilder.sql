CREATE TYPE "public"."submission_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."writing_type" AS ENUM('postcard', 'message', 'letter_informal', 'letter_formal', 'email', 'description', 'blog_article', 'essay', 'narrative');--> statement-breakpoint
CREATE TABLE "writing_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"scores" jsonb NOT NULL,
	"corrections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb NOT NULL,
	"suggestions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"overall_comment" text NOT NULL,
	"strengths" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"improvements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writing_feedback_submission_id_unique" UNIQUE("submission_id")
);
--> statement-breakpoint
CREATE TABLE "writing_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"avg_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"avg_word_count" numeric(6, 1) DEFAULT '0' NOT NULL,
	"area_scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_writing_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "writing_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "writing_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title_ru" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"level" "language_level" NOT NULL,
	"writing_type" "writing_type" NOT NULL,
	"prompt_ru" text NOT NULL,
	"prompt_en" text NOT NULL,
	"prompt_fr" text NOT NULL,
	"tips_ru" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tips_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"min_words" integer NOT NULL,
	"max_words" integer NOT NULL,
	"required_elements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "writing_prompts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "writing_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	"content" text NOT NULL,
	"word_count" integer DEFAULT 0 NOT NULL,
	"level" "language_level" NOT NULL,
	"status" "submission_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "writing_feedback" ADD CONSTRAINT "writing_feedback_submission_id_writing_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."writing_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_progress" ADD CONSTRAINT "writing_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_submissions" ADD CONSTRAINT "writing_submissions_prompt_id_writing_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."writing_prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_writing_prompts_level" ON "writing_prompts" USING btree ("level","writing_type");--> statement-breakpoint
CREATE INDEX "idx_writing_submissions_user" ON "writing_submissions" USING btree ("user_id","created_at");