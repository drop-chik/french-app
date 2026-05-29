/**
 * Generate C1 drill sets via gpt-4o-mini.
 *
 * 4 drill sets, 25 questions each (mirrors B1/B2 question count).
 *
 *   1. subjonctif-passe-c1     (subjonctif passé conjugation drills)
 *   2. concordance-subjonctif  (advanced concordance picks)
 *   3. double-pronominalisation (order + form of double pronouns)
 *   4. participe-vs-gerondif   (distinguish part. présent / gérondif / adj. verbal)
 *
 * Question type: multiple_choice (3 options each) — same shape as the B2
 * drill set examples in the DB.
 *
 * Idempotent: skips slugs already in DB.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { drillSets, drillQuestions } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c1-drills';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface DrillSpec {
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  category: string;
  difficulty: number;
  questionCount: number;
  icon: string;
  focus: string;
}

const SPECS: DrillSpec[] = [
  {
    slug: 'subjonctif-passe-c1',
    titleRu: 'Subjonctif passé — спряжение и согласование',
    titleEn: 'Subjonctif passé — forms and concordance',
    descriptionRu: 'Постройте subjonctif passé: avoir/être au subj. + participe passé. Отработайте антериорность в сложных контекстах.',
    descriptionEn: 'Build subjonctif passé: avoir/être in subj. + past participle. Practise anteriority in complex contexts.',
    category: 'subjonctif', difficulty: 4, questionCount: 25, icon: 'Clock',
    focus: 'Subjonctif passé: form construction (avoir/être subj. + past participle, with correct auxiliary), and concordance for anterior actions. Use varied triggers (regretter que, douter que, il est possible que, bien que, à condition que). Include some agreement traps (préoccupé que les décisions aient été prises).',
  },
  {
    slug: 'double-pronominalisation-c1',
    titleRu: 'Двойное местоимение — порядок и форма',
    titleEn: 'Double pronominalisation — order and form',
    descriptionRu: 'Замените оба объекта местоимениями: le lui, la lui, les leur, y en. Императив и инверсия в imparfait/présent.',
    descriptionEn: 'Replace both objects with pronouns: le lui, la lui, les leur, y en. Imperative inversions in past and present.',
    category: 'pronoms', difficulty: 4, questionCount: 25, icon: 'Brain',
    focus: 'Combine direct + indirect object pronouns: le lui, la lui, les leur, m en, y en. Order rules (le/la/les before lui/leur but after me/te/nous/vous/se). Imperative reverses to verbe-moi-le. NOT le me / la te — use moi-le.',
  },
  {
    slug: 'participe-vs-gerondif-c1',
    titleRu: 'Participe présent / gérondif / adjectif verbal',
    titleEn: 'Participe présent vs gérondif vs verbal adjective',
    descriptionRu: 'Различайте три формы на -ant: participe présent (инвариант), gérondif (en + part.) и adjectif verbal (согласование).',
    descriptionEn: 'Distinguish three -ant forms: participe présent (invariable), gérondif (en + part.), adjectif verbal (agreement).',
    category: 'verbes', difficulty: 4, questionCount: 25, icon: 'Sparkles',
    focus: 'Pick between participle (en marchant), present participle (étant donné, ayant compris), and verbal adjective (fatigant/fatiguante, intéressant/intéressante). Spelling differences (fatigant adj vs fatiguant part). Function in sentence determines choice.',
  },
  {
    slug: 'connecteurs-formels-c1',
    titleRu: 'Формальные коннекторы — выбор и порядок',
    titleEn: 'Formal connectors — selection and order',
    descriptionRu: 'Выберите правильный коннектор (cause, conséquence, concession, opposition) и согласуйте с regime: subjonctif vs indicatif.',
    descriptionEn: 'Pick the right connector (cause, consequence, concession, opposition) and match the regime: subjunctive vs indicative.',
    category: 'connecteurs', difficulty: 3, questionCount: 25, icon: 'Timer',
    focus: 'Choose between étant donné que (+ind), dans la mesure où, du fait que (cause); si bien que, de sorte que, à tel point que (consequence); quoique, encore que, bien que, fût-ce, alors même que (concession, often +subj); tandis que, alors que (opposition). Test regime match.',
  },
];

const SYSTEM_PROMPT = `You are a French C1 drill author. The user gives you a
theme + focus. Produce JSON with key "questions" — an array of EXACTLY 25
multiple-choice questions, each shaped:
  {
    "type": "multiple_choice",
    "question": { "text": "<French sentence with ___ for the gap>", "options": ["...", "...", "..."] },
    "answer":   { "correct": "<must equal exactly one of the options>" },
    "explanation": "<short Russian explanation, 1-2 sentences>"
  }

Rules:
- The "text" MUST contain "___" (three underscores) for the gap.
- Provide exactly 3 options. Distractors must be plausible (close form,
  wrong tense, common error pattern).
- "correct" must be a verbatim copy of one of the options.
- Explanations in Russian, focused on the grammatical rule.
- Cover a range of persons, verbs, and contexts within the focus.
- Output ONLY the JSON {"questions": [...]}.`;

interface Question {
  type: 'multiple_choice';
  question: { text: string; options: string[] };
  answer: { correct: string };
  explanation: string;
}

async function genQuestions(spec: DrillSpec): Promise<Question[]> {
  const userMsg = `Theme: ${spec.titleRu}
Focus: ${spec.focus}

Produce 25 multiple_choice drill questions practising this rule.`;
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
  const raw = resp.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw) as { questions?: Question[] };
  return parsed.questions ?? [];
}

const existing = await db.select({ slug: drillSets.slug }).from(drillSets);
const existingSlugs = new Set(existing.map((e) => e.slug));

const all: Array<{ spec: DrillSpec; questions: Question[] }> = [];
for (const spec of SPECS) {
  if (existingSlugs.has(spec.slug)) { console.log(`  skip exists: ${spec.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${spec.slug}.json`;
  let questions: Question[];
  if (existsSync(cacheFile)) {
    questions = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${spec.slug} (${questions.length} q)`);
  } else {
    console.log(`  gen: ${spec.slug}…`);
    questions = await genQuestions(spec);
    writeFileSync(cacheFile, JSON.stringify(questions, null, 2));
    console.log(`    → ${questions.length} q`);
  }
  all.push({ spec, questions });
}

console.log(`\n[c1-drills] ${all.length} sets ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply to INSERT`); process.exit(0); }

let setInserted = 0; let qInserted = 0;
for (const { spec, questions } of all) {
  const [s] = await db.insert(drillSets).values({
    slug: spec.slug,
    titleRu: spec.titleRu,
    titleEn: spec.titleEn,
    descriptionRu: spec.descriptionRu,
    descriptionEn: spec.descriptionEn,
    level: 'C1',
    category: spec.category,
    difficulty: spec.difficulty,
    questionCount: questions.length,
    icon: spec.icon,
  }).returning({ id: drillSets.id });
  if (!s) continue;
  setInserted++;
  for (const q of questions) {
    try {
      await db.insert(drillQuestions).values({
        drillSetId: s.id,
        type: q.type,
        question: q.question,
        answer: q.answer,
        explanation: q.explanation,
      });
      qInserted++;
    } catch (err) {
      console.warn(`    q failed: ${(err as Error).message}`);
    }
  }
}
console.log(`[apply] ${setInserted} sets, ${qInserted} questions`);
process.exit(0);
