/**
 * Generate C2 grammar topics + exercises via gpt-4o.
 *
 * C2 (mastery) topics target the final layer: literary tenses,
 * archaic/very formal constructions, fine syntactic and stylistic
 * distinctions a native university-educated speaker would master.
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
const OUT_DIR = 'tmp/c2-grammar';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface ThemeSpec { slug: string; titleRu: string; titleFr: string; category: string; focus: string }

const THEMES: ThemeSpec[] = [
  { slug: 'c2-subjonctif-imparfait-actif', titleRu: 'Subjonctif imparfait в активном употреблении', titleFr: 'Le subjonctif imparfait à l\'écrit soutenu', category: 'subjonctif', focus: 'Active mastery (not just recognition) of subjonctif imparfait in current literary/journalistic French: full conjugation paradigm of all groups, irregular verbs (eût, fût, prît, vînt, sût), use in formal correspondence, academic essays, news editorials. Distinction from passé simple in form (3rd singular often identical: il fût subj. vs il fut passé simple, accent grave on subj.).' },
  { slug: 'c2-conditionnel-passe-2-actif', titleRu: 'Conditionnel passé 2-я форма — активное использование', titleFr: 'Le conditionnel passé 2e forme à l\'écrit', category: 'conditionnel', focus: 'Active use of conditionnel passé 2e forme (eût été, eût pu, eussent dû): hypothetical past in literary register, "would have" with very formal tone, in si-clauses with double plus-que-parfait du subjonctif, in concessive clauses. Distinction from regular conditionnel passé (aurait été vs eût été).' },
  { slug: 'c2-passe-simple-narration', titleRu: 'Passé simple в литературном повествовании', titleFr: 'Le passé simple dans la narration', category: 'verbes', focus: 'Full active mastery of passé simple — not just recognition but production: all conjugation groups (-er, -ir, -re, irregulars: avoir/être/aller/venir/faire/dire/voir/savoir/pouvoir/vouloir/devoir/prendre/mettre/écrire/lire/naître/mourir/vivre). Use in literary narration (3rd person), historical writing, fairy tales. Contrast with passé composé in oral/written register.' },
  { slug: 'c2-formes-archaiques', titleRu: 'Архаические и литературные формы', titleFr: 'Les formes archaïques et littéraires', category: 'litteraire', focus: 'Recognition + selective use of archaic forms in current literary French: ne dois-je, fût-il, fussiez-vous, eussé-je, point ne, ne saurais (modal restrictive), point + verb (negation without ne). Inversion in archaic style. Vocabulary: nonobstant, hormis, naguère, jadis, céans.' },
  { slug: 'c2-figures-de-style', titleRu: 'Стилистические фигуры и риторика', titleFr: 'Figures de style et rhétorique', category: 'stylistique', focus: 'Active rhetorical mastery: chiasme (Il faut manger pour vivre et non vivre pour manger), oxymore (un silence éloquent), hypallage (un sourire pâle d\'aurore), zeugme, anacoluthe, polyptote, anaphore, épanaphore, prétérition, antithèse, gradation, hyperbole, litote, euphémisme. Recognition AND production in argumentative writing.' },
  { slug: 'c2-nuances-modales', titleRu: 'Тонкие модальные нюансы', titleFr: 'Les nuances modales fines', category: 'verbes', focus: 'Fine distinctions between modal expressions: pouvoir vs savoir vs être à même de vs être en mesure de vs avoir la possibilité de. devoir vs être tenu de vs être censé vs être supposé. il faut que vs il importe que vs il convient que vs il sied de. vouloir vs souhaiter vs désirer vs aspirer à vs convoiter. Used to argue with precision.' },
  { slug: 'c2-concordance-mood-shifts', titleRu: 'Сдвиги наклонения и тонкое согласование', titleFr: 'Les changements de mode et concordance fine', category: 'syntaxe', focus: 'Mood selection in complex contexts: indicatif vs subjonctif after de manière que, de sorte que (intent vs result), après que (officially indicatif, increasingly subj.), il me semble que (indicatif positive vs subj. negative), je ne pense pas que. Subj. or indicatif in relative clauses (un homme qui sait/sache faire ça).' },
  { slug: 'c2-emphase-extreme', titleRu: 'Крайние эмфатические конструкции', titleFr: 'L\'emphase extrême', category: 'syntaxe', focus: 'Strong cleft and emphasis: ce qui… c\'est… que de + inf; ce dont il s\'agit ici, c\'est…; là est tout le problème; tel est…; ainsi en est-il de…; il n\'est pas jusqu\'à… qui ne. Double clefting, inverted clefts. Stylistic effect of each.' },
  { slug: 'c2-ne-expletif-systematique', titleRu: 'Ne explétif — систематическое использование', titleFr: 'Le ne explétif systématique', category: 'syntaxe', focus: 'Mastery of ne explétif: required after avant que (formal), à moins que, de crainte que, de peur que, sans que (some uses), and after main verbs of fear (craindre que ne, redouter que ne) and doubt (douter que ne in negative). Distinction from negative ne. Stylistic register implications.' },
  { slug: 'c2-derivations-lexicales', titleRu: 'Лексические деривации (registre soutenu)', titleFr: 'Dérivations lexicales avancées', category: 'lexique', focus: 'Productive word-formation in C2 register: nominalisation (-ation, -ement, -isation, -ité, -ance), denominal verbs (-iser, -ifier, -er), erudite Greek-Latin prefixes (anti-, dys-, méta-, pré-, hyper-, sub-, ultra-, contre-), suffixes (-âtre pejorative, -on diminutive). Effects on register.' },
];

const TOPIC_SYSTEM_PROMPT = `You are a French grammar pedagogue creating C2-level
content for near-native learners (mastery level). Output JSON with key
"content" containing an array of blocks. Each block is one of:
  { "type": "paragraph", "text": "..." }
  { "type": "table", "title": "...", "headers": ["...", "..."], "rows": [["a","b"], ...] }
  { "type": "example_list", "items": [{ "fr": "...", "ru": "...", "en": "..." }, ...] }

Rules:
- All explanations and table headers in RUSSIAN.
- All French examples MUST use very formal/literary register typical of
  C2 use (academic, editorial, literary).
- 4-7 blocks per topic. Use tables to systematise paradigms / contrasts.
- Examples must include fr, ru AND en. C2 examples should be subtle —
  the kind of sentence a native university-educated speaker would write.
- C2 means MASTERY: be precise about edge cases, register implications,
  and the difference between "grammatically possible" and "stylistically
  current".
- Output ONLY the JSON {"content": [...]}, no prose.`;

const EX_SYSTEM_PROMPT = `You are a French grammar exercise author for C2
mastery learners. Output JSON with key "exercises" containing exactly
10 fill_blank exercises.

Each exercise:
  {
    "type": "fill_blank",
    "question": { "text": "sentence with ___ marking the blank", "blanks": 1 },
    "answer": { "values": ["<one or more accepted answers>"] },
    "explanation": "<Russian 1-2 sentence explanation>"
  }

Rules:
- The text MUST contain "___" (exactly three underscores) at each blank.
- "values" must list every grammatically valid completion.
- Use C2 register: literary/academic/journalistic register, formal
  subjects (philosophy, science, politics, literature).
- Mix straightforward conjugation drills with subtle register choices
  (eg. eût vs aurait, fût vs serait, point ne vs ne… pas).
- Explanations in Russian, focused on the rule + register justification.
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
  const userMsg = `Theme: ${theme.titleFr} (${theme.titleRu})
Focus: ${theme.focus}

Produce 4-7 content blocks teaching this C2 grammar point.`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.35,
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

Produce exactly 10 fill_blank exercises practising this rule. C2 register.`;
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

let orderCounter = 1;
const generated: Array<{ theme: ThemeSpec; topic: TopicResult; exercises: ExResult; orderNum: number }> = [];

for (const theme of THEMES) {
  if (existingSlugs.has(theme.slug)) { console.log(`  skip exists: ${theme.slug}`); orderCounter++; continue; }
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
  generated.push({ theme, topic, exercises, orderNum: orderCounter });
  orderCounter++;
}

console.log(`\n[c2-grammar] ${generated.length} topics ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply to INSERT`); process.exit(0); }

let topicsInserted = 0; let exInserted = 0;
for (const g of generated) {
  const [topic] = await db.insert(grammarTopics).values({
    slug: g.theme.slug,
    titleRu: g.theme.titleRu,
    titleFr: g.theme.titleFr,
    level: 'C2',
    category: g.theme.category,
    orderNum: g.orderNum,
    content: g.topic.content,
  }).returning({ id: grammarTopics.id });
  if (!topic) continue;
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
console.log(`[apply] ${topicsInserted} topics, ${exInserted} exercises`);
process.exit(0);
