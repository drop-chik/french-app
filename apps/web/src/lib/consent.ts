/**
 * Cookie / analytics consent — a minimal GDPR-respecting layer.
 *
 * The bar for an EU-targeting product (France/Belgium = our actual audience):
 *  - Strictly necessary cookies (auth refresh token, theme, language)
 *    don't need consent and are not gated here.
 *  - Anything that tracks behaviour (Sentry events, PostHog page-views,
 *    Vercel Analytics) does need consent. `initSentry` / `ensureInit`
 *    in lib/analytics call `hasConsent()` before booting their SDKs.
 *
 * Tri-state: `null` = user hasn't decided yet (banner shows),
 * `'accepted'` = full opt-in, `'rejected'` = telemetry stays off.
 * Stored in localStorage so the choice survives reloads. A small
 * pub-sub lets the banner and the analytics shims react to changes
 * (e.g. the moment the user clicks Accept, Sentry boots without a
 * reload).
 */

const KEY = 'frenchup:consent';
export type ConsentValue = 'accepted' | 'rejected';

type Listener = (value: ConsentValue | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === 'accepted' || raw === 'rejected') return raw;
    return null;
  } catch {
    return null;
  }
}

export function hasConsent(): boolean {
  return getConsent() === 'accepted';
}

export function setConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(KEY, value);
  } catch { /* private-mode storage blocked */ }
  for (const fn of listeners) fn(value);
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onConsentChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
