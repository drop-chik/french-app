/**
 * Generate C1 French vocabulary via AI batch, organised by thematic
 * blocks aligned with CEFR C1 descriptors.
 *
 * Each block targets a different domain where C1 learners need
 * specialised vocabulary that B2 doesn't cover:
 *
 *   1. Abstract concepts (philosophy, psychology, ethics)
 *   2. Academic register (research, analysis, argumentation)
 *   3. Professional advanced (strategy, negotiation, leadership)
 *   4. Literature & arts criticism
 *   5. Legal & political institutions
 *   6. Science & technology (introductory specialist)
 *   7. Economy & finance (advanced)
 *   8. Media & journalism
 *   9. Nuanced synonyms (refining B2 vocabulary with subtle distinctions)
 *  10. Connectors & discourse markers (formal register)
 *  11. Idiomatic expressions & set phrases
 *  12. Rare/literary verbs and adjectives
 *  13. Emotions & psychological states (advanced)
 *
 * Target: ~1300 words total (~100 per block).
 *
 * Idempotency: checks for duplicates against existing DB content (any
 * level) before inserting. Re-run is safe.
 *
 * Cost: ~$0.05-0.10 (gpt-4o-mini, 13 blocks × ~10 batches of 10).
 */
import 'dotenv/config';
import OpenAI from 'openai';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { words } from '../db/schema/index.js';

const apiKey = process.env['OPENAI_API_KEY'];
if (!apiKey) { console.error('OPENAI_API_KEY missing'); process.exit(1); }
const openai = new OpenAI({ apiKey });

const APPLY = process.argv.includes('--apply');
const OUT_DIR = 'tmp/c1-generation';
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface Block {
  category: string;     // matches our DB category column
  themeFr: string;      // for prompting
  themeRu: string;
  description: string;  // refines what kind of words to generate
  targetCount: number;
  partOfSpeechHint?: string;  // e.g. 'noun,adjective' to bias
}

