import { eq, and, desc, ilike, or, inArray } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { readingTexts, readingProgress, words, wordProgress } from '../../db/schema/index.js';

export interface ReadingQuestion {
  id: string;
  question: string;
  options: string[];
  correct: string;
  explanation: string;
}

// In the DB, wordMap entries are bilingual: `tr` is Russian, `tr_en` is the
// English translation. `getTextBySlug` normalises down to a single `tr` based
// on the caller's lang. Older texts may still lack `tr_en` (the backfill
// script populates it on a pass); when missing on EN UI we fall back to RU
// rather than show nothing.
export interface StoredWordEntry {
  tr: string;
  tr_en?: string | null;
  pos: string;
  ipa?: string | null;
}

export interface WordEntry {
  tr: string;
  pos: string;
  ipa?: string | null;
}

export async function getTexts(
  db: DB,
  userId: string,
  level?: string,
  topic?: string,
) {
  const conditions = [eq(readingTexts.isActive, true)];
  if (level) conditions.push(eq(readingTexts.level, level as 'A1' | 'A2' | 'B1' | 'B2'));
  if (topic) conditions.push(eq(readingTexts.topic, topic));

  const textRows = await db
    .select({
      id: readingTexts.id,
      slug: readingTexts.slug,
      title: readingTexts.title,
      level: readingTexts.level,
      topic: readingTexts.topic,
      estimatedMinutes: readingTexts.estimatedMinutes,
      createdAt: readingTexts.createdAt,
    })
    .from(readingTexts)
    .where(and(...conditions))
    .orderBy(readingTexts.level, readingTexts.topic);

  if (textRows.length === 0) return [];

  const textIds = textRows.map((t) => t.id);
  const progressRows = await db
    .select({
      textId: readingProgress.textId,
      score: readingProgress.score,
      totalQuestions: readingProgress.totalQuestions,
      completedAt: readingProgress.completedAt,
    })
    .from(readingProgress)
    .where(eq(readingProgress.userId, userId));

  const progressMap = new Map(progressRows.map((p) => [p.textId, p]));

  return textRows.map((t) => {
    const prog = progressMap.get(t.id);
    return {
      ...t,
      completed: !!prog?.completedAt,
      score: prog?.score ?? null,
      totalQuestions: prog?.totalQuestions ?? null,
    };
  });
}

export async function getTextBySlug(
  db: DB,
  userId: string,
  slug: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const text = await db.query.readingTexts.findFirst({
    where: and(eq(readingTexts.slug, slug), eq(readingTexts.isActive, true)),
  });
  if (!text) return null;

  const prog = await db.query.readingProgress.findFirst({
    where: and(
      eq(readingProgress.userId, userId),
      eq(readingProgress.textId, text.id),
    ),
  });

  // wordMap stores both languages: {tr (Russian), tr_en?, pos, ipa?}. We
  // collapse to a single `tr` field based on the caller's lang and fall back
  // to Russian if `tr_en` hasn't been backfilled for this key yet. IPA may
  // still be missing on legacy seed entries — top up from the words table in
  // a single bulk lookup.
  const baseMap = text.wordMap as Record<string, StoredWordEntry>;
  const keys = Object.keys(baseMap);
  let enrichedMap: Record<string, WordEntry> = Object.fromEntries(
    Object.entries(baseMap).map(([k, v]) => {
      const tr = lang === 'en' && v.tr_en && v.tr_en.trim() ? v.tr_en : v.tr;
      const entry: WordEntry = { tr, pos: v.pos };
      if (v.ipa) entry.ipa = v.ipa;
      return [k, entry];
    }),
  );
  if (keys.length > 0) {
    const rows = await db
      .select({ french: words.french, ipa: words.ipa })
      .from(words)
      .where(inArray(words.french, keys));
    const ipaByFrench = new Map(rows.map((r) => [r.french.toLowerCase(), r.ipa]));
    enrichedMap = Object.fromEntries(
      Object.entries(enrichedMap).map(([k, v]) => {
        if (v.ipa) return [k, v];
        const ipa = ipaByFrench.get(k.toLowerCase()) ?? null;
        return [k, ipa ? { ...v, ipa } : v];
      }),
    );
  }

  return {
    ...text,
    wordMap: enrichedMap,
    questions: text.questions as ReadingQuestion[],
    progress: prog
      ? {
          completedAt: prog.completedAt,
          score: prog.score,
          totalQuestions: prog.totalQuestions,
          wordsLookedUp: prog.wordsLookedUp as string[],
          wordsSaved: prog.wordsSaved as string[],
        }
      : null,
  };
}

export async function saveProgress(
  db: DB,
  userId: string,
  textId: string,
  score: number,
  totalQuestions: number,
  wordsLookedUp: string[],
  wordsSaved: string[],
) {
  await db
    .insert(readingProgress)
    .values({
      userId,
      textId,
      score,
      totalQuestions,
      wordsLookedUp,
      wordsSaved,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.textId],
      set: {
        score,
        totalQuestions,
        wordsLookedUp,
        wordsSaved,
        completedAt: new Date(),
      },
    });
}

