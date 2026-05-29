/**
 * Generate C1 grammar topics + exercises via gpt-4o.
 *
 * For each of 15 C1 themes:
 *   - Build a grammar topic with content blocks (paragraph, table,
 *     example_list) in the same JSON shape as B2 topics.
 *   - Generate 10 fill_blank exercises (the dominant type in the DB),
 *     each with explanation in Russian.
 *
 * Idempotent: skips topics whose slug already exists in DB.
 *
 * Cost: ~$0.30-0.50 total (gpt-4o for topic content, gpt-4o-mini for
 * exercises).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { db } from '../db/index.js';
import { grammarTopics, grammarExercises } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c1-grammar';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface ThemeSpec {
  slug: string;
  titleRu: string;
  titleFr: string;
  category: string;
  focus: string;
}

const THEMES: ThemeSpec[] = [
  { slug: 'c1-subjonctif-passe-concordance', titleRu: 'Subjonctif passé и согласование времён', titleFr: 'Le subjonctif passé et la concordance', category: 'subjonctif', focus: 'Subjonctif passé to express anteriority in subjunctive contexts. Distinction: subj. présent vs subj. passé. Rules of concordance: indicative main → subjunctive past for anterior action. Frequent verbs and constructions (regretter que, douter que, il est possible que).' },
  { slug: 'c1-subjonctif-imparfait-litteraire', titleRu: 'Subjonctif imparfait и plus-que-parfait (литературные)', titleFr: 'Le subjonctif imparfait et plus-que-parfait', category: 'subjonctif', focus: 'Literary tenses subjonctif imparfait and plus-que-parfait. Their formation, recognition in formal/literary texts. Why modern French replaces them with subj. présent/passé. Examples from classical literature.' },
  { slug: 'c1-conditionnel-passe-2', titleRu: 'Conditionnel passé 2-я форма (литературная)', titleFr: 'Le conditionnel passé deuxième forme', category: 'conditionnel', focus: 'Literary form identical to subj. plus-que-parfait: "eût été" instead of "aurait été". Recognition in formal writing. Si-clauses with both clauses in plus-que-parfait subjunctive.' },
  { slug: 'c1-passive-avancee', titleRu: 'Сложные пассивные конструкции', titleFr: 'Les constructions passives avancées', category: 'voix', focus: 'Pronominal passive (se construire), impersonal passive (il est question de), on-construction. When to choose each. Stylistic register implications.' },
  { slug: 'c1-double-pronominalisation', titleRu: 'Двойное местоимение и порядок', titleFr: 'La double pronominalisation', category: 'pronoms', focus: 'Combined object pronouns: le lui, la lui, les leur, y en, m en, le y, etc. Order rules. Cases of impossibility ("le lui" yes but "le me" no — use moi). Imperative inversions.' },
  { slug: 'c1-mise-en-relief', titleRu: 'Эмфатические конструкции', titleFr: 'La mise en relief', category: 'syntaxe', focus: 'Cleft sentences: c\'est… qui/que/dont/où, ce qui… c\'est, ce dont… c\'est. Topicalisation. Reduplication. Stylistic effect.' },
  { slug: 'c1-discours-indirect-avance', titleRu: 'Косвенная речь — продвинутый уровень', titleFr: 'Le discours indirect avancé', category: 'syntaxe', focus: 'Indirect questions (si, ce qui, ce que, où, comment, quand, pourquoi). Reporting hypotheses (Il a supposé que… aurait). Reporting orders + de + infinitif. Time marker shifts in past reporting.' },
  { slug: 'c1-participe-present-gerondif', titleRu: 'Participe présent, gérondif и отглагольное прилагательное', titleFr: 'Participe présent, gérondif, adjectif verbal', category: 'verbes', focus: 'Three forms ending in -ant: distinguishing function. Participe présent (invariable, verbal force). Gérondif (en + part. présent, manner/simultaneity). Adjectif verbal (agreement, adjectival). Spelling differences (fatigant/fatiguant).' },
  { slug: 'c1-negation-complexe', titleRu: 'Сложные формы отрицания', titleFr: 'La négation complexe', category: 'syntaxe', focus: 'ne… que (restrictive), ni… ni…, ne… aucun(e), ne… nul(le), ne explétif (after craindre, avant que, à moins que). When ne alone (formal). Double negation effects.' },
  { slug: 'c1-connecteurs-formels', titleRu: 'Формальные коннекторы (причина, следствие, уступка)', titleFr: 'Les connecteurs logiques formels', category: 'connecteurs', focus: 'Cause: étant donné que, dans la mesure où, du fait que. Consequence: si bien que, de sorte que, à tel point que. Concession: quoique, encore que, bien que, fût-ce. Opposition: tandis que, alors que.' },
  { slug: 'c1-inversion-stylistique', titleRu: 'Стилистическая инверсия', titleFr: 'L\'inversion stylistique', category: 'syntaxe', focus: 'Subject-verb inversion in formal/literary contexts: after peut-être, sans doute, ainsi, encore. After relative pronouns in formal writing. After certain adverbs of place/time. NOT inversion in oral French.' },
  { slug: 'c1-regimes-verbes', titleRu: 'Глагольные режимы (à / de / direct)', titleFr: 'Les régimes verbaux', category: 'verbes', focus: 'Verb + à + infinitif (s\'attendre à, parvenir à, hésiter à). Verb + de + infinitif (essayer de, refuser de, s\'agir de). Direct infinitif (laisser, faire, oser, savoir). Differences for verbs that take both (commencer à/de, finir par).' },
  { slug: 'c1-concordance-subjonctif-soutenu', titleRu: 'Согласование времён в subjonctif (формальный регистр)', titleFr: 'La concordance des temps au subjonctif (registre soutenu)', category: 'subjonctif', focus: 'Strict literary concordance: main verb in passé → subj. imparfait/plus-que-parfait. Modern usage: subj. présent/passé replace. Recognition tables for advanced readers.' },
  { slug: 'c1-prepositions-relatif', titleRu: 'Предлоги с относительными местоимениями', titleFr: 'Les prépositions avec les pronoms relatifs', category: 'pronoms', focus: 'auquel, duquel, lequel after prepositions. dont vs de qui vs duquel (when each is preferred). avec lequel, sur lequel, pour qui, à qui. Complex relative clauses with prepositional verbs (parler de, dépendre de).' },
  { slug: 'c1-style-indirect-libre', titleRu: 'Несобственно-прямая речь', titleFr: 'Le style indirect libre', category: 'narration', focus: 'Free indirect discourse in literary narration: imparfait + 3rd person + retained question marks/exclamations. Recognition in Flaubert, Maupassant style. Difference from direct and indirect speech. Used in modern journalism too.' },
  { slug: 'c1-cause-consequence-formelles', titleRu: 'Причина и следствие — формальный регистр', titleFr: 'Cause et conséquence au registre formel', category: 'connecteurs', focus: 'Formal cause/consequence constructions: en raison de, à cause de (negative), grâce à (positive), du fait que, étant donné que, sous prétexte que. Consequence: si bien que, de sorte que, tellement … que, à tel point que, c\'est pourquoi. Stylistic differences vs causal subjonctif.' },
  { slug: 'c1-accord-participe-passe-pronominal', titleRu: 'Согласование participe passé с pronominaux', titleFr: 'L\'accord du participe passé des verbes pronominaux', category: 'verbes', focus: 'Pronominal verb participle agreement: verbes essentiellement pronominaux (s\'évanouir → agree with subject), verbes accidentellement pronominaux with direct object (elle s\'est lavée vs elle s\'est lavé les mains). Reciprocity (ils se sont parlé — no agreement, indirect). Tricky cases: se rendre compte.' },
  { slug: 'c1-pronoms-y-en-avances', titleRu: 'Местоимения en и y — продвинутое использование', titleFr: 'Les pronoms en et y au niveau avancé', category: 'pronoms', focus: 'Beyond basics: en replacing de + abstract (s\'en occuper, en avoir besoin, ne pas en revenir, s\'en sortir). y replacing à + abstract (penser à → y penser, tenir à → y tenir, s\'attendre à → s\'y attendre). en/y in idiomatic verbs without antecedent (en vouloir à, y aller, s\'en aller).' },
  { slug: 'c1-verbes-impersonnels', titleRu: 'Безличные конструкции', titleFr: 'Les constructions impersonnelles', category: 'syntaxe', focus: 'Impersonal constructions: il s\'agit de, il convient de, il importe que, il s\'avère que, il en va de, il va de soi que. Distinction il y a vs il existe (formal). Impersonal passives (il est question de, il en est résulté). Mood selection after impersonal phrases.' },
];

const TOPIC_SYSTEM_PROMPT = `You are a French grammar pedagogue creating C1-level
content for advanced learners. Output JSON with key "content" containing
an array of blocks. Each block is one of:
  { "type": "paragraph", "text": "..." }
  { "type": "table", "title": "...", "headers": ["...", "..."], "rows": [["a","b"], ...] }
  { "type": "example_list", "items": [{ "fr": "...", "ru": "...", "en": "..." }, ...] }

Rules:
- All explanations and table headers in RUSSIAN (the user's mother tongue).
- All French examples must use natural, modern French (or note when literary).
- 4-7 blocks per topic: typically 1-2 paragraphs, 1-3 tables, 1 example_list (5-8 items).
- Tables should illustrate forms, contrasts, or shift patterns.
- Examples must always include fr, ru, AND en keys.
- Be concise: a C1 learner doesn't need over-explanation.
- Output ONLY the JSON object {"content": [...]}, no prose.`;

const EX_SYSTEM_PROMPT = `You are a French grammar exercise author for C1 learners.
Output JSON with key "exercises" containing exactly 10 fill_blank exercises.

Each exercise:
  {
    "type": "fill_blank",
    "question": { "text": "sentence with ___ marking the blank", "blanks": 1 },
    "answer": { "values": ["<one or more accepted answers>"] },
    "explanation": "<Russian 1-2 sentence explanation>"
  }

Rules:
- The text MUST contain "___" (exactly three underscores) at each blank position.
- The values array must list every grammatically valid completion.
- Cover varied verbs, persons, and contexts within the topic.
- Examples should be realistic, often formal/literary register at C1.
- Explanation in RUSSIAN, focused on the grammatical rule applied.
- Output ONLY the JSON object {"exercises": [...]}, no prose.`;

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
  const userMsg = `Theme: ${theme.titleFr} (${theme.titleRu})
Focus: ${theme.focus}

Produce 4-7 content blocks teaching this C1 grammar point.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 2500,
    messages: [
      { role: 'system', content: TOPIC_SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as TopicResult;
}

async function genExercises(theme: ThemeSpec): Promise<ExResult> {
  const userMsg = `Theme: ${theme.titleFr}
Focus: ${theme.focus}

Produce exactly 10 fill_blank exercises practising this rule. Vary
contexts and verbs. Use C1 register.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.5,
    max_tokens: 2200,
    messages: [
      { role: 'system', content: EX_SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
  });
  const raw = resp.choices[0]?.message?.content ?? '{}';
  return JSON.parse(raw) as ExResult;
}

const existing = await db.select({ slug: grammarTopics.slug }).from(grammarTopics);
const existingSlugs = new Set(existing.map((e) => e.slug));
console.log(`[c1-grammar] ${existingSlugs.size} existing topics, generating C1 batch`);

// Determine order number start
const allC1Order = 1;
let orderCounter = allC1Order;

const generated: Array<{ theme: ThemeSpec; topic: TopicResult; exercises: ExResult; orderNum: number }> = [];

for (const theme of THEMES) {
  if (existingSlugs.has(theme.slug)) {
    console.log(`  skip (already exists): ${theme.slug}`);
    orderCounter++;
    continue;
  }
  const cacheFile = `${OUT_DIR}/${theme.slug}.json`;
  let topic: TopicResult; let exercises: ExResult;
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    topic = cached.topic; exercises = cached.exercises;
    console.log(`  cache: ${theme.slug} (${topic.content.length} blocks, ${exercises.exercises.length} ex)`);
  } else {
    console.log(`  gen: ${theme.slug}…`);
    topic = await genTopic(theme);
    exercises = await genExercises(theme);
    writeFileSync(cacheFile, JSON.stringify({ topic, exercises }, null, 2));
    console.log(`    → ${topic.content.length} blocks, ${exercises.exercises.length} ex`);
  }
  generated.push({ theme, topic, exercises, orderNum: orderCounter });
  orderCounter++;
}

console.log(`\n[c1-grammar] ${generated.length} topics ready`);

if (!APPLY) {
  console.log(`[dry-run] pass --apply to INSERT ${generated.length} topics + ${generated.reduce((s, g) => s + g.exercises.exercises.length, 0)} exercises`);
  process.exit(0);
}

console.log(`[apply] inserting topics + exercises…`);
let topicsInserted = 0; let exInserted = 0;
for (const g of generated) {
  const [topic] = await db.insert(grammarTopics).values({
    slug: g.theme.slug,
    titleRu: g.theme.titleRu,
    titleFr: g.theme.titleFr,
    level: 'C1',
    category: g.theme.category,
    orderNum: g.orderNum,
    content: g.topic.content,
  }).returning({ id: grammarTopics.id });
  if (!topic) { console.warn(`  failed to insert topic: ${g.theme.slug}`); continue; }
  topicsInserted++;
  for (const ex of g.exercises.exercises) {
    try {
      await db.insert(grammarExercises).values({
        topicId: topic.id,
        type: ex.type,
        question: ex.question,
        answer: ex.answer,
        explanation: ex.explanation,
      });
      exInserted++;
    } catch (err) {
      console.warn(`    ex failed: ${(err as Error).message}`);
    }
  }
}
console.log(`[apply] done — ${topicsInserted} topics, ${exInserted} exercises`);
process.exit(0);
