/**
 * Streak-reminder cron job.
 *
 * Finds users with an alive streak (activity yesterday) who haven't studied
 * today yet, and pushes them a notification. Subscriptions returning 404/410
 * are pruned by sendToUser().
 *
 * Run on Railway as a Cron service (recommended schedule: "0 18 * * *" — 18:00
 * UTC ≈ 21:00 Moscow, evening reminder). The script exits 0 on success so the
 * cron service stays healthy.
 *
 *   pnpm --filter @french-app/api streak-reminder
 *
 * Required env: DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */
import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sendToUser } from '../modules/push/push.service.js';

interface CandidateRow {
  id: string;
  name: string;
  [key: string]: unknown;
}

const startedAt = Date.now();
console.log(`[streak-reminder] start at ${new Date().toISOString()}`);

// One query: users with at least one push subscription, who studied yesterday
// (UTC) but not today. That's exactly the population whose streak is alive and
// about to break if they don't open the app.
const candidates = await db.execute<CandidateRow>(sql`
  SELECT u.id, u.name
  FROM users u
  WHERE EXISTS (
    SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = u.id
  )
  AND EXISTS (
    SELECT 1 FROM word_progress wp
    WHERE wp.user_id = u.id
      AND DATE(wp.last_reviewed AT TIME ZONE 'UTC') = (CURRENT_DATE AT TIME ZONE 'UTC') - INTERVAL '1 day'
  )
  AND NOT EXISTS (
    SELECT 1 FROM word_progress wp
    WHERE wp.user_id = u.id
      AND DATE(wp.last_reviewed AT TIME ZONE 'UTC') = (CURRENT_DATE AT TIME ZONE 'UTC')
  )
`);

const rows = (candidates as { rows: CandidateRow[] }).rows ?? [];
console.log(`[streak-reminder] candidates: ${rows.length}`);

let totalSent = 0;
let totalFailed = 0;
let totalPruned = 0;

for (const user of rows) {
  const firstName = (user.name ?? '').trim().split(/\s+/)[0] ?? '';
  const greeting = firstName ? `${firstName}, ` : '';
  const result = await sendToUser(db, user.id, {
    title: '🔥 Не теряй серию!',
    body: `${greeting}твоя серия ждёт — потрать 5 минут на повторение и удержи streak.`,
    url: '/vocabulary',
    tag: 'streak-reminder',
  });
  totalSent += result.sent;
  totalFailed += result.failed;
  totalPruned += result.pruned;
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(
  `[streak-reminder] done in ${elapsed}s — sent=${totalSent} failed=${totalFailed} pruned=${totalPruned}`,
);

process.exit(0);
