/**
 * Renumber orderNum contiguously across each CEFR level. Useful after
 * topic deletions or insertions disturb the sequence.
 */
import 'dotenv/config';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarTopics } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

for (const lv of LEVELS) {
  const rows = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug, orderNum: grammarTopics.orderNum })
    .from(grammarTopics).where(eq(grammarTopics.level, lv)).orderBy(asc(grammarTopics.orderNum));
  if (rows.length === 0) continue;

  const changes: Array<{ id: string; slug: string; oldOrder: number; newOrder: number }> = [];
  for (let i = 0; i < rows.length; i++) {
    const target = i + 1;
    if (rows[i]!.orderNum !== target) {
      changes.push({ id: rows[i]!.id, slug: rows[i]!.slug, oldOrder: rows[i]!.orderNum, newOrder: target });
    }
  }
  if (changes.length === 0) {
    console.log(`${lv}: already contiguous (${rows.length} topics)`);
    continue;
  }
  console.log(`\n${lv}: ${changes.length} topics to renumber:`);
  for (const c of changes) console.log(`  ${c.slug}: ${c.oldOrder} → ${c.newOrder}`);

  if (APPLY) {
    // Two-phase to avoid temporary unique conflicts (there's no UNIQUE on
    // (level, orderNum) currently, but be defensive).
    let updated = 0;
    for (const c of changes) {
      try {
        await db.update(grammarTopics).set({ orderNum: c.newOrder }).where(eq(grammarTopics.id, c.id));
        updated++;
      } catch (err) {
        console.warn(`  failed ${c.slug}: ${(err as Error).message.slice(0, 100)}`);
      }
    }
    console.log(`  [apply] updated ${updated}`);
  }
}

if (!APPLY) console.log(`\n[dry-run] pass --apply`);
process.exit(0);
