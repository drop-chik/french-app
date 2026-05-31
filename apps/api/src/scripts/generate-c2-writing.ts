/**
 * C2 writing prompts — 7 prompts covering essay, narrative, formal
 * letter, blog article, description (literary), email (high register).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { writingPrompts } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c2-writing';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

type WritingType = 'essay' | 'letter_formal' | 'letter_informal' | 'blog_article' | 'narrative' | 'description' | 'email';

interface PromptSpec { slug: string; type: WritingType; focus: string; minWords: number; maxWords: number }

const SPECS: PromptSpec[] = [
  { slug: 'c2-essay-language-thought', type: 'essay', focus: 'Philosophical essay: does language shape thought? Address Sapir-Whorf, cognitive science evidence, counterarguments. Expected: thesis, dialectical structure, philosophical references, formal register.', minWords: 400, maxWords: 600 },
  { slug: 'c2-essay-art-criticism', type: 'essay', focus: 'Critical essay on contemporary art: must it be politically engaged to be relevant? Aesthetic autonomy vs social function. References to art-historical positions.', minWords: 400, maxWords: 600 },
  { slug: 'c2-essay-democracy-crisis', type: 'essay', focus: 'Essay on the crisis of representative democracy in the digital era. Diagnoses + proposals. References to Habermas, Rancière, deliberative theory.', minWords: 400, maxWords: 600 },
  { slug: 'c2-letter-formal-petition', type: 'letter_formal', focus: 'Formal open letter to a head of state on a question of public ethics (climate, immigration, education). Extremely formal register, structured argumentation, rhetorical figures.', minWords: 350, maxWords: 500 },
  { slug: 'c2-blog-article-cultural-critique', type: 'blog_article', focus: 'Long-form blog article: a personal cultural critique with a clear thesis (e.g. the cult of productivity, the aesthetics of nostalgia, attention economy). C2 stylistic mastery expected.', minWords: 350, maxWords: 550 },
  { slug: 'c2-narrative-memoire', type: 'narrative', focus: 'Literary first-person narrative — a recovered memory that reframes the narrator\'s self-understanding. Use passé simple, imparfait, plus-que-parfait; subtle introspection; sensory detail.', minWords: 350, maxWords: 550 },
  { slug: 'c2-description-paysage-introspectif', type: 'description', focus: 'Lyrical description of a landscape that mirrors an inner state. Literary register, full sensory palette, rhetorical figures (métaphore filée, gradation).', minWords: 280, maxWords: 450 },
];

const SYSTEM_PROMPT = `You design C2-mastery French writing prompts. For
each brief, output JSON:
  "titleRu":/"titleEn": short titles
  "promptRu"/"promptEn"/"promptFr": the writing task (2-4 sentences)
  "tipsRu"/"tipsEn": array of 4 concrete tips (vocab cues, grammar/style
                    targets, rhetorical moves)
  "requiredElements": array of 4-6 snake_case tokens for grader checks
                    (e.g. "thesis", "dialectical_structure", "passé_simple",
                    "rhetorical_figures", "literary_register")

Output ONLY the JSON.`;

interface GenResult {
  titleRu: string; titleEn: string;
  promptRu: string; promptEn: string; promptFr: string;
  tipsRu: string[]; tipsEn: string[];
  requiredElements: string[];
}

async function gen(spec: PromptSpec): Promise<GenResult> {
  const userMsg = `Type: ${spec.type}\nFocus: ${spec.focus}\nWord range: ${spec.minWords}-${spec.maxWords}.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 1800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? '{}') as GenResult;
}

const existing = new Set((await db.select({ slug: writingPrompts.slug }).from(writingPrompts)).map((r) => r.slug));
const all: Array<{ spec: PromptSpec; r: GenResult }> = [];
for (const spec of SPECS) {
  if (existing.has(spec.slug)) { console.log(`  skip exists: ${spec.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${spec.slug}.json`;
  let r: GenResult;
  if (existsSync(cacheFile)) {
    r = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${spec.slug}`);
  } else {
    console.log(`  gen: ${spec.slug}…`);
    r = await gen(spec);
    writeFileSync(cacheFile, JSON.stringify(r, null, 2));
  }
  all.push({ spec, r });
}

console.log(`\n[c2-writing] ${all.length} ready`);
if (!APPLY) { console.log(`[dry-run]`); process.exit(0); }

let inserted = 0;
for (const { spec, r } of all) {
  try {
    await db.insert(writingPrompts).values({
      slug: spec.slug,
      titleRu: r.titleRu, titleEn: r.titleEn,
      level: 'C2', writingType: spec.type,
      promptRu: r.promptRu, promptEn: r.promptEn, promptFr: r.promptFr,
      tipsRu: r.tipsRu, tipsEn: r.tipsEn,
      minWords: spec.minWords, maxWords: spec.maxWords,
      requiredElements: r.requiredElements,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${spec.slug}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
