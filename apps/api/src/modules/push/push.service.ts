import webpush from 'web-push';
import { eq, and } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { pushSubscriptions } from '../../db/schema/index.js';

/**
 * Web-Push integration. VAPID keys come from env. Subscriptions are stored
 * per device — same user can have many (laptop + phone). When a push delivery
 * fails with 404/410 the subscription is removed (the browser unregistered).
 */

const VAPID_PUBLIC = process.env['VAPID_PUBLIC_KEY'] ?? '';
const VAPID_PRIVATE = process.env['VAPID_PRIVATE_KEY'] ?? '';
const VAPID_SUBJECT = process.env['VAPID_SUBJECT'] ?? 'mailto:admin@example.com';

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID keys not set — push notifications disabled');
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  configured = true;
  return true;
}

export function getPublicKey(): string {
  return VAPID_PUBLIC;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function saveSubscription(
  db: DB,
  userId: string,
  sub: SubscriptionInput,
  userAgent: string | null,
): Promise<{ ok: true; id: string }> {
  // Upsert by endpoint — if the same browser re-subscribes, link to the
  // current user (could differ if user logged out and back in as someone else).
  const [row] = await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent?.slice(0, 255) ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: userAgent?.slice(0, 255) ?? null,
      },
    })
    .returning({ id: pushSubscriptions.id });

  return { ok: true, id: row!.id };
}

export async function deleteSubscription(
  db: DB,
  userId: string,
  endpoint: string,
): Promise<void> {
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;       // route to open when the user taps the notification
  tag?: string;       // collapse-key — same tag replaces previous notification
  icon?: string;
}

/**
 * Send a push to every subscription the user has registered. Returns the
 * number of successful deliveries. Subscriptions returning 404/410 are
 * automatically removed (browser unsubscribed without telling us).
 */
export async function sendToUser(
  db: DB,
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number; pruned: number }> {
  if (!ensureConfigured()) return { sent: 0, failed: 0, pruned: 0 };

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sent = 0;
  let failed = 0;
  let pruned = 0;
  const stalePending: string[] = [];

  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      const e = err as { statusCode?: number };
      if (e.statusCode === 404 || e.statusCode === 410) {
        stalePending.push(s.endpoint);
        pruned++;
      } else {
        failed++;
        console.warn('[push] send failed:', err);
      }
    }
  }));

  // Prune stale subscriptions
  for (const ep of stalePending) {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, ep));
  }

  // Mark surviving subs as "used now"
  if (sent > 0) {
    const now = new Date();
    for (const s of subs) {
      if (!stalePending.includes(s.endpoint)) {
        await db.update(pushSubscriptions).set({ lastUsedAt: now }).where(eq(pushSubscriptions.id, s.id));
      }
    }
  }

  return { sent, failed, pruned };
}
