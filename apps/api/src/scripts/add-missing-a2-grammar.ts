/**
 * Add the two CEFR-core A2 grammar topics that were placed on B1
 * but are pedagogically expected at A2:
 *
 *   - conditionnel présent (politesse) — "je voudrais", "pourrais-tu",
 *     polite requests. A2-level introduction; the deeper hypothetical
 *     use stays at B1 (conditionnel-present).
 *   - subjonctif présent (intro) — base forms after "il faut que",
 *     "je veux que", "il est important que". A2-level introduction;
 *     full expressions of doubt/emotion stay at B1 (subjonctif-present).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq, max, and } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { grammarTopics, grammarExercises } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/a2-missing-grammar';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface ThemeSpec { slug: string; titleRu: string; titleFr: string; category: string; focus: string }

const THEMES: ThemeSpec[] = [
  {
    slug: 'conditionnel-present-politesse',
    titleRu: 'Conditionnel présent — вежливые формы',
    titleFr: 'Le conditionnel présent — formes de politesse',
    category: 'verbes',
    focus: 'A2 intro to conditionnel présent for politeness and requests: je voudrais, j\'aimerais, pourriez-vous, voudriez-vous, ce serait, on pourrait. Forms for vouloir/aimer/pouvoir/devoir/être/avoir. Use in restaurant/shop/asking favours scenarios. NOT the hypothetical use yet (that goes to B1).',
  },
  {
    slug: 'subjonctif-present-introduction',
    titleRu: 'Subjonctif présent — введение',
    titleFr: 'Le subjonctif présent — introduction',
    category: 'verbes',
    focus: 'A2 intro to subjonctif présent: limited triggers "il faut que", "je veux que", "il est important que". Forms for regular -er verbs and the most common irregulars (être, avoir, aller, faire, pouvoir). Subject change rule. Compare with infinitive after "il faut + inf" (impersonal). NOT subjunctive of emotion/doubt (that goes to B1).',
  },
];

const TOPIC_SYSTEM_PROMPT = `You are a French grammar pedagogue creating A2-level
content for elementary learners. Output JSON with key "content" containing
an array of 4-6 blocks. Each block:
  { "type": "paragraph", "text": "..." }
  { "type": "table", "title": "...", "headers": [...], "rows": [[...], ...] }
  { "type": "example_list", "items": [{ "fr": "...", "ru": "...", "en": "..." }] }

Rules:
- All explanations and table headers in RUSSIAN (user's L1).
- French examples must use natural A2-friendly contexts (everyday).
- Tables: conjugation paradigms or contrasts.
- 5-7 examples in example_list with fr/ru/en.
- A2 means SIMPLE: short sentences, common verbs, no advanced register.
- Output ONLY {"content": [...]}.`;

const EX_SYSTEM_PROMPT = `You are a French grammar exercise author for A2.
Output JSON with key "exercises" containing exactly 10 fill_blank exercises:
  {
    "type": "fill_blank",
    "question": { "text": "<sentence with ___>", "blanks": 1 },
    "answer": { "values": ["<one or more accepted answers>"] },
    "explanation": "<Russian 1-2 sentence explanation>"
  }

Rules:
- text MUST contain "___" (three underscores).
- A2 contexts: requests, polite asks, basic feelings.
- Explanations in Russian, focused on the rule.
- Output ONLY {"exercises": [...]}.`;

interface ContentBlock { type: string; [k: string]: unknown }
interface TopicResult { content: ContentBlock[] }
interface ExerciseItem {
  type: 'fill_blank';
  question: { text: string; blanks: number };
  answer: { values: string[] };
  explanation: string;
}
interface ExResult { exercises: ExerciseItem[] }

async function genTopic(theme: ThemeSpec): Promise<TopicResult> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 2500,
    messages: [
      { role: 'system', content: TOPIC_SYSTEM_PROMPT },
      { role: 'user', content: `Theme: ${theme.titleFr} (${theme.titleRu})\nFocus: ${theme.focus}\n\nProduce 4-6 A2-level content blocks.` },
    ],
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? '{}') as TopicResult;
}

async function genExercises(theme: ThemeSpec): Promise<ExResult> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2200,
    messages: [
      { role: 'system', content: EX_SYSTEM_PROMPT },
      { role: 'user', content: `Theme: ${theme.titleFr}\nFocus: ${theme.focus}\n\n10 fill_blank exercises at A2.` },
    ],
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? '{}') as ExResult;
}

const existing = new Set((await db.select({ slug: grammarTopics.slug }).from(grammarTopics)).map((e) => e.slug));
const [maxRow] = await db.select({ m: max(grammarTopics.orderNum) }).from(grammarTopics).where(eq(grammarTopics.level, 'A2'));
let nextOrder = (maxRow?.m ?? 0) + 1;

const generated: Array<{ theme: ThemeSpec; topic: TopicResult; exercises: ExResult; orderNum: number }> = [];
for (const theme of THEMES) {
  if (existing.has(theme.slug)) { console.log(`  skip exists: ${theme.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let topic: TopicResult; let exercises: ExResult;
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    topic = cached.topic; exercises = cached.exercises;
    console.log(`  cache: ${theme.slug}`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    topic = await genTopic(theme);
    exercises = await genExercises(theme);
    writeFileSync(cacheFile, JSON.stringify({ topic, exercises }, null, 2));
    console.log(`    → ${topic.content.length} blocks, ${exercises.exercises.length} ex`);
  }
  generated.push({ theme, topic, exercises, orderNum: nextOrder++ });
}

console.log(`\n[a2-missing] ${generated.length} topics ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply`); process.exit(0); }

let topicsI = 0; let exI = 0;
for (const g of generated) {
  const [t] = await db.insert(grammarTopics).values({
    slug: g.theme.slug, titleRu: g.theme.titleRu, titleFr: g.theme.titleFr,
    level: 'A2', category: g.theme.category, orderNum: g.orderNum, content: g.topic.content,
  }).returning({ id: grammarTopics.id });
  if (!t) continue;
  topicsI++;
  for (const ex of g.exercises.exercises) {
    try {
      await db.insert(grammarExercises).values({
        topicId: t.id, type: ex.type, question: ex.question, answer: ex.answer, explanation: ex.explanation,
      });
      exI++;
    } catch (err) {
      console.warn(`    ex failed: ${(err as Error).message}`);
    }
  }
}
console.log(`[apply] ${topicsI} topics, ${exI} exercises`);
process.exit(0);
