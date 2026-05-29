/**
 * Generate C1 writing prompts via gpt-4o.
 *
 * 9 prompts mirroring the B2 coverage but at C1 register:
 *   - 3 essays (essay), 1 letter_formal, 1 blog_article,
 *   - 1 narrative, 1 description, 1 email, 1 letter_informal
 *
 * Each prompt: titleRu/En, promptRu/En/Fr, tipsRu/En, minWords/maxWords,
 * requiredElements.
 *
 * Idempotent: skips slugs already in DB.
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
const OUT_DIR = 'tmp/c1-writing';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

type WritingType = 'essay' | 'letter_formal' | 'letter_informal' | 'blog_article' | 'narrative' | 'description' | 'email';

interface PromptSpec {
  slug: string;
  type: WritingType;
  focus: string;
  minWords: number;
  maxWords: number;
}

const SPECS: PromptSpec[] = [
  { slug: 'c1-essay-ia-societe', type: 'essay', focus: 'Whether artificial intelligence will fundamentally transform French society. Dialectical structure expected.', minWords: 300, maxWords: 500 },
  { slug: 'c1-essay-langue-mondialisation', type: 'essay', focus: 'Should French defend itself against globalised English vocabulary? Cultural and economic angles.', minWords: 300, maxWords: 500 },
  { slug: 'c1-essay-art-engagement', type: 'essay', focus: 'Must contemporary art be politically committed to be valuable? Aesthetic vs ethical dimensions.', minWords: 300, maxWords: 500 },
  { slug: 'c1-letter-formal-tribune', type: 'letter_formal', focus: 'Open letter to a national newspaper protesting a controversial reform (education, climate or labour). Register: very formal, argued, structured.', minWords: 250, maxWords: 400 },
  { slug: 'c1-blog-article-numerique', type: 'blog_article', focus: 'A reflective blog article on how digital platforms reshape our relationship with knowledge and authority.', minWords: 280, maxWords: 450 },
  { slug: 'c1-narrative-rencontre', type: 'narrative', focus: 'A literary first-person narrative about an unexpected encounter that changed the narrator\'s view of a person they thought they knew. Use varied tenses including passé simple.', minWords: 280, maxWords: 450 },
  { slug: 'c1-description-ville-vue', type: 'description', focus: 'A descriptive piece evoking a French city at dawn, blending sensory details and the narrator\'s inner reflection. Literary register.', minWords: 200, maxWords: 350 },
  { slug: 'c1-email-professionnel-conflit', type: 'email', focus: 'A professional email diplomatically addressing a workplace conflict and proposing a structured resolution. Formal corporate register.', minWords: 200, maxWords: 350 },
  { slug: 'c1-letter-informal-debat-ami', type: 'letter_informal', focus: 'A long letter to a close friend continuing a recent debate about whether to remain in their hometown or move abroad. Reflective, intimate, but elaborate argumentation.', minWords: 250, maxWords: 400 },
];

const SYSTEM_PROMPT = `You are a C1-level French writing curriculum designer. For
each prompt brief the user gives, output a JSON object with:
  "titleRu":         string — short Russian title (≤80 chars)
  "titleEn":         string — short English title (≤80 chars)
  "promptRu":        string — the writing task in Russian, 2-4 sentences
  "promptEn":        string — same task in English
  "promptFr":        string — same task in French (the prompt students see)
  "tipsRu":          array of 4 short tips in Russian (vocabulary cues, structural
                     advice, target grammar — like the B2 examples)
  "tipsEn":          array of 4 short tips in English (paired with the Russian)
  "requiredElements": array of 4-6 short snake_case tokens describing what the
                     grader checks (e.g. "thesis", "counterargument", "passé_simple")

Rules:
- Output ONLY the JSON object, no prose.
- All Russian must be natural and idiomatic.
- The French prompt must use C1 register (formal, structured task).
- Tips should be concrete, actionable — vocabulary domains, grammar forms,
  rhetorical moves.`;

interface GenResult {
  titleRu: string; titleEn: string;
  promptRu: string; promptEn: string; promptFr: string;
  tipsRu: string[]; tipsEn: string[];
  requiredElements: string[];
}

async function gen(spec: PromptSpec): Promise<GenResult> {
  const userMsg = `Type: ${spec.type}
Focus: ${spec.focus}
Word range: ${spec.minWords}-${spec.maxWords} mots.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.45,
    max_tokens: 1800,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as GenResult;
}

const existing = await db.select({ slug: writingPrompts.slug }).from(writingPrompts);
const existingSlugs = new Set(existing.map((e) => e.slug));

const all: Array<{ spec: PromptSpec; r: GenResult }> = [];
for (const spec of SPECS) {
  if (existingSlugs.has(spec.slug)) { console.log(`  skip exists: ${spec.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${spec.slug}.json`;
  let r: GenResult;
  if (existsSync(cacheFile)) {
    r = JSON.parse(readFileSync(cacheFile, 'utf8'));
    console.log(`  cache: ${spec.slug}`);
  } else {
    console.log(`  gen: ${spec.slug} (${spec.type})…`);
    r = await gen(spec);
    writeFileSync(cacheFile, JSON.stringify(r, null, 2));
  }
  all.push({ spec, r });
}

console.log(`\n[c1-writing] ${all.length} ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply to INSERT`); process.exit(0); }

let inserted = 0;
for (const { spec, r } of all) {
  try {
    await db.insert(writingPrompts).values({
      slug: spec.slug,
      titleRu: r.titleRu,
      titleEn: r.titleEn,
      level: 'C1',
      writingType: spec.type,
      promptRu: r.promptRu,
      promptEn: r.promptEn,
      promptFr: r.promptFr,
      tipsRu: r.tipsRu,
      tipsEn: r.tipsEn,
      minWords: spec.minWords,
      maxWords: spec.maxWords,
      requiredElements: r.requiredElements,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${spec.slug}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
