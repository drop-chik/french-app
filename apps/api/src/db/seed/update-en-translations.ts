/**
 * Скрипт обновляет translation_en и example_en для уже существующих слов в БД.
 * Запускать: npx tsx src/db/seed/update-en-translations.ts
 */
import 'dotenv/config';
import { db } from '../index.js';
import { words } from '../schema/index.js';
import { eq } from 'drizzle-orm';
import { wordsA1 } from './words-a1.js';
import { wordsA1Extra } from './words-a1-extra.js';

async function updateEnTranslations() {
  const allWords = [...wordsA1, ...wordsA1Extra];
  let updated = 0;
  let skipped = 0;

  console.log(`Updating EN translations for ${allWords.length} words...`);

  for (const w of allWords) {
    const en = (w as any).translationEn;
    const exEn = (w as any).exampleEn;
    if (!en) { skipped++; continue; }

    const result = await db
      .update(words)
      .set({ translationEn: en, exampleEn: exEn ?? null })
      .where(eq(words.french, w.french));

    updated++;
    if (updated % 50 === 0) console.log(`  Updated: ${updated}/${allWords.length}`);
  }

  console.log(`Done! Updated: ${updated}, Skipped (no EN): ${skipped}`);
  process.exit(0);
}

updateEnTranslations().catch((err) => {
  console.error(err);
  process.exit(1);
});
