/**
 * Step 8 of the content remediation plan (added round 2).
 *
 * Single-target fix for an exercise with a duplicated option:
 *   topic: adjectives-agreement
 *   question: "des enfants ___ (heureux)"
 *   options: ["heureux", "heureuse", "heureuses", "heureux"] ← dup at index 3
 *
 * Replace the duplicate fourth slot with a distractor that's grammatically
 * incorrect but plausible — "heureuxes" (a learner-error form), so the
 * exercise still tests the right discrimination.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarExercises } from '../db/schema/index.js';

const EID = '9116d971-9b27-4223-b330-cdf3de269e99';

const row = await db.query.grammarExercises.findFirst({
  where: eq(grammarExercises.id, EID),
});
if (!row) { console.error('[step8] exercise not found'); process.exit(1); }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = row.question as any;
console.log('[step8] before:', JSON.stringify(q.options));

if (!Array.isArray(q.options) || q.options.length !== 4) {
  console.error('[step8] unexpected options shape'); process.exit(1);
}

// Replace the second 'heureux' with the learner-typical wrong form.
let firstSeen = false;
const fixed = q.options.map((o: string) => {
  if (o === 'heureux') {
    if (!firstSeen) { firstSeen = true; return o; }
    return 'heureuxes';
  }
  return o;
});

if (JSON.stringify(fixed) === JSON.stringify(q.options)) {
  console.log('[step8] no dup found — already fixed'); process.exit(0);
}

q.options = fixed;
console.log('[step8] after: ', JSON.stringify(q.options));

await db.update(grammarExercises).set({ question: q }).where(eq(grammarExercises.id, EID));
console.log('[step8] updated');
process.exit(0);
