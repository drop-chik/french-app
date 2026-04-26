import { eq, and, lte, inArray, sql, or, isNull, asc, isNotNull } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { words, wordProgress } from '../../db/schema/index.js';
import { calculateNextReview, getStatus, createCard } from '@french-app/srs-engine';
import type { SRSGrade } from '@french-app/srs-engine';
import type { LanguageLevel } from '@french-app/shared-types';

const MAX_NEW_PER_SESSION = 20;
const MAX_DUE_PER_SESSION = 100;

const LEVEL_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function levelsUpTo(level: LanguageLevel): LanguageLevel[] {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER.slice(0, idx + 1);
}

function normalizeWord(word: typeof words.$inferSelect, lang: 'ru' | 'en') {
  if (lang === 'en') {
    return {
      ...word,
      translation: word.translationEn ?? word.translation,
      exampleRu: word.exampleEn ?? word.exampleRu,
    };
  }
  return word;
}

// Get today's study session: due reviews + new words
// Uses a single LEFT JOIN query — safe at 10 000+ words.
export async function getStudySession(
  db: DB,
  userId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
) {
  const allowedLevels = levelsUpTo(level);
  const now = new Date();

  // ── Due words: have a progress row and nextReview <= now ──────────────
  const dueRows = await db
    .select({ word: words, progress: wordProgress })
    .from(words)
    .innerJoin(
      wordProgress,
      and(
        eq(wordProgress.wordId, words.id),
        eq(wordProgress.userId, userId),
        lte(wordProgress.nextReview, now),
      ),
    )
    .where(
      and(
        or(...allowedLevels.map((l) => eq(words.level, l))),
        eq(words.isActive, true),
      ),
    )
    .orderBy(asc(wordProgress.nextReview))
    .limit(MAX_DUE_PER_SESSION);

  // ── New words: no progress row yet, ordered by frequencyRank ─────────
  // Subquery: word IDs the user already has progress for
  const seenIds = await db
    .select({ wordId: wordProgress.wordId })
    .from(wordProgress)
    .where(eq(wordProgress.userId, userId));

  const seenSet = new Set(seenIds.map((r) => r.wordId));

  const newRows = await db
    .select()
    .from(words)
    .where(
      and(
        or(...allowedLevels.map((l) => eq(words.level, l))),
        eq(words.isActive, true),
      ),
    )
    .orderBy(asc(words.frequencyRank))
    .limit(MAX_NEW_PER_SESSION * 5); // over-fetch then filter unseen

  const newWords = newRows
    .filter((w) => !seenSet.has(w.id))
    .slice(0, MAX_NEW_PER_SESSION);

  // ── Merge, build progress map, shuffle ───────────────────────────────
  const progressMap = new Map(dueRows.map((r) => [r.word.id, r.progress]));

  const session = [
    ...dueRows.map((r) => r.word),
    ...newWords,
  ];

  // Fisher-Yates shuffle
  for (let i = session.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [session[i], session[j]] = [session[j]!, session[i]!];
  }

  return session.map((word) => ({
    ...normalizeWord(word, lang),
    progress: progressMap.get(word.id) ?? null,
  }));
}

// Record answer and update SRS progress
export async function recordAnswer(
  db: DB,
  userId: string,
  wordId: string,
  grade: SRSGrade,
) {
  const existing = await db.query.wordProgress.findFirst({
    where: and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)),
  });

  const currentCard = existing
    ? {
        easinessFactor: Number(existing.easinessFactor),
        interval: existing.interval,
        repetitions: existing.repetitions,
        nextReview: new Date(existing.nextReview),
      }
    : createCard();

  const result = calculateNextReview(currentCard, grade);
  const status = getStatus(result);

  if (!existing) {
    await db.insert(wordProgress).values({
      userId,
      wordId,
      status,
      easinessFactor: result.easinessFactor.toFixed(2),
      interval: result.interval,
      repetitions: result.repetitions,
      nextReview: result.nextReview,
      lastReviewed: new Date(),
      correctCount: result.wasCorrect ? 1 : 0,
      incorrectCount: result.wasCorrect ? 0 : 1,
    });
  } else {
    await db
      .update(wordProgress)
      .set({
        status,
        easinessFactor: result.easinessFactor.toFixed(2),
        interval: result.interval,
        repetitions: result.repetitions,
        nextReview: result.nextReview,
        lastReviewed: new Date(),
        correctCount: result.wasCorrect
          ? sql`${wordProgress.correctCount} + 1`
          : wordProgress.correctCount,
        incorrectCount: !result.wasCorrect
          ? sql`${wordProgress.incorrectCount} + 1`
          : wordProgress.incorrectCount,
      })
      .where(and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)));
  }

  return result;
}

// Get all learned words for dictionary with cursor-based pagination
export async function getDictionary(
  db: DB,
  userId: string,
  lang: 'ru' | 'en' = 'ru',
  limit = 200,
  offset = 0,
) {
  const progress = await db.query.wordProgress.findMany({
    where: eq(wordProgress.userId, userId),
    with: { word: true },
    limit,
    offset,
    orderBy: (wp, { desc }) => [desc(wp.lastReviewed)],
  });
  return progress.map((p) => ({
    ...p,
    word: normalizeWord(p.word, lang),
  }));
}

// Get random distractors from same POS and nearby frequency range
// Avoids full-table RANDOM() scan at scale by sampling a frequency band.
export async function getDistractors(
  db: DB,
  wordId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
  count = 3,
) {
  const allowedLevels = levelsUpTo(level);

  // Get the target word to know its POS and frequency band
  const target = await db.query.words.findFirst({ where: eq(words.id, wordId) });
  if (!target) return [];

  const rank = target.frequencyRank ?? 500;
  const bandMin = Math.max(1, rank - 300);
  const bandMax = rank + 300;

  // Prefer same part-of-speech, within frequency band
  const candidates = await db
    .select()
    .from(words)
    .where(
      and(
        or(...allowedLevels.map((l) => eq(words.level, l))),
        eq(words.isActive, true),
        eq(words.partOfSpeech, target.partOfSpeech),
        sql`${words.frequencyRank} BETWEEN ${bandMin} AND ${bandMax}`,
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(count + 10);

  const filtered = candidates.filter((w) => w.id !== wordId);

  // If not enough in band, fall back to any word from the level
  if (filtered.length >= count) {
    return filtered.slice(0, count).map((w) => normalizeWord(w, lang));
  }

  const fallback = await db
    .select()
    .from(words)
    .where(
      and(
        or(...allowedLevels.map((l) => eq(words.level, l))),
        eq(words.isActive, true),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(count + 5);

  return fallback
    .filter((w) => w.id !== wordId)
    .slice(0, count)
    .map((w) => normalizeWord(w, lang));
}

// Request image generation for a word
export async function requestWordImage(db: DB, wordId: string) {
  const word = await db.query.words.findFirst({ where: eq(words.id, wordId) });
  if (!word) throw new Error('Word not found');
  if (word.imageUrl) return { imageUrl: word.imageUrl, generating: false };
  if (word.imageGenerating) return { imageUrl: null, generating: true };

  await db.update(words).set({ imageGenerating: true }).where(eq(words.id, wordId));
  return { imageUrl: null, generating: true };
}
