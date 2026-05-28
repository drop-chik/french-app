import 'dotenv/config';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { grammarTopics, grammarExercises, listeningExercises, readingTexts } from '../db/schema/index.js';

console.log('=== Random C1 grammar topic + 3 exercises ===');
const [t] = await db.select().from(grammarTopics).where(eq(grammarTopics.level, 'C1')).orderBy(sql`RANDOM()`).limit(1);
if (t) {
  console.log(`slug: ${t.slug}  | titleRu: ${t.titleRu}  | category: ${t.category}  | order: ${t.orderNum}`);
  const content = t.content as Array<{ type: string; text?: string; title?: string; items?: unknown[]; rows?: unknown[] }>;
  for (const b of content.slice(0, 3)) {
    if (b.type === 'paragraph') console.log(`  [P] ${(b.text ?? '').slice(0, 220)}`);
    else if (b.type === 'table') console.log(`  [T] ${b.title} (${(b.rows ?? []).length} rows)`);
    else if (b.type === 'example_list') console.log(`  [E] example_list ${(b.items ?? []).length} items`);
  }
  const exs = await db.select().from(grammarExercises).where(eq(grammarExercises.topicId, t.id)).limit(3);
  console.log(`--- ${exs.length} sample exercises ---`);
  for (const ex of exs) {
    const q = ex.question as { text: string };
    const a = ex.answer as { values: string[] };
    console.log(`  Q: ${q.text}`);
    console.log(`     A: ${a.values.join(' / ')}`);
    console.log(`     ex: ${(ex.explanation ?? '').slice(0, 140)}`);
  }
}

console.log('\n=== Random C1 listening (head + 2 Qs) ===');
const [l] = await db.select().from(listeningExercises).where(eq(listeningExercises.level, 'C1')).orderBy(sql`RANDOM()`).limit(1);
if (l) {
  console.log(`title: ${l.title}  | duration: ${l.durationSec}s  | transcript len: ${l.transcript.length}`);
  console.log(`  head: ${l.transcript.slice(0, 350)}`);
  const qs = l.questions as Array<{ text: string; correct: string; options: string[] }>;
  for (const q of qs.slice(0, 2)) {
    console.log(`  Q: ${q.text}`);
    console.log(`     correct: ${q.correct}`);
  }
}

console.log('\n=== Random C1 reading text (head + 2 Qs + wordMap sample) ===');
const [r] = await db.select().from(readingTexts).where(eq(readingTexts.level, 'C1')).orderBy(sql`RANDOM()`).limit(1);
if (r) {
  const wm = r.wordMap as Record<string, { tr: string; pos: string; ipa: string }>;
  const keys = Object.keys(wm);
  console.log(`slug: ${r.slug}  | topic: ${r.topic}  | min: ${r.estimatedMinutes}  | wordMap size: ${keys.length}`);
  console.log(`  head: ${r.contentFr.slice(0, 350)}`);
  console.log(`  wordMap sample:`);
  for (const k of keys.slice(0, 6)) {
    const e = wm[k]!;
    console.log(`    ${k.padEnd(20)} → ${(e.tr ?? '').padEnd(20)} ipa=${e.ipa ?? '∅'}  pos=${e.pos ?? '∅'}`);
  }
  const qs = r.questions as Array<{ question: string; correct: string }>;
  for (const q of qs.slice(0, 2)) {
    console.log(`  Q: ${q.question}`);
    console.log(`     correct: ${q.correct}`);
  }
}

process.exit(0);
