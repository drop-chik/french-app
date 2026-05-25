import { eq, and, lte, inArray, sql, or, isNull, asc, isNotNull, count } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { words, wordProgress, users } from '../../db/schema/index.js';
import { calculateNextReview, getStatus, createCard } from '@french-app/srs-engine';
import type { SRSGrade } from '@french-app/srs-engine';
import type { LanguageLevel } from '@french-app/shared-types';

// Defaults — overridden per-user via users.dailyNewWordsLimit /
// dailyDueWordsLimit. Lowered again because users were reporting that 14
// due-reviews-per-session was making sessions too long and causing dropoff.
// 5/5 keeps the session at ~5-6 minutes — short enough to do daily, long
// enough to make meaningful progress. Higher values are still supported
// for ambitious users; the setting now lives behind the gear icon on the
// Words page.
const DEFAULT_MAX_NEW_PER_SESSION = 5;
const DEFAULT_MAX_DUE_PER_SESSION = 5;

const LEVEL_ORDER: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function levelsUpTo(level: LanguageLevel): LanguageLevel[] {
  const idx = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER.slice(0, idx + 1);
}

// Visibility filter — every listing query must scope to: global words (NULL
// owner) OR words owned by the current user. Otherwise users would see each
// other's custom additions.
function visibleToUser(userId: string) {
  return or(isNull(words.createdByUserId), eq(words.createdByUserId, userId));
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
// Limits come from the user's profile (daily_new_words_limit /
// daily_due_words_limit) — defaults 10 / 20.
export async function getStudySession(
  db: DB,
  userId: string,
  level: LanguageLevel,
  lang: 'ru' | 'en' = 'ru',
) {
  const allowedLevels = levelsUpTo(level);
  const now = new Date();

  // Per-user session size limits
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { dailyNewWordsLimit: true, dailyDueWordsLimit: true },
  });
  const maxNew = user?.dailyNewWordsLimit ?? DEFAULT_MAX_NEW_PER_SESSION;
  const maxDue = user?.dailyDueWordsLimit ?? DEFAULT_MAX_DUE_PER_SESSION;

  // ── Due words: have a progress row, nextReview <= now ──
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
        visibleToUser(userId),
      ),
    )
    .orderBy(asc(wordProgress.nextReview))
    .limit(maxDue);

  // ── New words: no progress row yet, ordered by frequencyRank ─────────
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
        visibleToUser(userId),
      ),
    )
    .orderBy(asc(words.frequencyRank))
    .limit(maxNew * 5); // over-fetch then filter unseen

  const newWords = newRows
    .filter((w) => !seenSet.has(w.id))
    .slice(0, maxNew);

  // ── Merge: shuffle due words, keep new words in frequencyRank order ──
  const progressMap = new Map(dueRows.map((r) => [r.word.id, r.progress]));

  const dueWords = dueRows.map((r) => r.word);
  for (let i = dueWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dueWords[i], dueWords[j]] = [dueWords[j]!, dueWords[i]!];
  }

  // New words come last, already sorted by frequencyRank ASC (nulls last)
  const session = [...dueWords, ...newWords];

  return session.map((word) => ({
    ...normalizeWord(word, lang),
    progress: progressMap.get(word.id) ?? null,
  }));
}

// Bulk action — apply the same action to N words at once. Used by the
// multi-select UI in Dictionary. Implemented as a loop over individual
// service calls so the SRS-aware bookkeeping (markWord/restart) stays
// consistent. Up to 200 ids per call.
export async function bulkApplyAction(
  db: DB,
  userId: string,
  action: 'study' | 'mastered' | 'restart',
  wordIds: string[],
): Promise<{ ok: number; failed: number }> {
  let ok = 0;
  let failed = 0;
  for (const id of wordIds.slice(0, 200)) {
    try {
      if (action === 'restart') {
        await restartWord(db, userId, id);
      } else {
        await markWord(db, userId, id, action);
      }
      ok++;
    } catch {
      failed++;
    }
  }
  return { ok, failed };
}