const BLOCKS: Block[] = [
  {
    category: 'abstract_concepts',
    themeFr: 'Concepts abstraits, philosophie, psychologie, éthique',
    themeRu: 'Абстрактные концепты',
    description: 'Words like ambivalence, paradoxe, scepticisme, lucidité, intériorité, transcendance. Nouns for inner states, philosophical/ethical notions. Avoid words clearly A1-B2.',
    targetCount: 110,
  },
  {
    category: 'academic',
    themeFr: 'Registre académique, recherche, analyse',
    themeRu: 'Академический регистр',
    description: 'Words like hypothèse, corroborer, méthodologie, exégèse, problématique, démarche analytique, prémisse, postulat. Words used in essays, theses, research papers.',
    targetCount: 110,
  },
  {
    category: 'professional_advanced',
    themeFr: 'Vie professionnelle avancée: stratégie, négociation, management',
    themeRu: 'Профессиональная лексика advanced',
    description: 'Words like stratégie, prérogative, ressort, mandat, restructuration, recadrer, arbitrage, dérogation. Workplace vocabulary beyond B2 office basics.',
    targetCount: 110,
  },
  {
    category: 'arts_criticism',
    themeFr: 'Littérature, arts, critique',
    themeRu: 'Литература, искусство, критика',
    description: 'Words like esthétique, narration, dramaturgie, romanesque, picturalité, mise en abyme, allégorie, dénouement, intrigue, registre. Literary and artistic analysis.',
    targetCount: 100,
  },
  {
    category: 'law_politics',
    themeFr: 'Droit, politique, institutions',
    themeRu: 'Право и политика',
    description: 'Words like jurisprudence, recours, juridiction, plébiscite, scrutin, motion, prérogative, prorogation, immunité, abrogation. Legal and institutional vocabulary.',
    targetCount: 100,
  },
  {
    category: 'science_intro_specialist',
    themeFr: 'Science et technologie',
    themeRu: 'Наука и технологии',
    description: 'Words like algorithme, paramètre, génome, chromosome, écosystème, biodiversité, écorégion, biotope, nanotechnologie, intelligence artificielle. Scientific introductory specialist.',
    targetCount: 100,
  },
  {
    category: 'economy_finance_advanced',
    themeFr: 'Économie et finance avancées',
    themeRu: 'Экономика и финансы advanced',
    description: 'Words like inflation, dévaluation, conjoncture, récession, krach, plus-value, actionnariat, fiscalité, dérégulation, blanchiment. Economic and financial vocabulary.',
    targetCount: 90,
  },
  {
    category: 'media_journalism',
    themeFr: 'Médias et journalisme',
    themeRu: 'Медиа и журналистика',
    description: 'Words like couverture médiatique, ligne éditoriale, déontologie, manipulation, désinformation, propagande, démenti, anonymat, lanceur d\'alerte, scoop. Media-related advanced vocab.',
    targetCount: 90,
  },
  {
    category: 'nuanced_synonyms',
    themeFr: 'Synonymes nuancés (raffinement du vocabulaire B2)',
    themeRu: 'Нюансированные синонимы',
    description: 'Subtle synonyms beyond B2 basics: instead of "dire", use "asserter, alléguer, prétendre, soutenir"; instead of "comprendre", use "appréhender, saisir, embrasser". One nuanced verb or noun per entry.',
    targetCount: 110,
    partOfSpeechHint: 'verb,noun',
  },
  {
    category: 'connectors_formal',
    themeFr: 'Connecteurs et marqueurs discursifs formels',
    themeRu: 'Формальные коннекторы',
    description: 'Words like nonobstant, néanmoins, toutefois, par ailleurs, en l\'occurrence, force est de constater, il convient de, à cet égard, à plus forte raison, dès lors que. Discourse connectors for academic/formal register.',
    targetCount: 80,
    partOfSpeechHint: 'expression,adverb,conjunction',
  },
  {
    category: 'idiomatic_expressions',
    themeFr: 'Expressions idiomatiques courantes au niveau C1',
    themeRu: 'Идиоматические выражения C1',
    description: 'Idioms like "passer à la trappe", "prendre la tangente", "battre en brèche", "monter au créneau", "faire long feu", "tenir la dragée haute", "couper l\'herbe sous le pied". Multi-word fixed expressions.',
    targetCount: 100,
    partOfSpeechHint: 'expression',
  },
  {
    category: 'literary_register',
    themeFr: 'Registre littéraire, verbes et adjectifs rares',
    themeRu: 'Литературный регистр',
    description: 'Words like vétuste, désuet, suranné, accablant, opiniâtre, abscons, glaner, exorciser, étayer, prosaïque. Literary or formal adjectives and verbs that appear in journalism, essays, novels.',
    targetCount: 100,
  },
  {
    category: 'emotions_advanced',
    themeFr: 'Émotions et états psychologiques avancés',
    themeRu: 'Эмоции и психология',
    description: 'Words like accablement, exaltation, contrariété, désarroi, désinvolture, mansuétude, perplexité, résilience, ressentiment, abnégation. Subtle emotional states beyond B2 basics.',
    targetCount: 100,
  },
];

const SYSTEM_PROMPT = `You are a French DELF/DALF C1 vocabulary editor.
For the theme the user gives, output a JSON object {"words": [...]} with
the specified number of entries.

Each entry MUST have:
  - french:        the French word/expression in canonical form
                   (for nouns: include article "le X" or "la X" or "l'X";
                   for verbs: infinitive; for reflexive verbs: "se X";
                   for adjectives: masculine singular form;
                   for expressions: idiomatic form as one would look it up)
  - translation:   accurate Russian translation, 1-5 words
  - translation_en: accurate English translation, 1-5 words
  - example_fr:    one short C1-appropriate French sentence using the word
                   (10-20 words, natural, demonstrating the word in
                   a typical C1 context — journalism, academic, formal)
  - example_ru:    faithful Russian translation of example_fr
  - example_en:    faithful English translation of example_fr
  - part_of_speech: one of: noun, verb, adjective, adverb, expression,
                    preposition, conjunction, pronoun
  - gender:         for nouns only, "m" or "f"; null for non-nouns

Strict rules:
  - Words must be at C1 level — neither too easy (A1-B2) nor too rare (C2+).
  - Each word must be UNIQUE within the batch.
  - Examples must be grammatically correct, idiomatic, NOT translated
    from English — write directly in French.
  - For expressions and idioms, the example must use the expression
    in its idiomatic sense, not literally.
  - JSON only. No commentary.`;

interface Entry {
  french: string;
  translation: string;
  translation_en: string;
  example_fr: string;
  example_ru: string;
  example_en: string;
  part_of_speech: string;
  gender: 'm' | 'f' | null;
}

