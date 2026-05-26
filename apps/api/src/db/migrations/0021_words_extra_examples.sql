-- 0021_words_extra_examples
-- Adds an optional jsonb column to cache 2-3 extra example sentences per word.
-- Populated lazily: the first time someone opens the word details modal and
-- clicks "Show more examples", the API generates them via gpt-4o-mini and
-- writes them back. Cost is amortized — words that are never opened cost $0.
-- Shape: [{fr: string, ru: string, en: string}, ...] — null/empty when not
-- yet generated. Read-only thereafter.

ALTER TABLE words ADD COLUMN IF NOT EXISTS extra_examples JSONB;
