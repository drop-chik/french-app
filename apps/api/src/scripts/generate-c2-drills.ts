/**
 * C2 drill sets — 3 sets × 25 multiple-choice questions on C2 mastery
 * topics (passé simple production, subj. imparfait choice, archaic
 * inversions).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { drillSets, drillQuestions } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c2-drills';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface DrillSpec {
  slug: string; titleRu: string; titleEn: string;
  descriptionRu: string; descriptionEn: string;
  category: string; difficulty: number; icon: string; focus: string;
}

const SPECS: DrillSpec[] = [
  {
    slug: 'passe-simple-c2', titleRu: 'Passé simple — спряжение и употребление',
    titleEn: 'Passé simple — forms and use',
    descriptionRu: 'Постройте formes passé simple для всех групп глаголов: -er, -ir, -re, неправильные (avoir, être, faire, dire, voir, mettre).',
    descriptionEn: 'Construct passé simple for all verb groups including irregulars.',
    category: 'verbes', difficulty: 5, icon: 'Clock',
    focus: 'Active passé simple conjugation: all groups (-er → -ai/-as/-a, -ir → -is/-it, -re → -is/-it, irregulars). 3rd person singular and plural forms (the most used in literary narration). Distinction from imparfait (background vs event).',
  },
  {
    slug: 'subjonctif-imparfait-c2', titleRu: 'Subjonctif imparfait — выбор и спряжение',
    titleEn: 'Subjonctif imparfait — choice and forms',
    descriptionRu: 'Выберите правильную форму subjonctif imparfait в литературных контекстах. Включает eût, fût, prît, vînt, sût.',
    descriptionEn: 'Pick the correct subjonctif imparfait form in literary contexts.',
    category: 'subjonctif', difficulty: 5, icon: 'Brain',
    focus: 'Subjonctif imparfait choice in literary register: triggered by main verb in passé and a subjunctive context. Forms: eût, fût, prît, fît, vînt, sût, dût, voulût, pût, mût. Distinction from indicatif passé simple in 3rd singular (subj. has accent grave/circonflexe).',
  },
  {
    slug: 'figures-style-c2', titleRu: 'Стилистические фигуры — распознавание',
    titleEn: 'Stylistic figures — recognition',
    descriptionRu: 'Определите риторическую фигуру в коротких отрывках: chiasme, oxymore, hypallage, zeugme, anaphore, litote.',
    descriptionEn: 'Identify the rhetorical figure in short literary excerpts.',
    category: 'stylistique', difficulty: 4, icon: 'Sparkles',
    focus: 'Identify rhetorical figures in literary French excerpts: chiasme, oxymore, hypallage, zeugme, anaphore, épanaphore, gradation, antithèse, prétérition, litote, euphémisme, métonymie, synecdoque, polyptote, anacoluthe.',
  },
];

const SYSTEM_PROMPT = `You are a French C2 drill author. Output JSON with
key "questions" containing 25 multiple_choice questions:
  {
    "type": "multiple_choice",
    "question": { "text": "<sentence with ___>", "options": [3 strings] },
    "answer":   { "correct": "<exact match>" },
    "explanation": "<Russian 1-2 sentences>"
  }

Rules:
- "text" must include "___" for the gap (literary excerpt where possible).
- 3 options; "correct" verbatim equal to one option; plausible distractors
  (similar form, wrong tense, common literary confusion).
- Explanations in Russian.
- Use C2 register: literary, journalistic, academic.
- Output ONLY {"questions":[...]}.`;

interface Question {
  type: 'multiple_choice';
  question: { text: string; options: string[] };
  answer: { correct: string };
  explanation: string;
}

async function genQuestions(spec: DrillSpec): Promise<Question[]> {
  const userMsg = `Theme: ${spec.titleRu}\nFocus: ${spec.focus}\n\n25 multiple_choice questions at C2.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 3500,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const parsed = JSON.parse(resp.choices[0]?.message?.content ?? '{}') as { questions?: Question[] };
  return parsed.questions ?? [];
}

const existing = new Set((await db.select({ slug: drillSets.slug }).from(drillSets)).map((r) => r.slug));
const all: Array<{ spec: DrillSpec; questions: Question[] }> = [];
for (const spec of SPECS) {
  if (existing.has(spec.slug)) { console.log(`  skip exists: ${spec.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${spec.slug}.json`;
  let questions: Question[];
  if (existsSync(cacheFile)) {
    questions = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${spec.slug} (${questions.length}q)`);
  } else {
    console.log(`  gen: ${spec.slug}…`);
    questions = await genQuestions(spec);
    writeFileSync(cacheFile, JSON.stringify(questions, null, 2));
    console.log(`    → ${questions.length}q`);
  }
  all.push({ spec, questions });
}

console.log(`\n[c2-drills] ${all.length} sets ready`);
if (!APPLY) { console.log(`[dry-run]`); process.exit(0); }

let setI = 0; let qI = 0;
for (const { spec, questions } of all) {
  const [s] = await db.insert(drillSets).values({
    slug: spec.slug, titleRu: spec.titleRu, titleEn: spec.titleEn,
    descriptionRu: spec.descriptionRu, descriptionEn: spec.descriptionEn,
    level: 'C2', category: spec.category, difficulty: spec.difficulty,
    questionCount: questions.length, icon: spec.icon,
  }).returning({ id: drillSets.id });
  if (!s) continue;
  setI++;
  for (const q of questions) {
    try {
      await db.insert(drillQuestions).values({
        drillSetId: s.id, type: q.type, question: q.question,
        answer: q.answer, explanation: q.explanation,
      });
      qI++;
    } catch (err) {
      console.warn(`    q failed: ${(err as Error).message}`);
    }
  }
}
console.log(`[apply] ${setI} sets, ${qI} questions`);
process.exit(0);