// Get words tagged with a specific grammar topic — used by the
// "practice this topic's vocabulary" CTA on GrammarTopicPage. Returns the
// same WordData shape as getStudySession so the existing modes work unchanged.
export async function getWordsByGrammarTag(
  db: DB,
  userId: string,
  tag: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const rows = await db
    .select({ word: words, progress: wordProgress })
    .from(words)
    .leftJoin(
      wordProgress,
      and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
    )
    .where(and(eq(words.grammarTag, tag), eq(words.isActive, true), visibleToUser(userId)))
    .orderBy(asc(words.frequencyRank));

  return rows.map((r) => ({
    ...normalizeWord(r.word, lang),
    progress: r.progress ?? null,
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

  // Prefer same part-of-speech, within frequency band. Use GLOBAL words only
  // — distractors from another user's custom dictionary would leak content.
  const candidates = await db
    .select()
    .from(words)
    .where(
      and(
        or(...allowedLevels.map((l) => eq(words.level, l))),
        eq(words.isActive, true),
        isNull(words.createdByUserId),
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
        isNull(words.createdByUserId),
      ),
    )
    .orderBy(sql`RANDOM()`)
    .limit(count + 5);

  return fallback
    .filter((w) => w.id !== wordId)
    .slice(0, count)
    .map((w) => normalizeWord(w, lang));
}

// Get distinct categories for a given level with word counts + mastered count
// Deterministic display order for the Dictionary's category grid. Parts of
// speech first (one card per type), then noun themes in a pedagogical order
// (person → daily life → time → city / world → society → mind), with
// generic noun fallback ('vocabulary') at the very end. Anything not
// listed here sorts after the listed items, alphabetically.
const CATEGORY_DISPLAY_ORDER: string[] = [
  // Parts of speech ('colors' is technically adjectives but kept separate
  // as a pedagogical group)
  'verbs', 'adjectives', 'colors', 'adverbs', 'pronouns', 'prepositions',
  'conjunctions', 'determiners', 'numbers', 'expressions', 'interjections',
  // Noun themes — person
  'family', 'body', 'health', 'emotions',
  // Noun themes — daily life
  'food', 'home', 'clothes', 'shopping',
  // Noun themes — time
  'time', 'calendar',
  // Noun themes — city / world
  'city', 'travel', 'nature', 'weather', 'animals', 'geography',
  // Noun themes — society
  'environment', 'sports', 'education', 'work', 'economy', 'politics',
  'law', 'society', 'arts', 'media',
  // Noun themes — mind
  'technology', 'science', 'psychology',
  // Generic noun fallback — always last
  'vocabulary',
];

const CATEGORY_ORDER_INDEX = new Map(
  CATEGORY_DISPLAY_ORDER.map((c, i) => [c, i]),
);

export async function getCategories(db: DB, userId: string, level: LanguageLevel) {
  const rows = await db
    .select({
      category: words.category,
      cnt: count(),
      masteredCnt: sql<number>`count(case when ${wordProgress.status} = 'mastered' then 1 end)`,
      learnedCnt: sql<number>`count(case when ${wordProgress.repetitions} >= 1 then 1 end)`,
    })
    .from(words)
    .leftJoin(
      wordProgress,
      and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
    )
    .where(and(eq(words.level, level), eq(words.isActive, true), visibleToUser(userId)))
    .groupBy(words.category);

  const mapped = rows.map((r) => ({
    name: r.category ?? 'other',
    count: Number(r.cnt),
    masteredCount: Number(r.masteredCnt),
    learnedCount: Number(r.learnedCnt),
  }));

  // Sort by the explicit display order; anything unknown bubbles to the end
  // alphabetically.
  const lastIdx = CATEGORY_DISPLAY_ORDER.length;
  mapped.sort((a, b) => {
    const ia = CATEGORY_ORDER_INDEX.get(a.name) ?? lastIdx;
    const ib = CATEGORY_ORDER_INDEX.get(b.name) ?? lastIdx;
    if (ia !== ib) return ia - ib;
    return a.name.localeCompare(b.name);
  });

  return mapped;
}

// Browse all words for a level with optional category filter + user's progress status
export type BrowseSortBy = 'alphabet' | 'level' | 'frequency' | 'status' | 'recent';
export type BrowseStatusFilter = 'all' | 'not-started' | 'in-progress' | 'mastered' | 'mine';

export async function browseWords(
  db: DB,
  userId: string,
  level: LanguageLevel | null,
  category: string | null,
  lang: 'ru' | 'en',
  limit: number,
  offset: number,
  q: string | null = null,
  grammarTag: string | null = null,
  sortBy: BrowseSortBy = 'frequency',
  statusFilter: BrowseStatusFilter = 'all',
) {
  const pattern = q ? `%${q.toLowerCase()}%` : null;

  // Status filter is applied via SQL after the LEFT JOIN. For "not-started"
  // we need progress to be NULL; for the others we match progress.status.
  // "mine" is owner filter on words.created_by_user_id.
  const statusCond = (() => {
    if (statusFilter === 'all') return undefined;
    if (statusFilter === 'mine') return eq(words.createdByUserId, userId);
    if (statusFilter === 'not-started') return isNull(wordProgress.userId);
    if (statusFilter === 'mastered') return eq(wordProgress.status, 'mastered');
    // in-progress = anything that's been touched but not yet mastered
    return and(isNotNull(wordProgress.userId), sql`${wordProgress.status} <> 'mastered'`);
  })();

  const baseWhere = and(
    level ? eq(words.level, level) : undefined,
    eq(words.isActive, true),
    visibleToUser(userId),
    category ? eq(words.category, category) : undefined,
    grammarTag ? eq(words.grammarTag, grammarTag) : undefined,
    pattern
      ? or(
          sql`lower(${words.french}) LIKE ${pattern}`,
          sql`lower(${words.translation}) LIKE ${pattern}`,
        )
      : undefined,
    statusCond,
  );

  // Sort columns. Words without progress sort last for status/recent so
  // active rows surface first.
  const orderBy = (() => {
    switch (sortBy) {
      case 'alphabet':
        return [asc(words.french)];
      case 'level':
        return [asc(words.level), asc(words.frequencyRank)];
      case 'status':
        // mastered → review → learning → null. NULLS LAST.
        return [sql`${wordProgress.status} ASC NULLS LAST`, asc(words.frequencyRank)];
      case 'recent':
        return [sql`${wordProgress.lastReviewed} DESC NULLS LAST`, asc(words.frequencyRank)];
      case 'frequency':
      default:
        return [asc(words.frequencyRank)];
    }
  })();

  const [rows, totalRow] = await Promise.all([
    db
      .select({ word: words, progress: wordProgress })
      .from(words)
      .leftJoin(
        wordProgress,
        and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
      )
      .where(baseWhere)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(words)
      .leftJoin(
        wordProgress,
        and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
      )
      .where(baseWhere),
  ]);

  return {
    words: rows.map((r) => ({
      ...normalizeWord(r.word, lang),
      // Expose interval + repetitions so frontend can compute a "strength" %
      // for the visual bar on each row. Status alone is too coarse.
      progress: r.progress
        ? {
            status: r.progress.status,
            interval: r.progress.interval,
            repetitions: r.progress.repetitions,
          }
        : null,
    })),
    total: Number(totalRow[0]?.total ?? 0),
  };
}

// Manually add a word to study queue or mark as mastered
export async function markWord(
  db: DB,
  userId: string,
  wordId: string,
  action: 'study' | 'mastered',
) {
  const existing = await db.query.wordProgress.findFirst({
    where: and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)),
  });

  const now = new Date();

  if (action === 'study') {
    if (!existing) {
      await db.insert(wordProgress).values({
        userId,
        wordId,
        status: 'learning',
        easinessFactor: '2.50',
        interval: 1,
        repetitions: 0,
        nextReview: now,
        lastReviewed: now,
        correctCount: 0,
        incorrectCount: 0,
      });
    }
  } else {
    const farFuture = new Date(now.getTime() + 365 * 24 * 3_600_000);
    if (!existing) {
      await db.insert(wordProgress).values({
        userId,
        wordId,
        status: 'mastered',
        easinessFactor: '2.50',
        interval: 365,
        repetitions: 10,
        nextReview: farFuture,
        lastReviewed: now,
        correctCount: 10,
        incorrectCount: 0,
      });
    } else {
      await db
        .update(wordProgress)
        .set({ status: 'mastered', interval: 365, repetitions: 10, nextReview: farFuture, lastReviewed: now })
        .where(and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)));
    }
  }
}

