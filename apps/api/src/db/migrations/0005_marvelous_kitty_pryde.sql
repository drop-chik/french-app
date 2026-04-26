ALTER TYPE "public"."language_level" ADD VALUE 'C1';--> statement-breakpoint
ALTER TYPE "public"."language_level" ADD VALUE 'C2';--> statement-breakpoint
ALTER TABLE "words" ALTER COLUMN "part_of_speech" SET DEFAULT 'noun';--> statement-breakpoint
ALTER TABLE "words" ALTER COLUMN "part_of_speech" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_words_active" ON "words" USING btree ("is_active","level","frequency_rank");--> statement-breakpoint

-- ============================================================
-- Deduplicate words before adding unique constraint.
-- Keeps the row with the earliest createdAt per french value;
-- deletes all later duplicates (carries no progress FK risk
-- because word_progress has ON DELETE CASCADE).
-- ============================================================
DELETE FROM words
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY french ORDER BY created_at ASC) AS rn
    FROM words
  ) ranked
  WHERE rn > 1
);--> statement-breakpoint

ALTER TABLE "words" ADD CONSTRAINT "uq_words_french" UNIQUE("french");
