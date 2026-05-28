/**
 * Generate C1 reading texts via gpt-4o.
 *
 * Each text: ~450-600 words on a C1-appropriate cultural/societal/
 * scientific topic, with embedded DELF-style multiple-choice questions,
 * AND a wordMap covering every distinct cleaned token in the text.
 *
 * The wordMap is generated in a second pass (after the text) so that we
 * tokenise the actual produced text, not an estimate. For each token we
 * produce { tr (ru), pos, ipa, tr_en } — matching the existing reading
 * text schema.
 *
 * Idempotent: skips slugs already in DB.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { readingTexts, words as wordsTable } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c1-reading';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface Theme { slug: string; title: string; topic: string; focus: string }

const THEMES: Theme[] = [
  { slug: 'c1-mondialisation-culturelle', title: 'La mondialisation culturelle et l\'identité française', topic: 'societe', focus: 'How globalisation reshapes French cultural identity, balance between openness and preservation' },
  { slug: 'c1-bioethique-frontieres', title: 'La bioéthique face aux nouvelles frontières scientifiques', topic: 'science', focus: 'Bioethical debates: CRISPR, AI in medicine, end-of-life policies, organ donation' },
  { slug: 'c1-art-contemporain-marche', title: 'L\'art contemporain et les logiques du marché', topic: 'culture', focus: 'Art market dynamics, speculation, role of biennales, public vs private collections' },
  { slug: 'c1-transition-energetique', title: 'La transition énergétique française : enjeux et arbitrages', topic: 'environnement', focus: 'French energy transition: nuclear, renewables, sobriety, EU coordination' },
  { slug: 'c1-philosophie-temps-present', title: 'La philosophie face au temps présent', topic: 'philosophie', focus: 'Contemporary French philosophy: accelerationism, ecology, post-humanism' },
  { slug: 'c1-litterature-engagee', title: 'La littérature engagée à l\'épreuve du XXIe siècle', topic: 'culture', focus: 'Engaged literature today: Annie Ernaux, Édouard Louis, autobiographical politics' },
  { slug: 'c1-economie-attention', title: 'L\'économie de l\'attention et nos vies numériques', topic: 'societe', focus: 'Attention economy, algorithmic curation, cognitive impact of digital platforms' },
  { slug: 'c1-democratie-deliberative', title: 'La démocratie délibérative : utopie ou avenir ?', topic: 'politique', focus: 'Deliberative democracy: citizen assemblies, climate convention, political theory' },
];

const TEXT_SYSTEM_PROMPT = `You are a French essayist writing C1-level
articles for advanced French learners. Output JSON with keys:
  "contentFr":  string — 450-600 words, French. Use paragraphs separated
                by "\\n\\n". Register: soutenu, journalistic-essayistic.
                Demonstrate C1 vocabulary, complex syntax, varied connectors,
                some subjunctive and conditional constructions.
                Avoid filler, no introductory boilerplate. Get into the topic.
  "estimatedMinutes": integer — reading time at ~150 words/min.
  "questions":  array of EXACTLY 5 DELF-style multiple-choice questions:
    {
      "id":      "q1" ... "q5",
      "question": string — question in French
      "options":  array of 4 strings — answer options in French
      "correct":  string — must match one of the options exactly
      "explanation": string — a short excerpt or paraphrase from the text in French
    }

Question style:
- Test specific claims, contrasts, examples in the text.
- Include at least one inference question.
- Include at least one question about authorial stance or rhetorical strategy.
- Distractors: plausible C1-level alternatives drawn from the topic.
- Output ONLY the JSON object, no prose.`;

const WORDMAP_SYSTEM_PROMPT = `You are a French lexicographer. The user
gives a list of unique French word tokens (lowercased). For EACH token,
output an entry in a JSON object "map" with keys = tokens, values =
{ "tr": "<short Russian translation>", "tr_en": "<short English>",
  "pos": "<noun|verb|adjective|adverb|pronoun|preposition|conjunction|determiner|interjection|number|expression|other>",
  "ipa": "<IPA without slashes>" }.

Rules:
- Translation must fit the most common contextual meaning.
- IPA without slashes, no stress marks, use only standard French IPA.
- Glides: "ui" before vowel → ɥi, "i" before vowel → j, "ou" before vowel → w.
- u in French is /y/ NOT /u/. "tu" is /ty/.
- Nasals: -an/-en/-am → ɑ̃, -in/-im/-ain → ɛ̃, -on/-om → ɔ̃, -un → œ̃.
- For tokens that are clearly conjugated verb forms, pos=verb, tr should be the meaning of that conjugated form.
- For proper nouns, pos="other", tr=same string capitalised.
- Output ONLY the JSON object {"map": {...}}, no prose.`;

interface TextResult {
  contentFr: string;
  estimatedMinutes: number;
  questions: Array<{ id: string; question: string; options: string[]; correct: string; explanation: string }>;
}
interface WordMapEntry { tr: string; tr_en: string; pos: string; ipa: string }

async function genText(theme: Theme): Promise<TextResult> {
  const userMsg = `Theme: ${theme.title}
Topic: ${theme.topic}
Focus: ${theme.focus}

Produce the article and its 5 questions.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.45,
    max_tokens: 2800,
    messages: [
      { role: 'system', content: TEXT_SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as TextResult;
}

const SKIP_RE = /^[\d\s\p{P}]+$/u;
function cleanWord(token: string): string {
  let s = token.toLowerCase();
  s = s.replace(/^["«»'(\[]+|["«»'(\[\.,!?:;)\]]+$/g, '');
  s = s.replace(/^(l|d|qu|m|s|n|j|c|t)['']/, '');
  return s;
}
function tokenize(text: string): Set<string> {
  const set = new Set<string>();
  const tokens = text.split(/\s+/);
  for (const t of tokens) {
    if (!t || SKIP_RE.test(t)) continue;
    const c = cleanWord(t);
    if (!c || SKIP_RE.test(c)) continue;
    set.add(c);
  }
  return set;
}

async function genWordMap(tokens: string[], dbWordIdx: Map<string, { tr: string; ipa: string | null; pos: string }>): Promise<Record<string, WordMapEntry>> {
  // First, harvest free entries from DB
  const result: Record<string, WordMapEntry> = {};
  const todo: string[] = [];
  for (const t of tokens) {
    const hit = dbWordIdx.get(t);
    if (hit) {
      result[t] = { tr: hit.tr, tr_en: '', pos: hit.pos, ipa: hit.ipa ?? '' };
    } else {
      todo.push(t);
    }
  }
  // Batch the rest through AI in chunks of 30
  for (let i = 0; i < todo.length; i += 30) {
    const slice = todo.slice(i, i + 30);
    const userMsg = `Tokens:\n${slice.map((t, j) => `${j + 1}: ${t}`).join('\n')}`;
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2200,
      messages: [
        { role: 'system', content: WORDMAP_SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
    });
    const raw = resp.choices[0]?.message?.content ?? '{}';
    let parsed: { map?: Record<string, WordMapEntry> };
    try { parsed = JSON.parse(raw); } catch { console.warn(`  wordmap batch ${i} JSON parse fail`); continue; }
    if (parsed.map) Object.assign(result, parsed.map);
  }
  return result;
}

const existingSlugs = new Set((await db.select({ slug: readingTexts.slug }).from(readingTexts)).map((r) => r.slug));

// Build DB lookup index
const dbWords = await db.select({ french: wordsTable.french, translation: wordsTable.translation, ipa: wordsTable.ipa, partOfSpeech: wordsTable.partOfSpeech }).from(wordsTable);
const dbWordIdx = new Map<string, { tr: string; ipa: string | null; pos: string }>();
for (const w of dbWords) {
  dbWordIdx.set(w.french.toLowerCase().trim(), { tr: w.translation, ipa: w.ipa, pos: w.partOfSpeech });
}
console.log(`[c1-reading] DB lexicon: ${dbWordIdx.size} entries`);

const generated: Array<{ theme: Theme; text: TextResult; wordMap: Record<string, WordMapEntry> }> = [];

for (const theme of THEMES) {
  if (existingSlugs.has(theme.slug)) { console.log(`  skip (slug exists): ${theme.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let text: TextResult; let wordMap: Record<string, WordMapEntry>;
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    text = cached.text; wordMap = cached.wordMap;
    console.log(`  cache: ${theme.slug} (${text.contentFr.split(/\s+/).length}w, wm=${Object.keys(wordMap).length})`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    text = await genText(theme);
    const tokens = [...tokenize(text.contentFr)];
    console.log(`    text: ${text.contentFr.split(/\s+/).length}w, unique tokens: ${tokens.length}`);
    wordMap = await genWordMap(tokens, dbWordIdx);
    writeFileSync(cacheFile, JSON.stringify({ text, wordMap }, null, 2));
    console.log(`    wordMap: ${Object.keys(wordMap).length} entries`);
  }
  generated.push({ theme, text, wordMap });
}

console.log(`\n[c1-reading] ${generated.length} ready`);

if (!APPLY) {
  console.log(`[dry-run] pass --apply to INSERT ${generated.length} reading texts`);
  process.exit(0);
}

let inserted = 0;
for (const g of generated) {
  try {
    await db.insert(readingTexts).values({
      slug: g.theme.slug,
      title: g.theme.title,
      level: 'C1',
      topic: g.theme.topic,
      contentFr: g.text.contentFr,
      wordMap: g.wordMap,
      questions: g.text.questions,
      estimatedMinutes: g.text.estimatedMinutes,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${g.theme.slug}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