export async function saveWordToVocab(db: DB, userId: string, wordFr: string) {
  // Find the word in our words table (case-insensitive, try exact then ilike)
  let word = await db.query.words.findFirst({
    where: eq(words.french, wordFr),
  });

  if (!word) {
    word = await db.query.words.findFirst({
      where: ilike(words.french, wordFr),
    });
  }

  if (!word) return { added: false, reason: 'Word not in dictionary' };

  const existing = await db.query.wordProgress.findFirst({
    where: and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, word.id)),
  });

  if (existing) return { added: false, reason: 'Already in vocabulary' };

  const now = new Date();
  await db.insert(wordProgress).values({
    userId,
    wordId: word.id,
    status: 'learning',
    easinessFactor: '2.50',
    interval: 1,
    repetitions: 0,
    nextReview: now,
    lastReviewed: now,
    correctCount: 0,
    incorrectCount: 0,
  });

  return { added: true, wordId: word.id };
}

// French verb lemmatization — tries common endings to find the infinitive
export function tryVerbStem(word: string): string[] {
  const candidates: string[] = [];

  // Present -er (parle, parles, parlons, parlez, parlent)
  if (word.endsWith('ons'))   candidates.push(word.slice(0, -3) + 'er');
  if (word.endsWith('ez'))    candidates.push(word.slice(0, -2) + 'er');
  if (word.endsWith('ent'))   candidates.push(word.slice(0, -3) + 'er');
  if (word.endsWith('es'))    candidates.push(word.slice(0, -2) + 'er');
  if (word.endsWith('e') && word.length > 3) candidates.push(word.slice(0, -1) + 'er');

  // Passé composé -é/-ée/-és/-ées (aimé → aimer)
  if (/é(es?|s)?$/.test(word)) candidates.push(word.replace(/é(es?|s)?$/, 'er'));

  // Present participle -ant → try -er and -ir (marchant → marcher)
  if (word.endsWith('issant')) candidates.push(word.slice(0, -6) + 'ir');
  if (word.endsWith('ant') && word.length > 5) {
    candidates.push(word.slice(0, -3) + 'er');
    candidates.push(word.slice(0, -3) + 'ir');
  }

  // Present -ir regular (finit, finis → finir; finissons → finir)
  if (word.endsWith('issons')) candidates.push(word.slice(0, -6) + 'ir');
  if (word.endsWith('issez'))  candidates.push(word.slice(0, -5) + 'ir');
  if (word.endsWith('issent')) candidates.push(word.slice(0, -6) + 'ir');
  if (word.endsWith('it'))     candidates.push(word.slice(0, -2) + 'ir');
  if (word.endsWith('is'))     candidates.push(word.slice(0, -2) + 'ir');

  // Imparfait -er (aimais, aimait, aimions, aimiez, aimaient)
  if (word.endsWith('aient')) candidates.push(word.slice(0, -5) + 'er');
  if (word.endsWith('ais'))   candidates.push(word.slice(0, -3) + 'er');
  if (word.endsWith('ait'))   candidates.push(word.slice(0, -3) + 'er');
  if (word.endsWith('ions'))  candidates.push(word.slice(0, -4) + 'er');

  return [...new Set(candidates)].filter(c => c.length >= 4 && c !== word);
}

// French noun/adjective lemmatization — strips plural/feminine endings to find base form
export function tryNounStem(word: string): string[] {
  const candidates: string[] = [];

  // Plural -eaux → singular -eau (tableaux → tableau)
  if (word.endsWith('eaux'))  candidates.push(word.slice(0, -1));        // →tableaux→tableau
  // Plural -aux → singular -al (journaux → journal)
  if (word.endsWith('aux') && !word.endsWith('eaux'))
    candidates.push(word.slice(0, -3) + 'al');
  // Plural -s → singular (problèmes→problème, mots→mot)
  if (word.endsWith('s') && word.length > 3)
    candidates.push(word.slice(0, -1));
  // Plural -es → singular without -s (langues→langue)
  if (word.endsWith('es') && word.length > 4)
    candidates.push(word.slice(0, -1));

  // Feminine adjective patterns → masculine base
  if (word.endsWith('elles'))  candidates.push(word.slice(0, -5) + 'el');   // traditionnelles→traditionnel
  if (word.endsWith('elle'))   candidates.push(word.slice(0, -4) + 'el');   // culturelle→culturel
  if (word.endsWith('ives'))   candidates.push(word.slice(0, -4) + 'if');   // créatives→créatif
  if (word.endsWith('ive'))    candidates.push(word.slice(0, -3) + 'if');   // créative→créatif
  if (word.endsWith('ières'))  candidates.push(word.slice(0, -5) + 'ier');  // premières→premier
  if (word.endsWith('ière'))   candidates.push(word.slice(0, -4) + 'ier');  // première→premier
  // -euse → both -eur (chanteuse→chanteur, noun) and -eux (heureuse→heureux, adj)
  if (word.endsWith('euses')) {
    candidates.push(word.slice(0, -5) + 'eur');
    candidates.push(word.slice(0, -5) + 'eux');
  }
  if (word.endsWith('euse')) {
    candidates.push(word.slice(0, -4) + 'eur');
    candidates.push(word.slice(0, -4) + 'eux');
  }
  if (word.endsWith('rices'))  candidates.push(word.slice(0, -5) + 'eur');  // actrices→acteur
  if (word.endsWith('rice'))   candidates.push(word.slice(0, -4) + 'eur');  // actrice→acteur
  if (word.endsWith('iques'))  candidates.push(word.slice(0, -1));           // islamiques→islamique
  if (word.endsWith('ales'))   candidates.push(word.slice(0, -2));          // nationales→national (strip -es)
  if (word.endsWith('ale'))    candidates.push(word.slice(0, -3) + 'al');   // nationale→national
  if (word.endsWith('aux'))    candidates.push(word.slice(0, -3) + 'al');   // nationaux→national

  return [...new Set(candidates)].filter(c => c.length >= 3 && c !== word);
}

