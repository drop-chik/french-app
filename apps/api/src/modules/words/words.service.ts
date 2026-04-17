import { eq, and, lte, inArray, sql, or } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { words, wordProgress } from '../../db/schema/index.js';
import { calculateNextReview, getStatus, createCard } from '@french-app/srs-engine';
import type { SRSGrade } from '@french-app/srs-engine';
import type { LanguageLevel } from '@french-app/shared-types';

const MAX_NEW_PER_SESSION = 20;

// All levels up to and including the given level
const LEVEL_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2'];
function levelsUpTo(level: LanguageLevel): LanguageLevel[] {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER.slice(0, idx + 1);
}

// Normalize a word row for the given UI language
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
export async function getStudySession(
  db: DB,
  userId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
) {
  // Include words from all levels up to (and including) the user's level
  const allowedLevels = levelsUpTo(level);

  const allWords = await db.query.words.findMany({
    where: or(...allowedLevels.map((l) => eq(words.level, l))),
  });

  if (allWords.length === 0) return [];

  const wordIds = allWords.map((w) => w.id);

  // Progress records for these words
  const progressRecords = await db.query.wordProgress.findMany({
    where: and(
      eq(wordProgress.userId, userId),
      inArray(wordProgress.wordId, wordIds),
    ),
  });

  const progressMap = new Map(progressRecords.map((p) => [p.wordId, p]));

  const now = new Date();
  const dueWords: typeof allWords = [];
  const newWords: typeof allWords = [];

  for (const word of allWords) {
    const progress = progressMap.get(word.id);
    if (!progress) {
      newWords.push(word);
    } else if (new Date(progress.nextReview) <= now) {
      dueWords.push(word);
    }
  }

  const sessionNew = newWords.slice(0, MAX_NEW_PER_SESSION);
  const session = [...dueWords, ...sessionNew];

  // Shuffle
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

// Get all learned words for dictionary
export async function getDictionary(db: DB, userId: string, lang: 'ru' | 'en' = 'ru') {
  const progress = await db.query.wordProgress.findMany({
    where: eq(wordProgress.userId, userId),
    with: { word: true },
  });
  return progress.map((p) => ({
    ...p,
    word: normalizeWord(p.word, lang),
  }));
}

// Get random words from same level/category (for multiple choice distractors)
export async function getDistractors(
  db: DB,
  wordId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
  count = 3,
) {
  // Include words from A1 up to the given level so there are always enough distractors
  const allowedLevels = levelsUpTo(level);
  const result = await db
    .select()
    .from(words)
    .where(or(...allowedLevels.map((l) => eq(words.level, l))))
    .orderBy(sql`RANDOM()`)
    .limit(count + 5);

  return result
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

  // Mark as generating (job will pick it up)
  await db.update(words).set({ imageGenerating: true }).where(eq(words.id, wordId));
  return { imageUrl: null, generating: true };
}
