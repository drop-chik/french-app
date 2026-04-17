ALTER TABLE "grammar_exercises" ADD COLUMN "explanation_en" text;--> statement-breakpoint
ALTER TABLE "grammar_topics" ADD COLUMN "title_en" varchar(255);--> statement-breakpoint
ALTER TABLE "grammar_topics" ADD COLUMN "content_en" jsonb;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "translation_en" varchar(255);--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "example_en" text;
