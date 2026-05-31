-- Link drill sets to grammar topics. Optional FK: a drill may stand
-- alone (a vocabulary speed-round has no grammar theory to read), but
-- when it does belong to a grammar topic, the UI shows a "Read the
-- theory" link from the drill detail screen.
ALTER TABLE drill_sets
  ADD COLUMN grammar_topic_slug VARCHAR(100);

-- No FK constraint to grammar_topics(slug) — slug is enforced unique
-- there but a drill_set with a stale/typo slug is recoverable by a
-- backfill script. Hard FK would block migrations on minor mismatches.

CREATE INDEX idx_drill_sets_grammar_topic ON drill_sets(grammar_topic_slug);
