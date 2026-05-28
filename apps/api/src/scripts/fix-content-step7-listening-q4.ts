/**
 * Step 7 of the content remediation plan.
 *
 * Fix one listening exercise question with a tense inconsistency.
 *
 * Exercise: "Week-end à la campagne" (A2)
 *   Q4: "Qu'ont-ils fait le soir ?"
 *
 * The transcript uses passé composé ("nous avons préparé un barbecue")
 * but the question option list has the answer in present tense
 * ("ils font un barbecue"). Replace with the past-tense form so the
 * answer matches the transcript grammatically.
 *
 * Idempotent — uses transcript text as the dedupe key.
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';

const target = await db.query.listeningExercises.findFirst({
  where: eq(listeningExercises.title, 'Week-end à la campagne'),
});

if (!target) {
  console.error('[step7] target exercise not found'); process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const questions = target.questions as any[];
const q4 = questions.find((q) => q.id === 'q4');
if (!q4) { console.error('[step7] q4 not found'); process.exit(1); }

console.log(`[step7] before: correct='${q4.correct}', options=${JSON.stringify(q4.options)}`);

// Map old → new strings. The old 'ils font un barbecue' is wrong tense,
// the correct one matches transcript "nous avons préparé un barbecue" →
// 3pl form 'ils ont préparé un barbecue'. Update both `correct` and the
// matching option in the options array.
const OLD = 'ils font un barbecue';
const NEW = 'ils ont préparé un barbecue';

if (q4.correct !== OLD) {
  console.log('[step7] already fixed (correct does not equal old value) — no-op');
  process.exit(0);
}

q4.correct = NEW;
q4.options = (q4.options as string[]).map((o) => (o === OLD ? NEW : o));

console.log(`[step7] after:  correct='${q4.correct}', options=${JSON.stringify(q4.options)}`);

await db.update(listeningExercises)
  .set({ questions })
  .where(eq(listeningExercises.id, target.id));

console.log(`[step7] updated exercise id=${target.id}`);
process.exit(0);
