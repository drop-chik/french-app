CREATE TYPE "public"."exercise_type" AS ENUM('fill_blank', 'multiple_choice', 'reorder', 'translate');--> statement-breakpoint
CREATE TYPE "public"."grammar_topic_status" AS ENUM('locked', 'available', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."language_level" AS ENUM('A1', 'A2', 'B1', 'B2');--> statement-breakpoint
CREATE TYPE "public"."word_status" AS ENUM('new', 'learning', 'review', 'mastered');--> statement-breakpoint
CREATE TABLE "conversation_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic" varchar(255) NOT NULL,
	"level" "language_level" NOT NULL,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "grammar_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"type" "exercise_type" NOT NULL,
	"question" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "grammar_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" "grammar_topic_status" DEFAULT 'locked' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "grammar_progress_user_id_topic_id_unique" UNIQUE("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "grammar_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title_ru" varchar(255) NOT NULL,
	"title_fr" varchar(255) NOT NULL,
	"level" "language_level" NOT NULL,
	"category" varchar(100) NOT NULL,
	"order_num" integer NOT NULL,
	"content" jsonb NOT NULL,
	CONSTRAINT "grammar_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "listening_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"level" "language_level" NOT NULL,
	"audio_url" varchar(500) NOT NULL,
	"transcript" text NOT NULL,
	"questions" jsonb NOT NULL,
	"duration_sec" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"score" integer,
	"completed_at" timestamp,
	CONSTRAINT "listening_progress_user_id_exercise_id_unique" UNIQUE("user_id","exercise_id")
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	CONSTRAINT "oauth_accounts_provider_provider_id_unique" UNIQUE("provider","provider_id")
);
--> statement-breakpoint
CREATE TABLE "placement_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"result_level" "language_level" NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255) NOT NULL,
	"level" "language_level" DEFAULT 'A1' NOT NULL,
	"placement_test_done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "word_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"status" "word_status" DEFAULT 'new' NOT NULL,
	"easiness_factor" numeric(4, 2) DEFAULT '2.50' NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"next_review" timestamp DEFAULT now() NOT NULL,
	"last_reviewed" timestamp,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"incorrect_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "word_progress_user_id_word_id_unique" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"french" varchar(255) NOT NULL,
	"translation" varchar(255) NOT NULL,
	"level" "language_level" NOT NULL,
	"category" varchar(100) NOT NULL,
	"example_fr" text,
	"example_ru" text,
	"audio_url" varchar(500),
	"image_url" varchar(500),
	"image_generating" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_sessions" ADD CONSTRAINT "conversation_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_exercises" ADD CONSTRAINT "grammar_exercises_topic_id_grammar_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_progress" ADD CONSTRAINT "grammar_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_progress" ADD CONSTRAINT "grammar_progress_topic_id_grammar_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."grammar_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_progress" ADD CONSTRAINT "listening_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_progress" ADD CONSTRAINT "listening_progress_exercise_id_listening_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."listening_exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_progress" ADD CONSTRAINT "word_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "word_progress" ADD CONSTRAINT "word_progress_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_grammar_topics_level" ON "grammar_topics" USING btree ("level","order_num");--> statement-breakpoint
CREATE INDEX "idx_word_progress_next_review" ON "word_progress" USING btree ("user_id","next_review");--> statement-breakpoint
CREATE INDEX "idx_word_progress_status" ON "word_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_words_level_category" ON "words" USING btree ("level","category");