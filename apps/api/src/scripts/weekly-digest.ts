/**
 * Weekly-digest cron job.
 *
 * For each user with `digest_enabled=true`, `email_verified_at` not null,
 * and at least some activity in the past 7 days, send a recap email via
 * Resend. Stamps users.last_digest_sent_at so retries don't double-send.
 *
 * Run on Railway as a Cron service:
 *   Schedule: "0 9 * * 1" — Monday 09:00 UTC (~12:00 Moscow, ~10:00 Berlin)
 *   Start: node dist/scripts/weekly-digest.js
 *   Env: DATABASE_URL, RESEND_API_KEY, RESEND_FROM (optional), FRONTEND_URL
 *
 *   pnpm --filter @french-app/api weekly-digest
 *
 * Debug: WEEKLY_DIGEST_DEBUG=1 to ignore the "already sent this week" guard
 * and email everyone. WEEKLY_DIGEST_ONLY=email@example.com limits to one
 * recipient (useful for testing the template against your own inbox).
 *
 * The job exits 0 on success so the cron service stays healthy. Per-user
 * failures are logged but don't stop the run.
 */
import 'dotenv/config';
import { eq, sql, and, isNotNull, gte, isNull, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  users, wordProgress, grammarProgress, listeningProgress, readingProgress,
} from '../db/schema/index.js';
import { sendEmail, buildWeeklyDigestEmail } from '../lib/email.js';

const debug = process.env['WEEKLY_DIGEST_DEBUG'] === '1';
const only = process.env['WEEKLY_DIGEST_ONLY']?.toLowerCase().trim();
const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'https://frenchup.app';

const startedAt = Date.now();
const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
// Skip users we already digested less than 6 days ago (catches accidental
// double-runs but allows the next regular Monday).
const recentDigestCutoff = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

console.log(`[weekly-digest] start ${new Date().toISOString()}${debug ? ' (DEBUG)' : ''}${only ? ` (ONLY ${only})` : ''}`);

// Pick candidates. Requirements:
//  - verified email (we never send to unverified accounts)
//  - opted-in to digests
//  - not digested in the last 6 days
const candidates = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    uiLanguage: users.uiLanguage,
    streakCount: sql<number>`COALESCE((
      SELECT count(DISTINCT DATE(${wordProgress.lastReviewed}))
      FROM ${wordProgress}
      WHERE ${wordProgress.userId} = ${users.id}
        AND ${wordProgress.lastReviewed} >= ${weekAgo.toISOString()}
    ), 0)`,
  })
  .from(users)
  .where(and(
    isNotNull(users.emailVerifiedAt),
    eq(users.digestEnabled, true),
    or(
      isNull(users.lastDigestSentAt),
      debug ? sql`true` : sql`${users.lastDigestSentAt} < ${recentDigestCutoff.toISOString()}`,
    ),
    only ? eq(users.email, only) : sql`true`,
  ));

console.log(`[weekly-digest] ${candidates.length} candidates after filters`);

let sent = 0;
let skipped = 0;
let failed = 0;

for (const u of candidates) {
  try {
    // Pull stats in parallel. All bounded to the 7-day window.
    const [wpRows, gpRows, lpRows, rpRows] = await Promise.all([
      db
        .select({ id: wordProgress.id, status: wordProgress.status })
        .from(wordProgress)
        .where(and(
          eq(wordProgress.userId, u.id),
          gte(wordProgress.lastReviewed, weekAgo),
        )),
      db
        .select({ id: grammarProgress.id })
        .from(grammarProgress)
        .where(and(
          eq(grammarProgress.userId, u.id),
          eq(grammarProgress.status, 'completed'),
          gte(grammarProgress.completedAt, weekAgo),
        )),
      db
        .select({ id: listeningProgress.id })
        .from(listeningProgress)
        .where(and(
          eq(listeningProgress.userId, u.id),
          eq(listeningProgress.completed, true),
          gte(listeningProgress.completedAt, weekAgo),
        )),
      db
        .select({ id: readingProgress.id })
        .from(readingProgress)
        .where(and(
          eq(readingProgress.userId, u.id),
          gte(readingProgress.completedAt, weekAgo),
        )),
    ]);

    const wordsLearned = wpRows.filter((r) => r.status === 'learning' || r.status === 'review' || r.status === 'mastered').length;
    const wordsReviewed = wpRows.length;
    const grammarTopics = gpRows.length;
    const listeningExercises = lpRows.length;
    const readingTexts = rpRows.length;

    // Skip silent inactives — no value in "you did 0 things this week".
    if (
      wordsLearned === 0 && wordsReviewed === 0 &&
      grammarTopics === 0 && listeningExercises === 0 && readingTexts === 0 &&
      !debug
    ) {
      skipped++;
      continue;
    }

    const lang = (u.uiLanguage === 'en' ? 'en' : 'ru') as 'ru' | 'en';
    const unsubscribeUrl = `${FRONTEND_URL.replace(/\/$/, '')}/profile?unsub=1`;
    const mail = buildWeeklyDigestEmail(
      u.name,
      {
        wordsLearned,
        wordsReviewed,
        grammarTopics,
        listeningExercises,
        readingTexts,
        streakDays: Math.min(7, Number(u.streakCount) || 0),
        minutesActive: 0, // placeholder — we don't track timer yet
      },
      unsubscribeUrl,
      lang,
    );

    await sendEmail({
      to: u.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    await db.update(users)
      .set({ lastDigestSentAt: new Date() })
      .where(eq(users.id, u.id));

    sent++;
    console.log(`  ✓ ${u.email} — words ${wordsLearned}/${wordsReviewed}, grammar ${grammarTopics}, listening ${listeningExercises}, reading ${readingTexts}`);
  } catch (err) {
    failed++;
    console.error(`  ✕ ${u.email}:`, err instanceof Error ? err.message : err);
  }
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`[weekly-digest] done: sent=${sent} skipped=${skipped} failed=${failed} (${elapsed}s)`);
process.exit(0);
