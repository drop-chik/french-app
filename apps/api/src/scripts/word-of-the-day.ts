/**
 * Word-of-the-day push cron.
 *
 * Picks one French word per user from their current CEFR level (or a
 * notch above if they're close to promotion), prioritising words they
 * have NOT seen yet via the SRS. Sends a daily web push with the
 * word, translation and an IPA hint.
 *
 * Idempotent for a single calendar day via the `wotd:{userId}:{YYYY-MM-DD}`
 * dedupeKey in activity_events — re-running the cron won't send a
 * second push.
 *
 * Run on Railway as a Cron service alongside streak-reminder /
 * weekly-digest:
 *   Schedule: "0 8 * * *"  (08:00 UTC ≈ 11:00 Moscow, morning push)
 *   Start:    node dist/scripts/word-of-the-day.js
 *
 * Env: DATABASE_URL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.
 * Without VAPID keys sendToUser is a no-op (logged + skipped).
 *
 * Debug: WOTD_DEBUG=1 forces a re-send even if the dedupeKey row exists
 *        (handy after a deploy to test push delivery on a single user).
 */
import 'dotenv/config';
import { and, eq, sql, isNull, notInArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sendToUser } from '../modules/push/push.service.js';
import { users, words, wordProgress, activityEvents, pushSubscriptions } from '../db/schema/index.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
type Level = typeof LEVELS[number];
const debug = process.env['WOTD_DEBUG'] === '1';

interface Candidate {
  id: string;
  email: string;
  name: string;
  level: Level;
  uiLanguage: string;
}

const todayKey = new Date().toISOString().slice(0, 10);
const startedAt = Date.now();
console.log(`[wotd] start at ${new Date().toISOString()}${debug ? ' (DEBUG)' : ''}; key=${todayKey}`);

// Pull users that have at least one push subscription. No subs = no
// point even computing a word for them.
const rows = await db
  .selectDistinct({
    id: users.id,
    email: users.email,
    name: users.name,
    level: users.level,
    uiLanguage: users.uiLanguage,
  })
  .from(users)
  .innerJoin(pushSubscriptions, eq(pushSubscriptions.userId, users.id));
const candidates = rows as Candidate[];
console.log(`[wotd] ${candidates.length} subscribed users to consider`);

let sent = 0;
let skipped = 0;
let noWord = 0;
let pushFailed = 0;

for (const u of candidates) {
  try {
    const dedupeKey = `wotd:${u.id}:${todayKey}`;
    if (!debug) {
      // Skip users who already got today's push (cron rerun, retry)
      const [existing] = await db
        .select({ id: activityEvents.id })
        .from(activityEvents)
        .where(eq(activityEvents.dedupeKey, dedupeKey))
        .limit(1);
      if (existing) { skipped++; continue; }
    }

    // Find a word at the user's level that they haven't been exposed to
    // yet (no wordProgress row). Fallback: a word they've seen but is
    // marked 'new' or 'learning' (anything not yet mastered).
    const seenIds = await db
      .select({ wordId: wordProgress.wordId })
      .from(wordProgress)
      .where(eq(wordProgress.userId, u.id));
    const seenSet = new Set(seenIds.map((r) => r.wordId));

    // First-pass: unseen words at level
    let pool = await db
      .select({ id: words.id, french: words.french, translation: words.translation, ipa: words.ipa })
      .from(words)
      .where(and(eq(words.level, u.level), eq(words.isActive, true)));
    pool = pool.filter((w) => !seenSet.has(w.id));

    if (pool.length === 0) {
      // Fallback: any active word at level
      pool = await db
        .select({ id: words.id, french: words.french, translation: words.translation, ipa: words.ipa })
        .from(words)
        .where(and(eq(words.level, u.level), eq(words.isActive, true)));
    }
    if (pool.length === 0) { noWord++; continue; }

    const pick = pool[Math.floor(Math.random() * pool.length)]!;

    // Compose push (i18n minimal — only RU vs EN body)
    const isRu = u.uiLanguage !== 'en';
    const title = isRu ? 'Слово дня 📘' : 'Word of the day 📘';
    const ipa = pick.ipa ? ` · /${pick.ipa}/` : '';
    const body = `${pick.french}${ipa} — ${pick.translation}`;

    const result = await sendToUser(db, u.id, {
      title, body, url: '/vocabulary', tag: 'wotd',
    });

    if (result.sent === 0) { pushFailed++; continue; }
    sent++;

    // Record the wotd event so we don't double-send (dedupeKey enforces it)
    await db.insert(activityEvents).values({
      userId: u.id,
      type: 'streak',  // Reuse existing type — wotd isn't a public feed event,
                       // we only persist it as a dedupe marker. notifyFollowers
                       // does NOT fan it out (isHighValue requires streak.days
                       // ∈ [30, 100, 365], which we don't set).
      payload: { wotd: pick.french, level: u.level } as unknown as Record<string, string>,
      dedupeKey,
    }).onConflictDoNothing();
  } catch (err) {
    console.warn(`  ${u.email}: ${(err as Error).message.slice(0, 100)}`);
    pushFailed++;
  }
}

const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\n[wotd] sent=${sent} skipped=${skipped} noWord=${noWord} pushFailed=${pushFailed} (${elapsed}s)`);
process.exit(0);
