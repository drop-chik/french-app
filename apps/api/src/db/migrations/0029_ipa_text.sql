-- Extend words.ipa to TEXT — the IPA column was varchar(30), which is
-- enough for single-word IPAs (most clock in under 15 chars) but truncates
-- multi-word entries like "rendez-vous médical" → /ʁɑ̃.de.vu me.di.kal/
-- (24 chars before strip, ~30+ after the regenerated prompt). 180 rows
-- were skipped during the step 5 regeneration because of this limit.
--
-- TEXT has no length limit. The IPA field is read once per word view, so
-- the storage trade-off is negligible — no index, ~3900 rows.

ALTER TABLE words ALTER COLUMN ipa TYPE text;