async function generateBlock(block: Block): Promise<Entry[]> {
  const userMsg = `Theme: ${block.themeFr}
Description: ${block.description}
${block.partOfSpeechHint ? `Bias toward parts of speech: ${block.partOfSpeechHint}` : ''}
Target: ${block.targetCount} unique entries.

Output JSON with key "words" containing exactly ${block.targetCount} entries.`;

  // Split into multiple smaller requests to stay within token limits
  // and reduce drift. 30 entries per call ≈ 1800 tokens.
  const PER_CALL = 30;
  const MAX_CALLS = 15;
  const MIN_PROGRESS = 2;
  const collected: Entry[] = [];
  const seen = new Set<string>();
  let stalledRuns = 0;

  for (let call = 0; call < MAX_CALLS && collected.length < block.targetCount; call++) {
    const need = Math.min(PER_CALL, block.targetCount - collected.length);
    const callMsg = `${userMsg}\n\nFor THIS call, output ${need} entries.\nAlready used (do NOT repeat): ${[...seen].slice(0, 80).join(', ')}`;
    const before = collected.length;
    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3500,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: callMsg },
        ],
      });
      const raw = resp.choices[0]?.message?.content ?? '{}';
      let parsed: { words?: Entry[] };
      try { parsed = JSON.parse(raw); }
      catch { console.warn(`  ${block.category}: JSON parse failed, skipping batch`); continue; }
      const items = Array.isArray(parsed.words) ? parsed.words : [];
      for (const it of items) {
        if (!it.french || typeof it.french !== 'string') continue;
        const key = it.french.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(it);
      }
      process.stdout.write(`.`);
    } catch (err) {
      console.warn(`\n  ${block.category}: API error: ${(err as Error).message}`);
    }
    const added = collected.length - before;
    if (added < MIN_PROGRESS) {
      stalledRuns++;
      if (stalledRuns >= 3) {
        console.log(`\n  ${block.category}: stalled after ${call + 1} calls, accepting ${collected.length}/${block.targetCount}`);
        break;
      }
    } else {
      stalledRuns = 0;
    }
  }
  console.log(` ${block.category}: ${collected.length}/${block.targetCount}`);
  return collected.slice(0, block.targetCount);
}

// Main
const existingFrench = new Set<string>();
const existing = await db.select({ french: words.french }).from(words);
for (const e of existing) existingFrench.add(e.french.toLowerCase().trim());
console.log(`[generate] ${existingFrench.size} existing words in DB`);

const allGenerated: Array<Entry & { category: string }> = [];
for (const block of BLOCKS) {
  const file = `${OUT_DIR}/${block.category}.json`;
  let entries: Entry[];
  if (existsSync(file)) {
    entries = JSON.parse(readFileSync(file, 'utf8'));
    console.log(`[generate] ${block.category}: ${entries.length} loaded from cache`);
  } else {
    console.log(`[generate] ${block.category}: generating ${block.targetCount}…`);
    entries = await generateBlock(block);
    writeFileSync(file, JSON.stringify(entries, null, 2));
  }
  for (const e of entries) allGenerated.push({ ...e, category: block.category });
}

// Dedupe against existing DB
const newOnly = allGenerated.filter((e) => {
  const key = e.french.toLowerCase().trim();
  return !existingFrench.has(key);
});
const dupCount = allGenerated.length - newOnly.length;
console.log(`\n[generate] total generated: ${allGenerated.length}`);
console.log(`[generate] already in DB:   ${dupCount}`);
console.log(`[generate] new to insert:   ${newOnly.length}`);

writeFileSync(`${OUT_DIR}/c1-merged.json`, JSON.stringify(newOnly, null, 2));

if (!APPLY) {
  console.log(`\n[dry-run] pass --apply to INSERT ${newOnly.length} rows`);
  process.exit(0);
}

console.log(`\n[apply] inserting ${newOnly.length} rows…`);
let inserted = 0;
let failed = 0;
for (const e of newOnly) {
  try {
    await db.insert(words).values({
      french: e.french,
      translation: e.translation,
      translationEn: e.translation_en,
      partOfSpeech: e.part_of_speech,
      gender: e.gender,
      category: e.category,
      level: 'C1',
      exampleFr: e.example_fr,
      exampleRu: e.example_ru,
      exampleEn: e.example_en,
      isActive: true,
    });
    inserted++;
  } catch (err) {
    failed++;
    console.error(`  failed: ${e.french}:`, err instanceof Error ? err.message : err);
  }
}
console.log(`[apply] done — inserted ${inserted}, failed ${failed}`);
process.exit(0);
