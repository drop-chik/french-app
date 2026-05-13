// Узкий сид только для reading_texts. Используется когда полный seed
// падает на других таблицах (например, на partial unique index у words).
// Идемпотентен — onConflictDoUpdate по slug.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { readingTexts } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { readingTextsData } from './reading.js';

const { Pool } = pg;

async function main() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  console.log(`Seeding ${readingTextsData.length} reading texts...`);
  for (const rt of readingTextsData) {
    await db
      .insert(readingTexts)
      .values({
        slug: rt.slug,
        title: rt.title,
        level: rt.level,
        topic: rt.topic,
        contentFr: rt.contentFr,
        wordMap: rt.wordMap,
        questions: rt.questions,
        estimatedMinutes: rt.estimatedMinutes,
      })
      .onConflictDoUpdate({
        target: readingTexts.slug,
        set: {
          title: rt.title,
          level: rt.level,
          topic: rt.topic,
          contentFr: rt.contentFr,
          wordMap: rt.wordMap,
          questions: rt.questions,
          estimatedMinutes: rt.estimatedMinutes,
        },
      });
    console.log(`  ${rt.slug}`);
  }

  console.log(`Done — ${readingTextsData.length} reading texts seeded.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
