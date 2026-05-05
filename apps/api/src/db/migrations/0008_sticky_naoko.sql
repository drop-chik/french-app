CREATE TABLE "drill_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"drill_set_id" uuid NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"last_played_at" timestamp,
	CONSTRAINT "drill_progress_user_id_drill_set_id_unique" UNIQUE("user_id","drill_set_id")
);
--> statement-breakpoint
CREATE TABLE "drill_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"drill_set_id" uuid NOT NULL,
	"type" "exercise_type" NOT NULL,
	"question" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "drill_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title_ru" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"description_ru" text NOT NULL,
	"description_en" text NOT NULL,
	"level" "language_level" NOT NULL,
	"category" varchar(100) NOT NULL,
	"difficulty" integer NOT NULL,
	"question_count" integer NOT NULL,
	"icon" varchar(50) NOT NULL,
	CONSTRAINT "drill_sets_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "drill_progress" ADD CONSTRAINT "drill_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_progress" ADD CONSTRAINT "drill_progress_drill_set_id_drill_sets_id_fk" FOREIGN KEY ("drill_set_id") REFERENCES "public"."drill_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drill_questions" ADD CONSTRAINT "drill_questions_drill_set_id_drill_sets_id_fk" FOREIGN KEY ("drill_set_id") REFERENCES "public"."drill_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_drill_questions_set" ON "drill_questions" USING btree ("drill_set_id");