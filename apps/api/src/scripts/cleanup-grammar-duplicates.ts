/**
 * Cleanup grammar topic duplicates between B2 and C1 + renumber A2.
 *
 * The B2 set was seeded before C1 existed and three topics were
 * misplaced — they belong to C1 register, not B2:
 *   - mise-en-relief
 *   - negation-complexe
 *   - style-indirect-libre
 *
 * The C1 versions are pedagogically richer (more content blocks,
 * formal register), so we drop the B2 duplicates.
 *
 * Also reorders the A2 topic orderNums to remove the 12, 13 gaps.
 */
import 'dotenv/config';
import { eq, asc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarTopics } from '../db/schema/index.js';

const APPLY = process.argv.includes('--apply');

const TO_DELETE = [
  { slug: 'mise-en-relief',      reason: 'duplicate of c1-mise-en-relief' },
  { slug: 'negation-complexe',   reason: 'duplicate of c1-negation-complexe' },
  { slug: 'style-indirect-libre', reason: 'duplicate of c1-style-indirect-libre' },
];

console.log('=== Step 1: drop B2 duplicates ===');
const deleteIds: string[] = [];
for (const d of TO_DELETE) {
  const [row] = await db.select({ id: grammarTopics.id, level: grammarTopics.level, titleRu: grammarTopics.titleRu })
    .from(grammarTopics).where(eq(grammarTopics.slug, d.slug));
  if (!row) { console.log(`  - ${d.slug}: not found`); continue; }
  console.log(`  - ${d.slug}  level=${row.level}  "${row.titleRu}"  (${d.reason})`);
  deleteIds.push(row.id);
}

console.log('\n=== Step 2: renumber A2 contiguous ===');
const a2 = await db.select({ id: grammarTopics.id, slug: grammarTopics.slug, orderNum: grammarTopics.orderNum })
  .from(grammarTopics).where(eq(grammarTopics.level, 'A2')).orderBy(asc(grammarTopics.orderNum));
const renumbers: Array<{ id: string; slug: string; oldOrder: number; newOrder: number }> = [];
for (let i = 0; i < a2.length; i++) {
  const target = i + 1;
  if (a2[i]!.orderNum !== target) {
    renumbers.push({ id: a2[i]!.id, slug: a2[i]!.slug, oldOrder: a2[i]!.orderNum, newOrder: target });
  }
}
for (const r of renumbers) console.log(`  - ${r.slug}: ${r.oldOrder} → ${r.newOrder}`);
if (renumbers.length === 0) console.log('  ✓ already contiguous');

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply: ${deleteIds.length} deletes + ${renumbers.length} renumbers`);
  process.exit(0);
}

let deleted = 0;
for (const id of deleteIds) {
  try {
    // grammar_exercises has ON DELETE CASCADE so they go too
    await db.delete(grammarTopics).where(eq(grammarTopics.id, id));
    deleted++;
  } catch (err) {
    console.warn(`  delete failed: ${(err as Error).message.slice(0, 100)}`);
  }
}
let renumbered = 0;
for (const r of renumbers) {
  try {
    await db.update(grammarTopics).set({ orderNum: r.newOrder }).where(eq(grammarTopics.id, r.id));
    renumbered++;
  } catch (err) {
    console.warn(`  renumber failed ${r.slug}: ${(err as Error).message.slice(0, 100)}`);
  }
}
console.log(`\n[apply] deleted ${deleted}, renumbered ${renumbered}`);
process.exit(0);
