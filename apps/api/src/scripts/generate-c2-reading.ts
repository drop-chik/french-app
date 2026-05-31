/**
 * Generate C2 reading texts via gpt-4o.
 * Literary/academic register, 500-700 words, with DELF-style questions
 * + a full wordMap.
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { readingTexts, words as wordsTable } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c2-reading';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface Theme { slug: string; title: string; topic: string; focus: string }

const THEMES: Theme[] = [
  { slug: 'c2-philosophie-langage-pensee', title: 'Langage et pensée : un héritage philosophique', topic: 'philosophie', focus: 'Philosophical essay on language structuring thought, from Saussure to Sapir-Whorf to current cognitive science. C2 academic register, complex syntax.' },
  { slug: 'c2-litterature-modernite-rupture', title: 'La modernité littéraire et ses ruptures', topic: 'culture', focus: 'Literary criticism on modernism breaking with realist tradition: Proust, Joyce, Woolf, the nouveau roman. References to specific works, theoretical implications.' },
  { slug: 'c2-economie-politique-piketty', title: 'Économie politique : retour sur l\'œuvre de Piketty', topic: 'economie', focus: 'Critical essay on Piketty\'s analysis of capital accumulation, methodological strengths, controversies, ideological reading.' },
  { slug: 'c2-bioethique-vivant', title: 'Bioéthique : les frontières du vivant', topic: 'science', focus: 'Bioethical reflection on the boundaries of life — gene editing, end-of-life decisions, post-humanism. Philosophical and legal angles, references to Kant, Levinas, Habermas.' },
  { slug: 'c2-art-conceptuel-marche', title: 'L\'art conceptuel et son rapport au marché', topic: 'culture', focus: 'Art criticism on conceptual art\'s paradoxical relationship to the art market, Duchamp\'s legacy, contemporary speculation, institutional critique.' },
  { slug: 'c2-societe-individualisme-democratie', title: 'Individualisme contemporain et démocratie', topic: 'societe', focus: 'Sociopolitical essay on tensions between contemporary individualism and democratic participation, from Tocqueville to Lipovetsky.' },
  { slug: 'c2-langue-evolution-academie', title: 'L\'évolution de la langue française : entre usage et norme', topic: 'societe', focus: 'Linguistic essay on prescriptivism vs descriptivism, the role of the Académie française, anglicismes, écriture inclusive, generational shifts.' },
];

const TEXT_SYSTEM_PROMPT = `You are a French essayist writing C2-mastery
articles (academic / literary register).

Output JSON with keys:
  "contentFr":        500-700 words, French, paragraphs separated by "\\n\\n".
                      Register: very formal, literary, with subjonctif,
                      conditionnel, complex relative clauses, formal
                      connectors (étant donné que, à l\'aune de, au demeurant).
                      Avoid filler; substantial analytical content.
  "estimatedMinutes": integer (~150 wpm).
  "questions":        exactly 5 DELF-style MC questions:
    { "id":"q1"…"q5", "question": str, "options":[4 str], "correct": str, "explanation": str }
- 2 inference / stance questions, 1 stylistic device question.
- Output ONLY the JSON, no prose.`;

const WORDMAP_SYSTEM_PROMPT = `You are a French lexicographer. Output JSON
"map" mapping each lowercased French token to:
  { "tr": "<Russian translation>", "tr_en": "<English>",
    "pos": "<noun|verb|adjective|...|expression|other>",
    "ipa": "<IPA without slashes>" }

Rules:
- IPA: no slashes/stress marks; "u" → /y/; "ui" before vowel → ɥi;
  -tion → sjɔ̃; nasals: an/en → ɑ̃, in/im/ain → ɛ̃, on/om → ɔ̃, un → œ̃.
- For proper nouns pos="other", tr=capitalised source.
- Output ONLY {"map": {...}}.`;

interface TextResult {
  contentFr: string; estimatedMinutes: number;
  questions: Array<{ id: string; question: string; options: string[]; correct: string; explanation: string }>;
}
interface WordMapEntry { tr: string; tr_en: string; pos: string; ipa: string }

async function genText(theme: Theme): Promise<TextResult> {
  const userMsg = `Theme: ${theme.title}\nTopic: ${theme.topic}\nFocus: ${theme.focus}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 3200,
    messages: [
      { role: 'system', content: TEXT_SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  return JSON.parse(resp.choices[0]?.message?.content ?? '{}') as TextResult;
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
  for (const t of text.split(/\s+/)) {
    if (!t || SKIP_RE.test(t)) continue;
    const c = cleanWord(t);
    if (c && !SKIP_RE.test(c)) set.add(c);
  }
  return set;
}

async function genWordMap(tokens: string[], dbIdx: Map<string, { tr: string; ipa: string | null; pos: string }>): Promise<Record<string, WordMapEntry>> {
  const result: Record<string, WordMapEntry> = {};
  const todo: string[] = [];
  for (const t of tokens) {
    const hit = dbIdx.get(t);
    if (hit) result[t] = { tr: hit.tr, tr_en: '', pos: hit.pos, ipa: hit.ipa ?? '' };
    else todo.push(t);
  }
  for (let i = 0; i < todo.length; i += 30) {
    const slice = todo.slice(i, i + 30);
    const userMsg = `Tokens:\n${slice.map((t, j) => `${j + 1}: ${t}`).join('\n')}`;
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2400,
        messages: [
          { role: 'system', content: WORDMAP_SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as { map?: Record<string, WordMapEntry> };
      if (parsed.map) Object.assign(result, parsed.map);
    } catch {}
  }
  return result;
}

const existing = new Set((await db.select({ slug: readingTexts.slug }).from(readingTexts)).map((r) => r.slug));

const dbWords = await db.select({ french: wordsTable.french, translation: wordsTable.translation, ipa: wordsTable.ipa, partOfSpeech: wordsTable.partOfSpeech }).from(wordsTable);
const dbIdx = new Map<string, { tr: string; ipa: string | null; pos: string }>();
for (const w of dbWords) dbIdx.set(w.french.toLowerCase().trim(), { tr: w.translation, ipa: w.ipa, pos: w.partOfSpeech });
console.log(`[c2-reading] DB lexicon: ${dbIdx.size}`);

const generated: Array<{ theme: Theme; text: TextResult; wordMap: Record<string, WordMapEntry> }> = [];
for (const theme of THEMES) {
  if (existing.has(theme.slug)) { console.log(`  skip exists: ${theme.slug}`); continue; }
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let text: TextResult; let wordMap: Record<string, WordMapEntry>;
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    text = cached.text; wordMap = cached.wordMap;
    console.log(`  cache: ${theme.slug}`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    text = await genText(theme);
    const tokens = [...tokenize(text.contentFr)];
    console.log(`    text=${text.contentFr.split(/\s+/).length}w, tokens=${tokens.length}`);
    wordMap = await genWordMap(tokens, dbIdx);
    writeFileSync(cacheFile, JSON.stringify({ text, wordMap }, null, 2));
    console.log(`    wordMap=${Object.keys(wordMap).length}`);
  }
  generated.push({ theme, text, wordMap });
}

console.log(`\n[c2-reading] ${generated.length} ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply`); process.exit(0); }

let inserted = 0;
for (const g of generated) {
  try {
    await db.insert(readingTexts).values({
      slug: g.theme.slug, title: g.theme.title, level: 'C2', topic: g.theme.topic,
      contentFr: g.text.contentFr, wordMap: g.wordMap, questions: g.text.questions,
      estimatedMinutes: g.text.estimatedMinutes,
    });
    inserted++;
  } catch (err) {
    console.warn(`  failed ${g.theme.slug}: ${(err as Error).message}`);
  }
}
console.log(`[apply] inserted ${inserted}`);
process.exit(0);
