/**
 * Adaptive level-up test.
 *
 * Lets a learner *opt in* to a short proficiency check rather than wait
 * for the auto-promotion threshold (80% mastery). The test pulls a
 * small random sample from the placement-test bank covering the user's
 * current level + a few questions from the next level (to verify they
 * can handle slightly harder material).
 *
 * Threshold: ≥ 70% correct → promote one CEFR step.
 *
 * Uses the same no-demote rule as savePlacementResult — passing the
 * test only moves a user UP, never down. Failing it returns
 * weak-area feedback so they know where to focus.
 *
 * Available from /profile/promotion-status when ratio ≥ 0.4 (40% of
 * the level mastered) — gives motivated learners a shortcut to C1/C2
 * without grinding the full vocabulary.
 */
import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users, placementTests } from '../../db/schema/index.js';
import { placementQuestions } from '../../db/seed/placement-test.js';
import { recordActivity } from '../social/activity.service.js';

const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = typeof ORDER[number];
const PASS_THRESHOLD = 0.7;
const TEST_SIZE = 15;

export interface TestQuestion {
  id: string;
  level: string;
  type: string;
  question: string;
  options: string[];
}

export interface TestResult {
  passed: boolean;
  score: number;
  correct: number;
  total: number;
  fromLevel: string;
  toLevel: string | null;
  promoted: boolean;
  weakAreas: Array<{ level: string; type: string; missed: number }>;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

// Build the question set for the user's current level. Bias 70% toward
// the current level + 30% toward the next-up level so passing actually
// signals readiness for the harder tier.
export function generateLevelTestQuestions(currentLevel: Level): TestQuestion[] {
  const currentIdx = ORDER.indexOf(currentLevel);
  const nextLevel = currentIdx < ORDER.length - 1 ? ORDER[currentIdx + 1] : null;

  const currentBank = placementQuestions.filter((q) => q.level === currentLevel);
  const nextBank = nextLevel ? placementQuestions.filter((q) => q.level === nextLevel) : [];

  const nCurrent = nextLevel ? Math.round(TEST_SIZE * 0.7) : TEST_SIZE;
  const nNext = TEST_SIZE - nCurrent;

  const picked = [
    ...pickRandom(currentBank, Math.min(nCurrent, currentBank.length)),
    ...pickRandom(nextBank, Math.min(nNext, nextBank.length)),
  ];

  return picked.map((q) => ({
    id: q.id, level: q.level, type: q.type, question: q.question, options: q.options,
  }));
}

export async function submitLevelTest(
  db: DB,
  userId: string,
  answers: Record<string, string>,
): Promise<TestResult> {
  const [user] = await db.select({ level: users.level }).from(users).where(eq(users.id, userId));
  if (!user) throw new Error('User not found');
  const fromLevel = user.level as Level;
  const fromIdx = ORDER.indexOf(fromLevel);
  const toLevel: Level | null = fromIdx < ORDER.length - 1 ? (ORDER[fromIdx + 1] ?? null) : null;

  // Score against the canonical bank — clients cannot send fake ids
  let correct = 0;
  let total = 0;
  const missed: Record<string, number> = {};
  for (const [qid, ans] of Object.entries(answers)) {
    const q = placementQuestions.find((x) => x.id === qid);
    if (!q) continue;
    total++;
    if (ans === q.correct) {
      correct++;
    } else {
      const key = `${q.level}-${q.type}`;
      missed[key] = (missed[key] ?? 0) + 1;
    }
  }

  const score = total > 0 ? correct / total : 0;
  const passed = score >= PASS_THRESHOLD;
  let promoted = false;

  if (passed && toLevel) {
    // Update user level + log the test for audit (same shape as
    // placement_tests row so it shows up in placement history).
    await db.update(users).set({ level: toLevel }).where(eq(users.id, userId));
    await db.insert(placementTests).values({
      userId,
      answers: { ...answers, _levelTest: true, _fromLevel: fromLevel, _correct: correct, _total: total } as unknown as Record<string, string>,
      resultLevel: toLevel,
    });
    promoted = true;

    // Friends-feed event + push fan-out
    await recordActivity(
      db, userId, 'cefr_promoted',
      { from: fromLevel, to: toLevel, via: 'test', score: Math.round((correct / total) * 100) },
      `cefr:${fromLevel}->${toLevel}`,
    );
  } else {
    // Log failed attempt for analytics — no level change.
    await db.insert(placementTests).values({
      userId,
      answers: { ...answers, _levelTest: true, _fromLevel: fromLevel, _correct: correct, _total: total, _failed: true } as unknown as Record<string, string>,
      resultLevel: fromLevel,
    });
  }

  const weakAreas = Object.entries(missed)
    .map(([key, missedCount]) => {
      const [level, type] = key.split('-');
      return { level: level ?? '', type: type ?? '', missed: missedCount };
    })
    .sort((a, b) => b.missed - a.missed)
    .slice(0, 3);

  return {
    passed,
    score,
    correct,
    total,
    fromLevel,
    toLevel,
    promoted,
    weakAreas,
  };
}
