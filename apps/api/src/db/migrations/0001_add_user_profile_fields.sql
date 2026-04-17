ALTER TABLE "users" ADD COLUMN "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ui_language" varchar(10) DEFAULT 'ru' NOT NULL;
