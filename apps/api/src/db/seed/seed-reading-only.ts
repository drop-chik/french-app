// Узкий сид для reading_texts + writing_prompts. Используется когда полный
// seed падает на других таблицах (например, на partial unique index у words).
// Идемпотентен — onConflictDoUpdate по slug.
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { readingTexts, writingPrompts } from '../schema/index.js';
import * as schema from '../schema/index.js';
import { readingTextsData } from './reading.js';
import { writingPromptsData } from './writing-prompts.js';

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
  }
  console.log(`  ${readingTextsData.length} reading texts ok.`);

  console.log(`Seeding ${writingPromptsData.length} writing prompts...`);
  for (const p of writingPromptsData) {
    await db
      .insert(writingPrompts)
      .values({
        slug: p.slug,
        titleRu: p.titleRu,
        titleEn: p.titleEn,
        level: p.level,
        writingType: p.writingType,
        promptFr: p.promptFr,
        promptRu: p.promptRu,
        promptEn: p.promptEn,
        tipsRu: p.tipsRu,
        tipsEn: p.tipsEn,
        minWords: p.minWords,
        maxWords: p.maxWords,
        requiredElements: p.requiredElements,
      })
      .onConflictDoUpdate({
        target: writingPrompts.slug,
        set: {
          titleRu: p.titleRu,
          titleEn: p.titleEn,
          promptFr: p.promptFr,
          promptRu: p.promptRu,
          promptEn: p.promptEn,
          tipsRu: p.tipsRu,
          tipsEn: p.tipsEn,
          minWords: p.minWords,
          maxWords: p.maxWords,
        },
      });
  }
  console.log(`  ${writingPromptsData.length} writing prompts ok.`);

  console.log('Done.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
