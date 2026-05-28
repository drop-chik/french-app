/**
 * Sentry initialisation for the web client. Gated on a runtime DSN — when
 * unset (local dev, preview deploys) we skip init entirely so no events
 * leak to a wrong project and the bundle stays smaller in those builds.
 *
 * DSN is supplied at build time via `VITE_SENTRY_DSN`. Free tier (5K
 * events/month) is plenty for the current user base.
 */
import * as Sentry from '@sentry/react';

const DSN = import.meta.env['VITE_SENTRY_DSN'] as string | undefined;
const ENV = import.meta.env['MODE'] ?? 'development';

export function initSentry(): void {
  if (!DSN) {
    // eslint-disable-next-line no-console
    console.warn('[sentry] DSN missing — events will not be sent');
    return;
  }
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    // Low sample rate by default — events fire on errors only, no traces.
    // Bump later via Sentry dashboard if we need performance traces.
    tracesSampleRate: 0,
    // Don't capture sensitive bits from URLs.
    sendDefaultPii: false,
    // Verbose during initial deployment so we can confirm transport in
    // production from DevTools. Remove once a real user event has been
    // observed in the Sentry dashboard.
    debug: true,
    // Filter out noise that doesn't help debugging.
    ignoreErrors: [
      // Browser extension noise
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network blips → user already sees a UI error, no need to alert
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Aborted requests when user navigates away — expected
      'AbortError',
    ],
  });
  // eslint-disable-next-line no-console
  console.log(`[sentry] initialised (env=${ENV}, dsn host=${new URL(DSN).host})`);
  // Expose the SDK globally so we can dispatch test events from the browser
  // console without touching app code. Production-safe — Sentry's namespace
  // is harmless to surface, and the DSN is already in the bundle anyway.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).Sentry = Sentry;
}

/**
 * Attach an authenticated user to subsequent Sentry events so we can
 * correlate errors with specific accounts. Drop on logout.
 */
export function setSentryUser(user: { id: string; email: string } | null): void {
  if (!DSN) return;
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Manually report a caught error (e.g. from a try/catch where we already
 * showed the user a friendly message but still want telemetry).
 */
export function reportError(err: unknown, context?: Record<string, unknown>): void {
  if (!DSN) {
    console.error('[reportError]', err, context);
    return;
  }
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context);
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}