// Inline translation table for French function words not in the vocabulary DB.
// Covers articles, prepositions, conjunctions, pronouns, determiners, adverbs,
// and irregular conjugations of the 10 most common verbs.
const FUNCTION_WORDS: Record<string, { tr: string; pos: string; level: string; baseForm?: string }> = {
  // ── être ─────────────────────────────────────────────────────────────────────
  'être':     { tr: 'быть, являться',           pos: 'verb',  level: 'A1' },
  'suis':     { tr: 'я есть',                   pos: 'verb',  level: 'A1', baseForm: 'être' },
  'es':       { tr: 'ты есть',                  pos: 'verb',  level: 'A1', baseForm: 'être' },
  'est':      { tr: 'есть, является',           pos: 'verb',  level: 'A1', baseForm: 'être' },
  'sommes':   { tr: 'мы есть',                  pos: 'verb',  level: 'A1', baseForm: 'être' },
  'êtes':     { tr: 'вы есть',                  pos: 'verb',  level: 'A1', baseForm: 'être' },
  'sont':     { tr: 'есть, являются',           pos: 'verb',  level: 'A1', baseForm: 'être' },
  'étais':    { tr: 'был(а) (я/ты)',            pos: 'verb',  level: 'A1', baseForm: 'être' },
  'était':    { tr: 'был(а)',                   pos: 'verb',  level: 'A1', baseForm: 'être' },
  'étions':   { tr: 'мы были',                  pos: 'verb',  level: 'A1', baseForm: 'être' },
  'étiez':    { tr: 'вы были',                  pos: 'verb',  level: 'A1', baseForm: 'être' },
  'étaient':  { tr: 'были',                     pos: 'verb',  level: 'A1', baseForm: 'être' },
  'serai':    { tr: 'я буду',                   pos: 'verb',  level: 'A2', baseForm: 'être' },
  'seras':    { tr: 'ты будешь',                pos: 'verb',  level: 'A2', baseForm: 'être' },
  'sera':     { tr: 'будет',                    pos: 'verb',  level: 'A2', baseForm: 'être' },
  'serons':   { tr: 'мы будем',                 pos: 'verb',  level: 'A2', baseForm: 'être' },
  'serez':    { tr: 'вы будете',                pos: 'verb',  level: 'A2', baseForm: 'être' },
  'seront':   { tr: 'будут',                    pos: 'verb',  level: 'A2', baseForm: 'être' },
  'soit':     { tr: 'есть (сослагательное)',     pos: 'verb',  level: 'B1', baseForm: 'être' },
  'soient':   { tr: 'были бы (сослагательное)', pos: 'verb',  level: 'B1', baseForm: 'être' },
  'étant':    { tr: 'будучи',                   pos: 'verb',  level: 'A2', baseForm: 'être' },
  'été':      { tr: 'был(а), являлся',          pos: 'verb',  level: 'A1', baseForm: 'être' },
  // ── avoir ────────────────────────────────────────────────────────────────────
  'avoir':    { tr: 'иметь, обладать',          pos: 'verb',  level: 'A1' },
  'ai':       { tr: 'я имею',                   pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'a':        { tr: 'имеет / есть',             pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avons':    { tr: 'мы имеем',                 pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avez':     { tr: 'вы имеете',                pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'ont':      { tr: 'имеют / есть',             pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avais':    { tr: 'я/ты имел(а)',             pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avait':    { tr: 'имел(а)',                  pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avions':   { tr: 'мы имели',                 pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'aviez':    { tr: 'вы имели',                 pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'avaient':  { tr: 'имели',                    pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  'aurai':    { tr: 'я буду иметь',             pos: 'verb',  level: 'A2', baseForm: 'avoir' },
  'aura':     { tr: 'будет иметь',              pos: 'verb',  level: 'A2', baseForm: 'avoir' },
  'auront':   { tr: 'будут иметь',              pos: 'verb',  level: 'A2', baseForm: 'avoir' },
  'eu':       { tr: 'имел(а) (причастие)',      pos: 'verb',  level: 'A1', baseForm: 'avoir' },
  // ── aller ────────────────────────────────────────────────────────────────────
  'aller':    { tr: 'идти, ехать',              pos: 'verb',  level: 'A1' },
  'vais':     { tr: 'я иду',                    pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'vas':      { tr: 'ты идёшь',                 pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'va':       { tr: 'идёт',                     pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'allons':   { tr: 'мы идём / пойдём',         pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'allez':    { tr: 'вы идёте / идите',         pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'vont':     { tr: 'идут',                     pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'allait':   { tr: 'шёл(шла)',                 pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'allaient': { tr: 'шли',                      pos: 'verb',  level: 'A1', baseForm: 'aller' },
  'ira':      { tr: 'пойдёт',                   pos: 'verb',  level: 'A2', baseForm: 'aller' },
  'iront':    { tr: 'пойдут',                   pos: 'verb',  level: 'A2', baseForm: 'aller' },
  // ── faire ────────────────────────────────────────────────────────────────────
  'faire':    { tr: 'делать, совершать',        pos: 'verb',  level: 'A1' },
  'fais':     { tr: 'я/ты делаю/делаешь',       pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'fait':     { tr: 'делает / сделал',          pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'faisons':  { tr: 'мы делаем',               pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'faites':   { tr: 'вы делаете / делайте',    pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'font':     { tr: 'делают',                  pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'faisait':  { tr: 'делал(а)',                pos: 'verb',  level: 'A1', baseForm: 'faire' },
  'fera':     { tr: 'сделает',                 pos: 'verb',  level: 'A2', baseForm: 'faire' },
  'feront':   { tr: 'сделают',                 pos: 'verb',  level: 'A2', baseForm: 'faire' },
  // ── dire ─────────────────────────────────────────────────────────────────────
  'dire':     { tr: 'говорить, сказать',       pos: 'verb',  level: 'A1' },
  'dis':      { tr: 'я/ты говорю/говоришь',    pos: 'verb',  level: 'A1', baseForm: 'dire' },
  'dit':      { tr: 'говорит / сказал',        pos: 'verb',  level: 'A1', baseForm: 'dire' },
  'disons':   { tr: 'мы говорим',             pos: 'verb',  level: 'A1', baseForm: 'dire' },
  'dites':    { tr: 'вы говорите',            pos: 'verb',  level: 'A1', baseForm: 'dire' },
  'disent':   { tr: 'говорят',               pos: 'verb',  level: 'A1', baseForm: 'dire' },
  'disait':   { tr: 'говорил(а)',            pos: 'verb',  level: 'A1', baseForm: 'dire' },
  // ── pouvoir ──────────────────────────────────────────────────────────────────
  'pouvoir':  { tr: 'мочь, иметь возможность', pos: 'verb',  level: 'A1' },
  'peux':     { tr: 'я/ты могу/можешь',        pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'peut':     { tr: 'может',                   pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'pouvons':  { tr: 'мы можем',              pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'pouvez':   { tr: 'вы можете',             pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'peuvent':  { tr: 'могут',                pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'pouvait':  { tr: 'мог(ла)',              pos: 'verb',  level: 'A1', baseForm: 'pouvoir' },
  'pourra':   { tr: 'сможет',              pos: 'verb',  level: 'A2', baseForm: 'pouvoir' },
  'pourront': { tr: 'смогут',             pos: 'verb',  level: 'A2', baseForm: 'pouvoir' },
  // ── vouloir ──────────────────────────────────────────────────────────────────
  'vouloir':  { tr: 'хотеть, желать',         pos: 'verb',  level: 'A1' },
  'veux':     { tr: 'я/ты хочу/хочешь',       pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  'veut':     { tr: 'хочет',                  pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  'voulons':  { tr: 'мы хотим',             pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  'voulez':   { tr: 'вы хотите',            pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  'veulent':  { tr: 'хотят',               pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  'voulait':  { tr: 'хотел(а)',            pos: 'verb',  level: 'A1', baseForm: 'vouloir' },
  // ── devoir ───────────────────────────────────────────────────────────────────
  'devoir':   { tr: 'должен, обязан',         pos: 'verb',  level: 'A1' },
  'dois':     { tr: 'я/ты должен/должна',     pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'doit':     { tr: 'должен/должна',          pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'devons':   { tr: 'мы должны',            pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'devez':    { tr: 'вы должны',            pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'doivent':  { tr: 'должны',              pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'devait':   { tr: 'должен был',          pos: 'verb',  level: 'A1', baseForm: 'devoir' },
  'devra':    { tr: 'должен будет',        pos: 'verb',  level: 'A2', baseForm: 'devoir' },
  // ── savoir ───────────────────────────────────────────────────────────────────
  'savoir':   { tr: 'знать, уметь',           pos: 'verb',  level: 'A1' },
  'sais':     { tr: 'я/ты знаю/знаешь',       pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  'sait':     { tr: 'знает',                  pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  'savons':   { tr: 'мы знаем',             pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  'savez':    { tr: 'вы знаете',            pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  'savent':   { tr: 'знают',               pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  'savait':   { tr: 'знал(а)',             pos: 'verb',  level: 'A1', baseForm: 'savoir' },
  // ── venir ────────────────────────────────────────────────────────────────────
  'venir':    { tr: 'приходить, приезжать',  pos: 'verb',  level: 'A1' },
  'viens':    { tr: 'я/ты прихожу/приходишь', pos: 'verb', level: 'A1', baseForm: 'venir' },
  'vient':    { tr: 'приходит',              pos: 'verb',  level: 'A1', baseForm: 'venir' },
  'venons':   { tr: 'мы приходим',          pos: 'verb',  level: 'A1', baseForm: 'venir' },
  'venez':    { tr: 'вы приходите',         pos: 'verb',  level: 'A1', baseForm: 'venir' },
  'viennent': { tr: 'приходят',            pos: 'verb',  level: 'A1', baseForm: 'venir' },
  'venait':   { tr: 'приходил(а)',         pos: 'verb',  level: 'A1', baseForm: 'venir' },
  'viendra':  { tr: 'придёт',             pos: 'verb',  level: 'A2', baseForm: 'venir' },
  // ── voir ─────────────────────────────────────────────────────────────────────
  'voir':     { tr: 'видеть',               pos: 'verb',  level: 'A1' },
  'vois':     { tr: 'я/ты вижу/видишь',     pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'voit':     { tr: 'видит',               pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'voyons':   { tr: 'мы видим',           pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'voyez':    { tr: 'вы видите',          pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'voient':   { tr: 'видят',             pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'voyait':   { tr: 'видел(а)',          pos: 'verb',  level: 'A1', baseForm: 'voir' },
  'vu':       { tr: 'увиденный (причастие)', pos: 'verb', level: 'A1', baseForm: 'voir' },
  // ── prendre ──────────────────────────────────────────────────────────────────
  'prendre':  { tr: 'брать, принимать',    pos: 'verb',  level: 'A1' },
  'prends':   { tr: 'я/ты беру/берёшь',   pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'prend':    { tr: 'берёт',              pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'prenons':  { tr: 'мы берём',          pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'prenez':   { tr: 'вы берёте',         pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'prennent': { tr: 'берут',            pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'prenait':  { tr: 'брал(а)',          pos: 'verb',  level: 'A1', baseForm: 'prendre' },
  'pris':     { tr: 'взятый (причастие)', pos: 'verb', level: 'A1', baseForm: 'prendre' },
  // ── Articles ─────────────────────────────────────────────────────────────────
  'le':   { tr: 'определённый артикль (м.р.)',   pos: 'art', level: 'A1' },
  'la':   { tr: 'определённый артикль (ж.р.)',   pos: 'art', level: 'A1' },
  'les':  { tr: 'определённый артикль (мн.ч.)',  pos: 'art', level: 'A1' },
  'un':   { tr: 'один, некий',                   pos: 'art', level: 'A1' },
  'une':  { tr: 'одна, некая',                   pos: 'art', level: 'A1' },
  'des':  { tr: 'некоторые (неопред. арт. мн.ч.)', pos: 'art', level: 'A1' },
  'du':   { tr: 'некоторое количество (de + le)', pos: 'art', level: 'A1' },
  // ── Prepositions ─────────────────────────────────────────────────────────────
  'de':      { tr: 'из, от, о',                pos: 'prep', level: 'A1' },
  'à':       { tr: 'в, к, на',                 pos: 'prep', level: 'A1' },
  'au':      { tr: 'в, к, на (à + le)',         pos: 'prep', level: 'A1' },
  'aux':     { tr: 'в, к (à + les)',            pos: 'prep', level: 'A1' },
  'en':      { tr: 'в, на, по',                pos: 'prep', level: 'A1' },
  'dans':    { tr: 'в, внутри',                pos: 'prep', level: 'A1' },
  'sur':     { tr: 'на (поверхности)',          pos: 'prep', level: 'A1' },
  'sous':    { tr: 'под',                       pos: 'prep', level: 'A1' },
  'par':     { tr: 'через, по, на',             pos: 'prep', level: 'A1' },
  'pour':    { tr: 'для, ради, чтобы',          pos: 'prep', level: 'A1' },
  'avec':    { tr: 'с, вместе с',               pos: 'prep', level: 'A1' },
  'sans':    { tr: 'без',                       pos: 'prep', level: 'A1' },
  'vers':    { tr: 'к, в сторону',              pos: 'prep', level: 'A1' },
  'entre':   { tr: 'между, среди',              pos: 'prep', level: 'A1' },
  'chez':    { tr: 'у (кого-то), дома у',       pos: 'prep', level: 'A1' },
  'avant':   { tr: 'до, перед',                 pos: 'prep', level: 'A1' },
  'après':   { tr: 'после',                     pos: 'prep', level: 'A1' },
  'depuis':  { tr: 'с (момента), с тех пор как', pos: 'prep', level: 'A1' },
  'pendant': { tr: 'во время, в течение',       pos: 'prep', level: 'A2' },
  'contre':  { tr: 'против, напротив',           pos: 'prep', level: 'A2' },
  'malgré':  { tr: 'несмотря на',               pos: 'prep', level: 'B1' },
  'selon':   { tr: 'согласно, по',              pos: 'prep', level: 'B1' },
  'grâce':   { tr: 'благодаря (grâce à)',        pos: 'prep', level: 'B1' },
  'afin':    { tr: 'чтобы (afin de/que)',        pos: 'prep', level: 'B1' },
  // ── Personal pronouns ────────────────────────────────────────────────────────
  'je':    { tr: 'я',                           pos: 'pron', level: 'A1' },
  'tu':    { tr: 'ты',                          pos: 'pron', level: 'A1' },
  'il':    { tr: 'он',                          pos: 'pron', level: 'A1' },
  'elle':  { tr: 'она',                         pos: 'pron', level: 'A1' },
  'nous':  { tr: 'мы, нас',                     pos: 'pron', level: 'A1' },
  'vous':  { tr: 'вы, вас',                     pos: 'pron', level: 'A1' },
  'ils':   { tr: 'они (м.р.)',                  pos: 'pron', level: 'A1' },
  'elles': { tr: 'они (ж.р.)',                  pos: 'pron', level: 'A1' },
  'me':    { tr: 'мне, меня, мной',             pos: 'pron', level: 'A1' },
  'te':    { tr: 'тебе, тебя, тобой',           pos: 'pron', level: 'A1' },
  'se':    { tr: 'себя, себе (возвратное)',      pos: 'pron', level: 'A1' },
  'lui':   { tr: 'ему, ей',                     pos: 'pron', level: 'A1' },
  'leur':  { tr: 'им / их',                     pos: 'pron', level: 'A1' },
  'y':     { tr: 'там, туда (местоимение)',      pos: 'pron', level: 'A2' },
  'on':    { tr: 'мы, люди (неопределённое)',    pos: 'pron', level: 'A1' },
  'ça':    { tr: 'это (разговорное)',             pos: 'pron', level: 'A1' },
  'cela':  { tr: 'это, то',                     pos: 'pron', level: 'A2' },
  'ceci':  { tr: 'это (ближнее)',                pos: 'pron', level: 'A2' },
  'qui':   { tr: 'кто, который',                pos: 'pron', level: 'A1' },
  'que':   { tr: 'что, который, чем',           pos: 'pron', level: 'A1' },
  'qu':    { tr: 'что, который (перед гласной)', pos: 'pron', level: 'A1' },
  'quoi':  { tr: 'что (вопросительное)',         pos: 'pron', level: 'A1' },
  'dont':  { tr: 'чей, которого, о котором',    pos: 'pron', level: 'B1' },
  'où':    { tr: 'где, куда, когда',            pos: 'pron', level: 'A1' },
  // ── Conjunctions ─────────────────────────────────────────────────────────────
  'et':        { tr: 'и',                          pos: 'conj', level: 'A1' },
  'ou':        { tr: 'или',                        pos: 'conj', level: 'A1' },
  'mais':      { tr: 'но, однако',                 pos: 'conj', level: 'A1' },
  'donc':      { tr: 'итак, следовательно',        pos: 'conj', level: 'A1' },
  'car':       { tr: 'так как, потому что',        pos: 'conj', level: 'A2' },
  'ni':        { tr: 'ни',                         pos: 'conj', level: 'A2' },
  'si':        { tr: 'если',                       pos: 'conj', level: 'A1' },
  'or':        { tr: 'между тем, а (союз)',         pos: 'conj', level: 'B1' },
  'quand':     { tr: 'когда',                      pos: 'conj', level: 'A1' },
  'comme':     { tr: 'как, так как',               pos: 'conj', level: 'A1' },
  'lorsque':   { tr: 'когда (книжное)',             pos: 'conj', level: 'B1' },
  'puisque':   { tr: 'так как, поскольку',         pos: 'conj', level: 'B1' },
  'pourtant':  { tr: 'однако, тем не менее',       pos: 'conj', level: 'B1' },
  'cependant': { tr: 'однако, между тем',          pos: 'conj', level: 'B1' },
  'néanmoins': { tr: 'тем не менее',              pos: 'conj', level: 'B2' },
  'parce':     { tr: 'потому (в parce que)',        pos: 'conj', level: 'A1' },
  // ── Adverbs ──────────────────────────────────────────────────────────────────
  'ne':         { tr: 'не (частица отрицания)',      pos: 'adverb', level: 'A1' },
  'pas':        { tr: 'не (ne…pas)',                 pos: 'adverb', level: 'A1' },
  'plus':       { tr: 'больше, более / больше не',  pos: 'adverb', level: 'A1' },
  'très':       { tr: 'очень',                       pos: 'adverb', level: 'A1' },
  'aussi':      { tr: 'тоже, также, так же',         pos: 'adverb', level: 'A1' },
  'encore':     { tr: 'ещё, снова',                  pos: 'adverb', level: 'A1' },
  'déjà':       { tr: 'уже',                         pos: 'adverb', level: 'A1' },
  'toujours':   { tr: 'всегда, всё ещё',             pos: 'adverb', level: 'A1' },
  'jamais':     { tr: 'никогда',                     pos: 'adverb', level: 'A1' },
  'souvent':    { tr: 'часто',                       pos: 'adverb', level: 'A1' },
  'parfois':    { tr: 'иногда',                      pos: 'adverb', level: 'A1' },
  'peu':        { tr: 'мало, немного',               pos: 'adverb', level: 'A1' },
  'beaucoup':   { tr: 'много, очень',                pos: 'adverb', level: 'A1' },
  'assez':      { tr: 'достаточно, довольно',        pos: 'adverb', level: 'A1' },
  'trop':       { tr: 'слишком',                     pos: 'adverb', level: 'A1' },
  'tout':       { tr: 'весь, всё, очень',            pos: 'adverb', level: 'A1' },
  'bien':       { tr: 'хорошо, действительно',       pos: 'adverb', level: 'A1' },
  'mal':        { tr: 'плохо',                       pos: 'adverb', level: 'A1' },
  'ici':        { tr: 'здесь',                       pos: 'adverb', level: 'A1' },
  'là':         { tr: 'там, вот',                    pos: 'adverb', level: 'A1' },
  'maintenant': { tr: 'сейчас',                      pos: 'adverb', level: 'A1' },
  'enfin':      { tr: 'наконец, в конце концов',     pos: 'adverb', level: 'A1' },
  'seulement':  { tr: 'только, лишь',                pos: 'adverb', level: 'A1' },
  'ainsi':      { tr: 'так, таким образом',          pos: 'adverb', level: 'B1' },
  'alors':      { tr: 'тогда, итак',                 pos: 'adverb', level: 'A1' },
  'même':       { tr: 'даже, сам, тот же',           pos: 'adverb', level: 'A2' },
  'non':        { tr: 'нет',                         pos: 'adverb', level: 'A1' },
  'oui':        { tr: 'да',                          pos: 'adverb', level: 'A1' },
  'notamment':  { tr: 'в частности, особенно',       pos: 'adverb', level: 'B1' },
  'plutôt':     { tr: 'скорее, довольно',            pos: 'adverb', level: 'B1' },
  'environ':    { tr: 'примерно, около',             pos: 'adverb', level: 'A2' },
  'surtout':    { tr: 'прежде всего, особенно',      pos: 'adverb', level: 'A2' },
  'vraiment':   { tr: 'действительно, правда',       pos: 'adverb', level: 'A1' },
  'autrement':  { tr: 'иначе, по-другому',           pos: 'adverb', level: 'B1' },
  'davantage':  { tr: 'больше, более',               pos: 'adverb', level: 'B1' },
  'longtemps':  { tr: 'долго, давно',                pos: 'adverb', level: 'A2' },
  'désormais':  { tr: 'отныне, теперь',              pos: 'adverb', level: 'B1' },
  'dorénavant': { tr: 'отныне, впредь',              pos: 'adverb', level: 'B1' },
  'quasiment':  { tr: 'почти, практически',          pos: 'adverb', level: 'B1' },
  'directement':{ tr: 'прямо, напрямую',             pos: 'adverb', level: 'A2' },
  'clairement': { tr: 'ясно, чётко',                 pos: 'adverb', level: 'A2' },
  'simplement': { tr: 'просто, попросту',             pos: 'adverb', level: 'A2' },
  'rapidement': { tr: 'быстро',                      pos: 'adverb', level: 'A2' },
  'généralement': { tr: 'обычно, в целом',           pos: 'adverb', level: 'B1' },
  'actuellement': { tr: 'в настоящее время, сейчас', pos: 'adverb', level: 'B1' },
  'particulièrement': { tr: 'особенно, особым образом', pos: 'adverb', level: 'B1' },
  'progressivement': { tr: 'постепенно',             pos: 'adverb', level: 'B2' },
  'réellement':  { tr: 'реально, по-настоящему',     pos: 'adverb', level: 'B1' },
  'forcément':   { tr: 'обязательно, непременно',    pos: 'adverb', level: 'B1' },
  'également':   { tr: 'также, тоже, одинаково',     pos: 'adverb', level: 'B1' },
  'ensemble':    { tr: 'вместе',                     pos: 'adverb', level: 'A1' },
  'bientôt':     { tr: 'скоро',                      pos: 'adverb', level: 'A1' },
  'partout':     { tr: 'везде, повсюду',              pos: 'adverb', level: 'A2' },
  'ailleurs':    { tr: 'в другом месте, кстати',     pos: 'adverb', level: 'B1' },
  'abord':       { tr: 'сначала, прежде всего (d\'abord)', pos: 'adverb', level: 'A1' },
  'autant':      { tr: 'столько же, так же много',   pos: 'adverb', level: 'A2' },
  'autour':      { tr: 'вокруг',                     pos: 'adverb', level: 'A2' },
  'combien':     { tr: 'сколько',                    pos: 'adverb', level: 'A1' },
  'lors':        { tr: 'тогда, во время (lors de)',  pos: 'adverb', level: 'B1' },
  'dès':         { tr: 'с (момента), как только',    pos: 'prep',   level: 'B1' },
  'voilà':       { tr: 'вот, пожалуйста',            pos: 'adverb', level: 'A1' },
  'voici':       { tr: 'вот (что)',                   pos: 'adverb', level: 'A1' },
  // ── Indefinite pronouns / determiners ────────────────────────────────────────
  'eux':        { tr: 'они, их (ударная форма)',      pos: 'pron', level: 'A1' },
  'chaque':     { tr: 'каждый, каждая',               pos: 'det',  level: 'A1' },
  'plusieurs':  { tr: 'несколько',                    pos: 'det',  level: 'A1' },
  'autre':      { tr: 'другой, другая',               pos: 'det',  level: 'A1' },
  'autres':     { tr: 'другие',                       pos: 'det',  level: 'A1' },
  'chacun':     { tr: 'каждый (по отдельности)',      pos: 'pron', level: 'A2' },
  'chacune':    { tr: 'каждая (по отдельности)',      pos: 'pron', level: 'A2' },
  'certains':   { tr: 'некоторые (м.р.)',             pos: 'det',  level: 'A2' },
  'certaines':  { tr: 'некоторые (ж.р.)',             pos: 'det',  level: 'A2' },
  'certain':    { tr: 'некоторый, определённый',      pos: 'det',  level: 'A2' },
  'certaine':   { tr: 'некоторая, определённая',      pos: 'det',  level: 'A2' },
  'tous':       { tr: 'все (м.р. мн.ч.)',             pos: 'det',  level: 'A1' },
  'toute':      { tr: 'вся, вся (ж.р.)',              pos: 'det',  level: 'A1' },
  'toutes':     { tr: 'все (ж.р. мн.ч.)',             pos: 'det',  level: 'A1' },
  'quel':       { tr: 'какой, который',               pos: 'det',  level: 'A1' },
  'quelle':     { tr: 'какая, которая',               pos: 'det',  level: 'A1' },
  'quels':      { tr: 'какие (м.р.)',                 pos: 'det',  level: 'A1' },
  'quelles':    { tr: 'какие (ж.р.)',                 pos: 'det',  level: 'A1' },
  'tel':        { tr: 'такой, подобный',              pos: 'det',  level: 'A2' },
  'telle':      { tr: 'такая, подобная',              pos: 'det',  level: 'A2' },
  'tels':       { tr: 'такие (м.р.)',                 pos: 'det',  level: 'A2' },
  'telles':     { tr: 'такие (ж.р.)',                 pos: 'det',  level: 'A2' },
  'fois':       { tr: 'раз (une fois = однажды)',      pos: 'noun', level: 'A1' },
  'chose':      { tr: 'вещь, дело, нечто',            pos: 'noun', level: 'A1' },
  'celui':      { tr: 'тот, тот который',             pos: 'pron', level: 'A2' },
  'celle':      { tr: 'та, та которая',               pos: 'pron', level: 'A2' },
  'ceux':       { tr: 'те, те которые (м.р.)',         pos: 'pron', level: 'A2' },
  'celles':     { tr: 'те, те которые (ж.р.)',         pos: 'pron', level: 'A2' },
  // ── Demonstrative determiners ─────────────────────────────────────────────────
  'ce':    { tr: 'этот, тот (перед согл.)',    pos: 'det', level: 'A1' },
  'cet':   { tr: 'этот, тот (перед гласн.)',   pos: 'det', level: 'A1' },
  'cette': { tr: 'эта, та',                    pos: 'det', level: 'A1' },
  'ces':   { tr: 'эти, те',                    pos: 'det', level: 'A1' },
  // ── Possessive determiners ────────────────────────────────────────────────────
  'mon':   { tr: 'мой',            pos: 'det', level: 'A1' },
  'ma':    { tr: 'моя',            pos: 'det', level: 'A1' },
  'mes':   { tr: 'мои',            pos: 'det', level: 'A1' },
  'ton':   { tr: 'твой',           pos: 'det', level: 'A1' },
  'ta':    { tr: 'твоя',           pos: 'det', level: 'A1' },
  'tes':   { tr: 'твои',           pos: 'det', level: 'A1' },
  'son':   { tr: 'его, её (м.р.)', pos: 'det', level: 'A1' },
  'sa':    { tr: 'его, её (ж.р.)', pos: 'det', level: 'A1' },
  'ses':   { tr: 'его/её (мн.ч.)', pos: 'det', level: 'A1' },
  'notre': { tr: 'наш, наша',      pos: 'det', level: 'A1' },
  'nos':   { tr: 'наши',           pos: 'det', level: 'A1' },
  'votre': { tr: 'ваш, ваша',      pos: 'det', level: 'A1' },
  'vos':   { tr: 'ваши',           pos: 'det', level: 'A1' },
  'leurs': { tr: 'их (мн.ч.)',     pos: 'det', level: 'A1' },
};

export async function translateWord(
  db: DB,
  wordFr: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const clean = wordFr.toLowerCase().trim();

  // Choose the right translation field based on caller's language. The
  // inline FUNCTION_WORDS table is Russian-only; for EN we fall back to the
  // Russian gloss rather than returning null — better than nothing while
  // there's no English seed table for function words. Most function words
  // are short and obvious in context anyway.
  const pickTr = (ru: string, en?: string | null) =>
    lang === 'en' && en && en.trim() ? en : ru;

  // 0. Inline function word dict — instant, no DB query
  const fw = FUNCTION_WORDS[clean];
  if (fw) {
    return { fr: clean, tr: fw.tr, pos: fw.pos, level: fw.level, baseForm: fw.baseForm ?? null };
  }

  // 1. Exact match
  let word = await db.query.words.findFirst({ where: eq(words.french, clean) });

  // 2. ilike match (handles accents mismatch)
  if (!word) {
    word = await db.query.words.findFirst({ where: ilike(words.french, clean) });
  }

  // 3. Try stripping articles (le chat → chat)
  if (!word) {
    const stripped = clean.replace(/^(?:le|la|les|l'|un|une|des|du|de la)\s+/i, '');
    if (stripped !== clean) {
      word = await db.query.words.findFirst({ where: ilike(words.french, stripped) });
    }
  }

  if (word) {
    return {
      fr: word.french,
      tr: pickTr(word.translation, word.translationEn),
      pos: word.partOfSpeech ?? '',
      level: word.level,
      baseForm: null as string | null,
      ipa: word.ipa ?? null,
    };
  }

  // 4. Verb lemmatization — try to find infinitive
  const verbCandidates = tryVerbStem(clean);
  for (const infinitive of verbCandidates) {
    const match = await db.query.words.findFirst({
      where: or(eq(words.french, infinitive), ilike(words.french, infinitive)),
    });
    if (match) {
      return {
        fr: match.french,
        tr: pickTr(match.translation, match.translationEn),
        pos: match.partOfSpeech ?? 'verb',
        level: match.level,
        baseForm: match.french,
        ipa: match.ipa ?? null,
      };
    }
  }

  // 5. Noun/adjective lemmatization — strip plural/feminine endings
  const nounCandidates = tryNounStem(clean);
  for (const base of nounCandidates) {
    const match = await db.query.words.findFirst({
      where: or(eq(words.french, base), ilike(words.french, base)),
    });
    if (match) {
      return {
        fr: match.french,
        tr: pickTr(match.translation, match.translationEn),
        pos: match.partOfSpeech ?? '',
        level: match.level,
        baseForm: match.french !== clean ? match.french : null,
        ipa: match.ipa ?? null,
      };
    }
  }

  return null;
}

export async function getUserStats(db: DB, userId: string) {
  const completed = await db
    .select({ textId: readingProgress.textId, score: readingProgress.score, totalQuestions: readingProgress.totalQuestions })
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, userId)))
    .orderBy(desc(readingProgress.completedAt));

  return {
    totalCompleted: completed.filter((r) => r.score !== null).length,
    texts: completed,
  };
}
