CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"text_id" uuid NOT NULL,
	"completed_at" timestamp,
	"score" integer,
	"total_questions" integer,
	"words_looked_up" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"words_saved" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_user_id_text_id_unique" UNIQUE("user_id","text_id")
);
--> statement-breakpoint
CREATE TABLE "reading_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"level" "language_level" NOT NULL,
	"topic" varchar(50) NOT NULL,
	"content_fr" text NOT NULL,
	"word_map" jsonb NOT NULL,
	"questions" jsonb NOT NULL,
	"estimated_minutes" integer DEFAULT 3 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reading_texts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_text_id_reading_texts_id_fk" FOREIGN KEY ("text_id") REFERENCES "public"."reading_texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reading_texts_level" ON "reading_texts" USING btree ("level","topic");