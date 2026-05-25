-- 0020_words_ipa
-- Adds an optional IPA (International Phonetic Alphabet) transcription per
-- word. Crucial for French because spelling diverges from pronunciation more
-- aggressively than in most languages. Populated by a one-off batch script
-- against OpenAI (gpt-4o-mini), re-runnable for new entries. Read on every
-- word fetch (no index needed).

ALTER TABLE words ADD COLUMN IF NOT EXISTS ipa VARCHAR(30);
