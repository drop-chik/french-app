/**
 * Generate C2 listening exercises via gpt-4o.
 *
 * C2 (mastery) listening: literary register, complex argumentation,
 * abstract debates. Transcripts ~300-380 words with subtle nuance
 * the listener must catch.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { listeningExercises } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c2-listening';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface Theme { slug: string; titleFr: string; format: string; topic: string }

const THEMES: Theme[] = [
  { slug: 'c2-conf-philosophie-langage', titleFr: "Conférence : philosophie du langage", format: 'academic philosophy lecture', topic: 'how language structures thought, performativity, Wittgenstein on meaning' },
  { slug: 'c2-debat-litterature-engagee', titleFr: "Débat : la littérature et l\'engagement politique", format: 'literary critic debate', topic: 'opposing views on whether literature must engage politics, references to Sartre, Camus, Houellebecq' },
  { slug: 'c2-interview-academicien', titleFr: "Entretien : un académicien sur l\'évolution de la langue", format: 'academic interview', topic: 'a member of the Académie française discussing language reform, anglicismes, the future of grammatical gender' },
  { slug: 'c2-table-ronde-deontologie-ia', titleFr: "Table ronde : éthique de l\'IA générative", format: 'three-speaker ethics panel', topic: 'philosophical and legal perspectives on generative AI, authorship, copyright, intellectual responsibility' },
  { slug: 'c2-podcast-economie-politique', titleFr: "Podcast : économie politique contemporaine", format: 'expert podcast', topic: 'critical analysis of contemporary capitalism, Piketty, Polanyi, neoclassical critique' },
  { slug: 'c2-conf-neurosciences-conscience', titleFr: "Conférence : neurosciences et conscience", format: 'academic neuroscience lecture', topic: 'the hard problem of consciousness, current empirical approaches, philosophical implications' },
  { slug: 'c2-cinema-critique-auteur', titleFr: "Critique cinématographique : politique des auteurs", format: 'film critic monologue', topic: 'deep analysis of an auteur\'s work (Godard, Resnais), formal innovations, theoretical underpinnings' },
  { slug: 'c2-debat-justice-globale', titleFr: "Débat : justice globale et inégalités", format: 'political philosophy debate', topic: 'Rawls, cosmopolitanism, climate justice, migration ethics, redistributive principles' },
];

const SYSTEM_PROMPT = `You are a French scriptwriter producing C2-mastery
listening comprehension material.

For the requested theme, output JSON with keys:
  "title":       short French title
  "transcript":  300-380 words, natural spoken French at C2 register
                 (academic/literary/expert). Use speaker labels.
                 Newlines separate turns.
  "durationSec": integer (words / 2.5).
  "questions":   exactly 5 multiple-choice questions in French:
    { "id": "q1"..."q5", "text": ..., "options": [4 strings], "correct": <exact match> }

Question style:
- Test subtle distinctions in argumentation, stance, implicit meaning.
- At least 2 inference questions.
- One question must hinge on a discourse marker, mood shift, or stylistic
  choice.
- Distractors must be plausibly defensible.
- Output ONLY the JSON, no prose.`;

interface ListeningResult {
  title: string; transcript: string; durationSec: number;
  questions: Array<{ id: string; text: string; options: string[]; correct: string }>;
}

async function gen(theme: Theme): Promise<ListeningResult> {
  const userMsg = `Theme: ${theme.titleFr}\nFormat: ${theme.format}\nTopic: ${theme.topic}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2400,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as ListeningResult;
}

const existing = new Set((await db.select({ title: listeningExercises.title }).from(listeningExercises)).map((r) => r.title));
const generated: Array<{ theme: Theme; r: ListeningResult }> = [];

for (const theme of THEMES) {
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let r: ListeningResult;
  if (existsSync(cacheFile)) {
    r = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${theme.slug}`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    r = await gen(theme);
    writeFileSync(cacheFile, JSON.stringify(r, null, 2));
    console.log(`    → ${r.transcript.split(/\s+/).length}w, ${r.questions.length}q`);
  }
  if (existing.has(r.title)) { console.log(`    skip (title exists): ${r.title}`); continue; }
  generated.push({ theme, r });
}

console.log(`\n[c2-listening] ${generated.length} ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply to INSERT`); process.exit(0); }

let inserted = 0;
for (const g of generated) {
  try {
    await db.insert(listeningExercises).values({
      title: g.r.title, level: 'C2', audioUrl: '',
      transcript: g.r.transcript, questions: g.r.questions, durationSec: g.r.durationSec,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${g.r.title}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
