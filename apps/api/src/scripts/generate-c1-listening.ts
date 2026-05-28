/**
 * Generate C1 listening exercises via gpt-4o.
 *
 * Each exercise: title + transcript (~250-350 words, ~80-100 sec spoken)
 * + 5 multiple-choice questions in French, C1 register.
 *
 * audioUrl is left as empty string for now — a separate TTS pass can
 * fill it later. The frontend already gracefully handles missing audio
 * by displaying transcript only.
 *
 * Idempotent: skips titles that already exist.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { sql, eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c1-listening';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface Theme {
  slug: string;
  titleFr: string;
  format: string;
  topic: string;
}

const THEMES: Theme[] = [
  { slug: 'c1-debat-ia-emploi', titleFr: "Débat : l'intelligence artificielle et l'avenir du travail", format: 'two-speaker debate', topic: 'AI impact on employment, opposing views (economist vs sociologist)' },
  { slug: 'c1-conf-architecture-urbaine', titleFr: "Conférence : architecture urbaine et qualité de vie", format: 'academic lecture', topic: 'urban planning, density, green spaces, post-pandemic redesign' },
  { slug: 'c1-interview-ecrivain', titleFr: "Entretien : un écrivain et son processus créatif", format: 'literary interview', topic: 'writer discussing creative process, inspiration, discipline' },
  { slug: 'c1-podcast-economie-circulaire', titleFr: "Podcast : l'économie circulaire en pratique", format: 'expert podcast', topic: 'circular economy, business case studies, policy levers' },
  { slug: 'c1-debat-mediatique-justice', titleFr: "Débat : la médiatisation des affaires judiciaires", format: 'TV debate', topic: 'media coverage of trials, presumption of innocence, public opinion' },
  { slug: 'c1-conf-neurosciences-apprentissage', titleFr: "Conférence : neurosciences et apprentissage", format: 'academic lecture', topic: 'cognitive neuroscience applied to learning, attention, memory consolidation' },
  { slug: 'c1-entretien-cineaste', titleFr: "Entretien : un cinéaste sur la narration", format: 'cultural interview', topic: 'filmmaker discussing narrative structure, casting, technical choices' },
  { slug: 'c1-table-ronde-democratie', titleFr: "Table ronde : démocratie et désinformation", format: 'three-speaker round table', topic: 'political philosophy on democratic resilience against disinformation' },
  { slug: 'c1-reportage-patrimoine', titleFr: "Reportage : le patrimoine immatériel français", format: 'documentary reportage', topic: 'intangible cultural heritage, UNESCO criteria, French savoir-faire' },
  { slug: 'c1-podcast-philosophie-morale', titleFr: "Podcast : la philosophie morale aujourd'hui", format: 'philosophical podcast', topic: 'contemporary ethics, applied moral philosophy (bioethics, AI ethics)' },
];

const SYSTEM_PROMPT = `You are a French scriptwriter producing C1-level
listening comprehension material for advanced French learners.

For the requested theme, output a JSON object with keys:
  "title":        string — short title in French
  "transcript":   string — 250-350 words, natural spoken French, C1 register
                  with discourse markers, hesitations are OK but minimal.
                  Use speaker labels ("Présentateur :", "Sophie :", etc.).
                  Newlines separate speaker turns / paragraphs.
  "durationSec":  integer — approximate spoken duration (words / 2.5).
  "questions":    array of EXACTLY 5 multiple-choice questions, each:
    {
      "id":      "q1" ... "q5",
      "text":    string — question in French
      "options": array of 4 strings — answer options in French
      "correct": string — must match one of the options exactly
    }

Question style:
- Test comprehension of specific arguments, examples, contrasts.
- One question must test inference (not literal repetition).
- One question must test a discourse marker or stance.
- Options must be plausible distractors drawn from the topic domain.
- All options realistic; no "all of the above" / "none of the above".

Output ONLY the JSON object. No prose.`;

interface ListeningResult {
  title: string;
  transcript: string;
  durationSec: number;
  questions: Array<{ id: string; text: string; options: string[]; correct: string }>;
}

async function genListening(theme: Theme): Promise<ListeningResult> {
  const userMsg = `Theme: ${theme.titleFr}
Format: ${theme.format}
Topic detail: ${theme.topic}

Produce the listening exercise as described.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2200,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as ListeningResult;
}

const existing = await db.select({ title: listeningExercises.title }).from(listeningExercises);
const existingTitles = new Set(existing.map((e) => e.title));

const generated: Array<{ theme: Theme; r: ListeningResult }> = [];
for (const theme of THEMES) {
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let r: ListeningResult;
  if (existsSync(cacheFile)) {
    r = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${theme.slug} (${r.transcript.split(/\s+/).length}w, ${r.questions.length}q)`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    r = await genListening(theme);
    writeFileSync(cacheFile, JSON.stringify(r, null, 2));
    console.log(`    → ${r.transcript.split(/\s+/).length}w, ${r.questions.length}q`);
  }
  if (existingTitles.has(r.title)) {
    console.log(`    skip (title exists): ${r.title}`);
    continue;
  }
  generated.push({ theme, r });
}

console.log(`\n[c1-listening] ${generated.length} ready to insert`);

if (!APPLY) {
  console.log(`[dry-run] pass --apply to INSERT ${generated.length} listening exercises`);
  process.exit(0);
}

let inserted = 0;
for (const g of generated) {
  try {
    await db.insert(listeningExercises).values({
      title: g.r.title,
      level: 'C1',
      audioUrl: '',
      transcript: g.r.transcript,
      questions: g.r.questions,
      durationSec: g.r.durationSec,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${g.r.title}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