// Words by category — used when user lands on /vocabulary from Dictionary
// drawer's "practice this category" button. Returns full WordData shape with
// user progress.
export async function getWordsByCategory(
  db: DB,
  userId: string,
  category: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const rows = await db
    .select({ word: words, progress: wordProgress })
    .from(words)
    .leftJoin(
      wordProgress,
      and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
    )
    .where(and(eq(words.category, category), eq(words.isActive, true), visibleToUser(userId)))
    .orderBy(asc(words.frequencyRank));

  return rows.map((r) => ({
    ...normalizeWord(r.word, lang),
    progress: r.progress ?? null,
  }));
}

// Single-word details — used by the Dictionary modal. Returns the full word
// row plus the user's current progress (if any).
export async function getWordDetails(
  db: DB,
  userId: string,
  wordId: string,
  lang: 'ru' | 'en' = 'ru',
) {
  const row = await db
    .select({ word: words, progress: wordProgress })
    .from(words)
    .leftJoin(
      wordProgress,
      and(eq(wordProgress.wordId, words.id), eq(wordProgress.userId, userId)),
    )
    .where(and(eq(words.id, wordId), visibleToUser(userId)))
    .limit(1);
  const r = row[0];
  if (!r) return null;
  return {
    ...normalizeWord(r.word, lang),
    progress: r.progress ?? null,
  };
}

