/**
 * Expansion pack of drill sets covering the most popular / commonly
 * problematic CEFR topics that are currently under-served in our DB.
 *
 * As of audit on 2026-05-31:
 *   A1: 7 sets → +4 (basic conjugation, articles, negation, futur proche)
 *   A2: 11 → +3 (accord PP avec COD, démonstratifs, imparfait drills)
 *   B1: 11 → +3 (pronoms relatifs simples, subj vs ind, futur antérieur)
 *   B2: 2  → +5 (B2 was severely under-served — conditionnel passé,
 *               faire causatif, mise en relief, discours indirect au
 *               passé, pronoms relatifs composés in B2 register)
 *   C1: 4  → +2 (inversion stylistique, régimes verbaux)
 *   C2: 3  → +2 (formes archaïques, nuances modales)
 *
 * Total: +19 drill sets, ~25 questions each → ~475 new exercises.
 * Cost: ~$3 (gpt-4o-mini).
 *
 * Idempotent: skips slugs that already exist in DB.
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
const OUT_DIR = 'tmp/drills-expansion';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface DrillSpec {
  slug: string;
  titleRu: string;
  titleEn: string;
  descriptionRu: string;
  descriptionEn: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  category: string;
  difficulty: number;
  questionCount: number;
  icon: string;
  focus: string;
}

const SPECS: DrillSpec[] = [
  // ── A1 (+4) ─────────────────────────────────────────────────────────
  {
    slug: 'pronoms-personnels-sujets-a1',
    titleRu: 'Личные местоимения — подлежащее',
    titleEn: 'Subject pronouns',
    descriptionRu: 'Выберите правильное личное местоимение (je, tu, il, elle, on, nous, vous, ils, elles) для подлежащего.',
    descriptionEn: 'Pick the correct subject pronoun for each context.',
    level: 'A1', category: 'pronoms', difficulty: 1, questionCount: 25, icon: 'Brain',
    focus: 'A1 subject pronoun choice: je/tu/il/elle/on/nous/vous/ils/elles based on context (gender, number, formal/informal). Include vouvoiement (vous polite singular) vs tutoiement (tu informal singular). On for "we"/general. Distractor: wrong number/gender.',
  },
  {
    slug: 'er-verbs-present-a1',
    titleRu: '-er глаголы в présent — спряжение',
    titleEn: '-er verbs present tense',
    descriptionRu: 'Спрягите регулярные -er глаголы первой группы во всех лицах (parler, aimer, manger, habiter, travailler).',
    descriptionEn: 'Conjugate regular -er verbs in all persons.',
    level: 'A1', category: 'verbes', difficulty: 2, questionCount: 25, icon: 'Clock',
    focus: 'Regular -er verb conjugation in présent: parler, aimer, manger (mange/mangeons), commencer (commence/commençons), habiter, écouter, regarder, travailler. Endings -e/-es/-e/-ons/-ez/-ent. Include manger-type with -geons and commencer-type with -çons.',
  },
  {
    slug: 'futur-proche-a1',
    titleRu: 'Futur proche — ближайшее будущее',
    titleEn: 'Futur proche (near future)',
    descriptionRu: 'Постройте ближайшее будущее: aller (présent) + инфинитив. Спрягите aller правильно.',
    descriptionEn: 'Build the near future: aller in present + infinitive.',
    level: 'A1', category: 'verbes', difficulty: 2, questionCount: 25, icon: 'Sparkles',
    focus: 'Futur proche construction: aller (vais/vas/va/allons/allez/vont) + infinitive. Time markers: bientôt, demain, ce soir, dans une heure, tout à l\'heure. Negation: ne va pas + inf (NOT ne va pas aller).',
  },
  {
    slug: 'negation-base-a1',
    titleRu: 'Отрицание ne…pas — базовое',
    titleEn: 'Basic negation ne…pas',
    descriptionRu: 'Постройте отрицание: ne (или n\') + глагол + pas. С артиклями de вместо du/de la/des в отрицаниях.',
    descriptionEn: 'Build basic negation: ne + verb + pas; de replaces du/de la/des in negative.',
    level: 'A1', category: 'grammaire', difficulty: 2, questionCount: 25, icon: 'Timer',
    focus: 'Negation ne…pas: position (around the conjugated verb), n\' before vowel, with futur proche ne + va + pas + inf, with reflexive ne + se + lave + pas. Article change: pas de pain, pas d\'eau (instead of pas du/de la/de l\'). Common A1 contexts.',
  },

  // ── A2 (+3) ─────────────────────────────────────────────────────────
  {
    slug: 'accord-pp-cod-avant-a2',
    titleRu: 'Согласование PP с COD перед глаголом',
    titleEn: 'Past participle agreement with preceding COD',
    descriptionRu: 'Согласуйте participe passé с прямым дополнением, стоящим ПЕРЕД глаголом (avoir-глаголы).',
    descriptionEn: 'Agree past participle with preceding direct object (avoir verbs).',
    level: 'A2', category: 'grammaire', difficulty: 3, questionCount: 25, icon: 'Brain',
    focus: 'Past participle agreement with avoir when COD precedes: les pommes que j\'ai achetées, je les ai prises, quels livres a-t-il lus. Forms: -e (fem sing), -s (masc pl), -es (fem pl). No agreement if COD follows or is COI. Common drills.',
  },
  {
    slug: 'pronoms-demonstratifs-a2',
    titleRu: 'Указательные местоимения',
    titleEn: 'Demonstrative pronouns',
    descriptionRu: 'Выберите celui / celle / ceux / celles, и формы с -ci / -là.',
    descriptionEn: 'Pick celui / celle / ceux / celles plus -ci / -là forms.',
    level: 'A2', category: 'pronoms', difficulty: 3, questionCount: 25, icon: 'Sparkles',
    focus: 'Demonstrative pronouns: celui/celle/ceux/celles + qui/que/dont/de or -ci/-là. Distinctions: celui-ci = this one, celui-là = that one. Gender + number agreement with antecedent. Compare with demonstrative adjectives ce/cette/ces (NOT pronouns).',
  },
  {
    slug: 'imparfait-conjugaison-a2',
    titleRu: 'Imparfait — спряжение',
    titleEn: 'Imparfait conjugation',
    descriptionRu: 'Спрягите глаголы в imparfait: основа от nous présent + -ais/-ais/-ait/-ions/-iez/-aient.',
    descriptionEn: 'Conjugate verbs in imparfait using the nous-stem + standard endings.',
    level: 'A2', category: 'temps', difficulty: 3, questionCount: 25, icon: 'Clock',
    focus: 'Imparfait conjugation: stem = nous form of présent minus -ons (nous parlons → parl-, nous finissons → finiss-, nous prenons → pren-). Endings -ais/-ais/-ait/-ions/-iez/-aient. Irregular: être → ét-. Manger/commencer keep e/ç before -a/-o (mangeait, commençait).',
  },

  // ── B1 (+3) ─────────────────────────────────────────────────────────
  {
    slug: 'pronoms-relatifs-simples-b1',
    titleRu: 'Относительные местоимения qui / que / dont / où',
    titleEn: 'Relative pronouns qui / que / dont / où',
    descriptionRu: 'Выберите qui (подлежащее) / que (дополнение) / dont (после de) / où (место/время).',
    descriptionEn: 'Pick qui (subject) / que (object) / dont (after de) / où (place or time).',
    level: 'B1', category: 'pronoms', difficulty: 3, questionCount: 25, icon: 'Brain',
    focus: 'Relative pronouns choice: qui replaces subject, que replaces direct object (que → qu\' before vowel), dont replaces de + complement (parler de, avoir besoin de), où replaces place or time complement. Distractors: wrong pronoun for the grammatical role.',
  },
  {
    slug: 'subjonctif-vs-indicatif-b1',
    titleRu: 'Subjonctif vs Indicatif — выбор',
    titleEn: 'Subjonctif vs Indicatif choice',
    descriptionRu: 'Выберите наклонение после триггера: subj. после volonté/émotion/doute, indic. после opinion positive/certitude.',
    descriptionEn: 'Pick mood: subj. after want/emotion/doubt, indic. after positive opinion/certainty.',
    level: 'B1', category: 'subjonctif', difficulty: 3, questionCount: 25, icon: 'Sparkles',
    focus: 'Subjonctif triggers: je veux que, il faut que, il est important que, je doute que, je crains que, il est possible que, bien que, à condition que, avant que. Indicatif triggers: je pense que (positive), je suis sûr que, j\'espère que, parce que, puisque. Negative je ne pense pas que → subj.',
  },
  {
    slug: 'futur-anterieur-b1',
    titleRu: 'Futur antérieur — спряжение и употребление',
    titleEn: 'Futur antérieur — forms and use',
    descriptionRu: 'Постройте futur antérieur: auxiliary в futur simple + participe passé. Использование для будущего предшествования.',
    descriptionEn: 'Build futur antérieur: auxiliary in futur simple + past participle.',
    level: 'B1', category: 'temps', difficulty: 4, questionCount: 25, icon: 'Timer',
    focus: 'Futur antérieur construction: avoir/être in futur simple + past participle. Use: action completed before another future action (quand j\'aurai fini, je sortirai). After quand/lorsque/dès que/après que + futur antérieur, main clause in futur simple.',
  },

  // ── B2 (+5, HIGH PRIORITY — was only 2 sets) ────────────────────────
  {
    slug: 'conditionnel-passe-b2',
    titleRu: 'Conditionnel passé — спряжение и употребление',
    titleEn: 'Conditionnel passé — forms and use',
    descriptionRu: 'Постройте conditionnel passé: auxiliary в conditionnel présent + participe passé. Сожаление, упрёк, гипотеза.',
    descriptionEn: 'Build conditionnel passé: auxiliary in conditionnel + past participle.',
    level: 'B2', category: 'temps', difficulty: 4, questionCount: 25, icon: 'Clock',
    focus: 'Conditionnel passé construction: avoir/être in conditionnel présent (aurais/serais) + past participle. Use: past regret (j\'aurais voulu), reproach (tu aurais dû), unrealised past hypothesis (si j\'avais su, j\'aurais fait). Si-clause: plus-que-parfait → conditionnel passé.',
  },
  {
    slug: 'faire-causatif-b2',
    titleRu: 'Faire causatif (faire + infinitif)',
    titleEn: 'Faire causative',
    descriptionRu: 'Постройте каузативную конструкцию faire + инфинитив. Согласование, замена местоимениями.',
    descriptionEn: 'Build the causative faire + infinitive.',
    level: 'B2', category: 'syntaxe', difficulty: 4, questionCount: 25, icon: 'Sparkles',
    focus: 'Faire causative: faire + infinitive (subject doesn\'t perform — they cause it). je fais réparer la voiture (someone else repairs). Pronoun: je la fais réparer (NOT je fais la réparer). Past participle fait INVARIABLE: je l\'ai fait peindre. With two objects: agent à or par. Compare with laisser (similar pattern).',
  },
  {
    slug: 'mise-en-relief-b2',
    titleRu: 'Эмфатические конструкции — основы',
    titleEn: 'Cleft sentences — basics',
    descriptionRu: 'Постройте эмфазу: c\'est ... qui (subject), c\'est ... que (other), ce qui ... c\'est, ce que ... c\'est.',
    descriptionEn: 'Build cleft sentences with c\'est ... qui/que and ce qui/que ... c\'est.',
    level: 'B2', category: 'syntaxe', difficulty: 4, questionCount: 25, icon: 'Brain',
    focus: 'Mise en relief basics: c\'est ... qui (cleft on subject — c\'est Marie qui parle), c\'est ... que (cleft on object — c\'est ce livre que je préfère, c\'est demain qu\'il vient). Reduplication: ce qui m\'intéresse, c\'est..., ce que je veux, c\'est... Agreement: c\'est moi qui suis, c\'est nous qui sommes.',
  },
  {
    slug: 'discours-indirect-passe-b2',
    titleRu: 'Косвенная речь в прошедшем — преобразования',
    titleEn: 'Indirect speech in past — transformations',
    descriptionRu: 'Преобразуйте прямую речь в косвенную при глаголе речи в прошедшем. Сдвиг времён и временны́х маркеров.',
    descriptionEn: 'Transform direct to indirect speech when reporting verb is in the past.',
    level: 'B2', category: 'syntaxe', difficulty: 4, questionCount: 25, icon: 'Timer',
    focus: 'Past-reporting tense shifts: présent → imparfait, passé composé → plus-que-parfait, futur simple → conditionnel présent, futur proche → allait + inf, impératif → de + inf. Time markers: aujourd\'hui → ce jour-là, hier → la veille, demain → le lendemain, maintenant → à ce moment-là.',
  },
  {
    slug: 'pronoms-relatifs-lequel-b2',
    titleRu: 'Сложные относительные после предлога',
    titleEn: 'Relative pronouns after preposition',
    descriptionRu: 'Выберите lequel / laquelle / lesquels / lesquelles после предлога, и слияния auquel / duquel / desquels.',
    descriptionEn: 'Pick lequel / laquelle / lesquels / lesquelles after prepositions; contractions auquel/duquel.',
    level: 'B2', category: 'pronoms', difficulty: 4, questionCount: 25, icon: 'Brain',
    focus: 'Lequel after prepositions: avec lequel, sur laquelle, dans lesquels, pour lesquelles. Contractions with à: auquel/à laquelle/auxquels/auxquelles. With de: duquel/de laquelle/desquels/desquelles. Use of dont vs duquel (dont after de + noun direct, duquel after preposition + de). Animate à/avec → à qui/avec qui as option.',
  },

  // ── C1 (+2) ─────────────────────────────────────────────────────────
  {
    slug: 'inversion-stylistique-c1',
    titleRu: 'Стилистическая инверсия',
    titleEn: 'Stylistic inversion',
    descriptionRu: 'Распознавайте и стройте инверсию после peut-être, sans doute, ainsi, и в придаточных формального регистра.',
    descriptionEn: 'Recognize and build subject-verb inversion in formal contexts.',
    level: 'C1', category: 'syntaxe', difficulty: 4, questionCount: 25, icon: 'Sparkles',
    focus: 'Stylistic inversion: after peut-être, sans doute, ainsi, aussi, encore, à peine, du moins (peut-être viendra-t-il / peut-être qu\'il viendra). In formal relative clauses (les efforts qu\'a déployés...). After certain adverbs of place. NOT in oral French.',
  },
  {
    slug: 'regimes-verbes-c1',
    titleRu: 'Глагольные режимы à / de / direct',
    titleEn: 'Verb regimes à / de / direct',
    descriptionRu: 'Выберите правильный предлог после глагола: à + inf, de + inf, прямой инфинитив.',
    descriptionEn: 'Pick the correct preposition after verbs: à + inf, de + inf, or direct.',
    level: 'C1', category: 'verbes', difficulty: 4, questionCount: 25, icon: 'Brain',
    focus: 'Verb + à + inf: s\'attendre à, parvenir à, hésiter à, tenir à, songer à, renoncer à. Verb + de + inf: essayer de, refuser de, s\'agir de, se contenter de, se garder de. Direct: laisser, faire, oser, savoir, devoir, vouloir, pouvoir. Verbs that take both with diff meaning: commencer à/de, finir par.',
  },

  // ── C2 (+2) ─────────────────────────────────────────────────────────
  {
    slug: 'formes-archaiques-c2',
    titleRu: 'Архаические формы — распознавание',
    titleEn: 'Archaic forms recognition',
    descriptionRu: 'Распознавайте формы fût-il, eussé-je, point ne…, nonobstant, hormis, jadis в литературных текстах.',
    descriptionEn: 'Recognize archaic literary forms in elevated French.',
    level: 'C2', category: 'litteraire', difficulty: 5, questionCount: 25, icon: 'Sparkles',
    focus: 'Archaic French in current literary use: fût-il/fussiez (concessive subj. inversion), eussé-je/eussions, point ne (literary negation), ne saurais (modal restrictive), nonobstant, hormis, naguère, jadis, céans. Recognition in modern literary/journalistic excerpts.',
  },
  {
    slug: 'nuances-modales-c2',
    titleRu: 'Тонкие модальные нюансы',
    titleEn: 'Fine modal distinctions',
    descriptionRu: 'Различайте: pouvoir vs savoir vs être à même de; devoir vs être tenu de vs censé; il faut que vs il convient que.',
    descriptionEn: 'Distinguish fine modal expressions.',
    level: 'C2', category: 'verbes', difficulty: 5, questionCount: 25, icon: 'Brain',
    focus: 'C2 modal nuances: pouvoir (can/may) vs savoir (know how to) vs être à même de (be in position to) vs être en mesure de. devoir (must) vs être tenu de (obliged to) vs être censé/supposé (supposed to). il faut que (necessity) vs il importe que (importance) vs il convient que (appropriateness) vs il sied de (high formal). Subj. mood selection.',
  },
];

const SYSTEM_PROMPT = `You are a French CEFR drill author. Output JSON
with key "questions" containing EXACTLY 25 multiple_choice questions:

  {
    "type": "multiple_choice",
    "question": { "text": "<French sentence with ___>", "options": [3 strings] },
    "answer":   { "correct": "<verbatim match to one option>" },
    "explanation": "<Russian 1-2 sentence explanation>"
  }

Rules:
- "text" MUST contain "___" (three underscores) for the gap.
- Exactly 3 options. Distractors must be plausible (wrong form, wrong
  tense, common learner error).
- "correct" verbatim equals one option.
- Explanations in Russian, focused on the grammatical rule.
- Cover varied persons, verbs, contexts within the focus.
- Match the specified CEFR level register.
- Output ONLY {"questions": [...]}.`;

interface Question {
  type: 'multiple_choice';
  question: { text: string; options: string[] };
  answer: { correct: string };
  explanation: string;
}

async function genQuestions(spec: DrillSpec): Promise<Question[]> {
  const userMsg = `Level: ${spec.level}
Theme: ${spec.titleRu}
Focus: ${spec.focus}

Produce 25 multiple_choice drill questions at ${spec.level}.`;
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
    console.log(`  gen: ${spec.slug} [${spec.level}]…`);
    questions = await genQuestions(spec);
    writeFileSync(cacheFile, JSON.stringify(questions, null, 2));
    console.log(`    → ${questions.length}q`);
  }
  all.push({ spec, questions });
}

console.log(`\n[drills-expansion] ${all.length} sets ready`);
if (!APPLY) { console.log(`[dry-run] pass --apply`); process.exit(0); }

let setI = 0; let qI = 0;
for (const { spec, questions } of all) {
  const [s] = await db.insert(drillSets).values({
    slug: spec.slug, titleRu: spec.titleRu, titleEn: spec.titleEn,
    descriptionRu: spec.descriptionRu, descriptionEn: spec.descriptionEn,
    level: spec.level, category: spec.category, difficulty: spec.difficulty,
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
