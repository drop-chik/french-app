import 'dotenv/config';
import { db } from '../index.js';
import { listeningExercises, grammarExercises, grammarTopics } from '../schema/index.js';
import { sql, eq } from 'drizzle-orm';

// ── 1. Dedup listening_exercises (no unique constraint yet) ──────────────────
console.log('Deduplicating listening exercises...');
await db.execute(sql`
  DELETE FROM listening_exercises
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY title, level ORDER BY id ASC) AS rn
      FROM listening_exercises
    ) ranked
    WHERE rn > 1
  )
`);
const listening = await db.select({ title: listeningExercises.title }).from(listeningExercises);
console.log('  Listening remaining:', listening.length, listening.map(r => r.title).join(', '));

// ── 2. Dedup grammar_exercises — keep earliest per topic ─────────────────────
// Strategy: for each topic, count exercises. If > expected, delete all and let seed re-insert.
// Simpler: delete duplicate sets by keeping exercises with the smallest IDs per topic.
console.log('\nDeduplicating grammar exercises...');
const topics = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug }).from(grammarTopics);

for (const topic of topics) {
  const exercises = await db.select({ id: grammarExercises.id })
    .from(grammarExercises)
    .where(eq(grammarExercises.topicId, topic.id))
    .orderBy(grammarExercises.id);

  if (exercises.length === 0) continue;

  // Determine expected count by looking at total (if duplicated, it's a multiple of base)
  // Find the "period" — if 8 exercises, it's likely 2x4. Keep only first half.
  // Heuristic: if count is divisible by 2 or 3 and > 4, deduplicate
  // Cleanest: just delete all and re-insert (seed will do it)
  if (exercises.length > 4) {
    // Keep only first 4 exercises (standard per topic in our seed)
    const toDelete = exercises.slice(4).map(e => e.id);
    if (toDelete.length > 0) {
      await db.execute(sql.raw(`DELETE FROM grammar_exercises WHERE id IN (${toDelete.map(id => `'${id}'`).join(', ')})`));
      console.log(`  ${topic.slug}: removed ${toDelete.length} extra exercises`);
    }
  }
}

const totalEx = await db.select({ count: sql<number>`count(*)` }).from(grammarExercises);
console.log('  Grammar exercises remaining:', totalEx[0]?.count);

process.exit(0);