// Create a custom user-private word. Limited to a small whitelist of safe
// fields — users can't backfill arbitrary translations into the global set.
export async function createUserWord(
  db: DB,
  userId: string,
  input: {
    french: string;
    translation: string;
    level?: LanguageLevel | undefined;
    category?: string | undefined;
    partOfSpeech?: string | undefined;
    gender?: string | null | undefined;
    exampleFr?: string | null | undefined;
    exampleRu?: string | null | undefined;
  },
) {
  const [created] = await db
    .insert(words)
    .values({
      french: input.french.trim().slice(0, 255),
      translation: input.translation.trim().slice(0, 255),
      level: input.level ?? 'A1',
      category: (input.category ?? 'custom').trim().slice(0, 100),
      partOfSpeech: input.partOfSpeech ?? 'noun',
      gender: input.gender ?? null,
      exampleFr: input.exampleFr ?? null,
      exampleRu: input.exampleRu ?? null,
      isActive: true,
      createdByUserId: userId,
    })
    .returning();
  if (!created) throw new Error('Failed to create word');
  return created;
}

// Update a custom user-private word. Same whitelist as create. Owner-only.
export async function updateUserWord(
  db: DB,
  userId: string,
  wordId: string,
  patch: {
    french?: string;
    translation?: string;
    level?: LanguageLevel | undefined;
    category?: string | undefined;
    partOfSpeech?: string | undefined;
    gender?: string | null | undefined;
    exampleFr?: string | null | undefined;
    exampleRu?: string | null | undefined;
  },
) {
  const target = await db.query.words.findFirst({
    where: eq(words.id, wordId),
    columns: { createdByUserId: true },
  });
  if (!target) throw new Error('Word not found');
  if (target.createdByUserId !== userId) throw new Error('Not authorized');

  const updates: Record<string, unknown> = {};
  if (patch.french      !== undefined) updates['french']      = patch.french.trim().slice(0, 255);
  if (patch.translation !== undefined) updates['translation'] = patch.translation.trim().slice(0, 255);
  if (patch.level       !== undefined) updates['level']       = patch.level;
  if (patch.category    !== undefined) updates['category']    = patch.category.trim().slice(0, 100);
  if (patch.partOfSpeech !== undefined) updates['partOfSpeech'] = patch.partOfSpeech;
  if (patch.gender      !== undefined) updates['gender']      = patch.gender;
  if (patch.exampleFr   !== undefined) updates['exampleFr']   = patch.exampleFr;
  if (patch.exampleRu   !== undefined) updates['exampleRu']   = patch.exampleRu;

  if (Object.keys(updates).length === 0) return;
  await db.update(words).set(updates).where(eq(words.id, wordId));
}

// Delete a custom user-private word. Only owners can delete their own.
export async function deleteUserWord(db: DB, userId: string, wordId: string) {
  const target = await db.query.words.findFirst({
    where: eq(words.id, wordId),
    columns: { createdByUserId: true },
  });
  if (!target) throw new Error('Word not found');
  if (target.createdByUserId !== userId) throw new Error('Not authorized');
  await db.delete(words).where(eq(words.id, wordId));
}

// Restart a word — reset its SRS progress so it re-enters the learning
// rotation. Used for mastered words the user wants to revisit.
export async function restartWord(db: DB, userId: string, wordId: string) {
  const existing = await db.query.wordProgress.findFirst({
    where: and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)),
  });
  const now = new Date();
  if (!existing) {
    await db.insert(wordProgress).values({
      userId,
      wordId,
      status: 'learning',
      easinessFactor: '2.50',
      interval: 1,
      repetitions: 0,
      nextReview: now,
      lastReviewed: now,
      correctCount: 0,
      incorrectCount: 0,
    });
    return;
  }
  // Reset SRS state. Preserve historical counters (correct/incorrect) so
  // we keep an honest progress trail; status moves back to learning.
  await db
    .update(wordProgress)
    .set({
      status: 'learning',
      easinessFactor: '2.50',
      interval: 1,
      repetitions: 0,
      nextReview: now,
    })
    .where(and(eq(wordProgress.userId, userId), eq(wordProgress.wordId, wordId)));
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
