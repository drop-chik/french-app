// One-off seeder for words-reading-extra.ts only. Used because the full
// seed currently fails on words-B2 due to the partial unique index added
// in 0014_user_custom_words (the onConflict target isn't the partial index).
// onConflictDoNothing without a target works (default = primary key).
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { words } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { wordsReadingExtra } from './words-reading-extra.js';

const { Pool } = pg;

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log(`Seeding ${wordsReadingExtra.length} extra reading vocabulary words...`);
  let added = 0;
  let existed = 0;
  let failed = 0;

  for (const w of wordsReadingExtra) {
    try {
      const result = await db
        .insert(words)
        .values({
          french: w.french,
          translation: w.translation,
          level: w.level,
          category: 'vocabulary',
          partOfSpeech: w.partOfSpeech,
          gender: w.gender ?? null,
        })
        .onConflictDoNothing({ target: words.id });
      if ((result.rowCount ?? 0) > 0) added++;
      else existed++;
    } catch (err) {
      failed++;
      console.error(`  FAIL ${w.french}: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`Done — added ${added}, already existed ${existed}, failed ${failed}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
