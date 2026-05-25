/**
 * Narrow, idempotent seeder for B2 grammar topics + exercises ONLY.
 *
 * The full `index.ts` seed historically chokes on B2 vocabulary (partial unique
 * index on words.french), so grammar-b2 was never reaching prod. This script
 * touches grammar tables only — safe to run any time. Mirrors the upsert
 * pattern from index.ts:seedGrammarTopics / seedGrammarExercises.
 *
 * Usage:
 *   $env:DATABASE_URL = (railway variables --json | ConvertFrom-Json).DATABASE_URL
 *   cd apps/api
 *   npx tsx src/db/seed/seed-grammar-b2-only.ts
 */
import 'dotenv/config';
import { inArray } from 'drizzle-orm';
import { db } from '../index.js';
import { grammarTopics, grammarExercises } from '../schema/index.js';
import { grammarTopicsB2 } from './grammar-b2.js';
import { grammarTopicsB2Extra } from './grammar-b2-extra.js';
import { grammarTopicsB2Extra2 } from './grammar-b2-extra2.js';
import { grammarExercisesB2 } from './grammar-exercises-b2.js';
import { grammarExercisesB2Extra } from './grammar-exercises-b2-extra.js';
import { grammarExercisesB2Extra2 } from './grammar-exercises-b2-extra2.js';

async function main() {
  const allTopics = [...grammarTopicsB2, ...grammarTopicsB2Extra, ...grammarTopicsB2Extra2];
  const allExercises = [...grammarExercisesB2, ...grammarExercisesB2Extra, ...grammarExercisesB2Extra2];

  console.log(`B2 grammar seed: ${allTopics.length} topics, ${allExercises.length} exercises`);

  // ── 1. Upsert topics by slug ──────────────────────────────────────────────
  for (const topic of allTopics) {
    await db
      .insert(grammarTopics)
      .values({
        slug: topic.slug,
        titleRu: topic.titleRu,
        titleEn: topic.titleEn,
        titleFr: topic.titleFr,
        level: 'B2',
        category: topic.category,
        orderNum: topic.orderNum,
        content: topic.content,
        contentEn: topic.contentEn ?? null,
      })
      .onConflictDoUpdate({
        target: grammarTopics.slug,
        set: {
          titleRu: topic.titleRu,
          titleEn: topic.titleEn,
          titleFr: topic.titleFr,
          level: 'B2',
          category: topic.category,
          orderNum: topic.orderNum,
          content: topic.content,
          contentEn: topic.contentEn ?? null,
        },
      });
  }
  console.log(`  topics upserted: ${allTopics.length}`);

  // ── 2. Resolve slug → id for B2 topics we just touched ────────────────────
  const slugs = allTopics.map((t) => t.slug);
  const rows = await db
    .select({ id: grammarTopics.id, slug: grammarTopics.slug })
    .from(grammarTopics)
    .where(inArray(grammarTopics.slug, slugs));
  const slugToId = new Map(rows.map((r) => [r.slug, r.id]));

  // ── 3. Replace exercises for these topics atomically ──────────────────────
  const topicIds = [...slugToId.values()];
  if (topicIds.length > 0) {
    await db.delete(grammarExercises).where(inArray(grammarExercises.topicId, topicIds));
  }

  let inserted = 0;
  for (const ex of allExercises) {
    const topicId = slugToId.get(ex.topicSlug);
    if (!topicId) {
      console.warn(`  WARN: no topic for "${ex.topicSlug}", skipping`);
      continue;
    }
    await db.insert(grammarExercises).values({
      topicId,
      type: ex.type,
      question: ex.question,
      answer: ex.answer,
      explanation: ex.explanation ?? null,
      explanationEn: ex.explanationEn ?? null,
    });
    inserted++;
  }
  console.log(`  exercises inserted: ${inserted}`);
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
