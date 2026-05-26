/**
 * Sentry initialisation for the API server. Gated on SENTRY_DSN env — no-op
 * when unset (dev, preview, any worker without telemetry). Loaded inside
 * server.ts before route registration so errors during boot get captured.
 *
 * Fastify integration: we hook into the `onError` lifecycle plus the
 * process-level `uncaughtException` / `unhandledRejection` handlers so a
 * crashing worker doesn't disappear silently into the Railway log.
 */
import * as Sentry from '@sentry/node';
import type { FastifyInstance } from 'fastify';

const DSN = process.env['SENTRY_DSN'];
const ENV = process.env['NODE_ENV'] ?? 'development';

let initialised = false;

export function initSentry(): void {
  if (!DSN || initialised) return;
  Sentry.init({
    dsn: DSN,
    environment: ENV,
    // Errors only — performance tracing off until we have a budget for it.
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
  initialised = true;

  // Catch crashes that bypass Fastify's onError (e.g. setTimeout callbacks,
  // unhandled promise rejections from background tasks).
  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
  });
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason);
  });
}

/**
 * Wires a Fastify `onError` hook so any error returned by a route handler
 * also lands in Sentry, with userId attached when authenticated.
 */
export function attachToFastify(fastify: FastifyInstance): void {
  if (!DSN) return;
  fastify.addHook('onError', (request, _reply, error, done) => {
    Sentry.withScope((scope) => {
      scope.setTag('method', request.method);
      scope.setTag('route', request.routeOptions?.url ?? request.url);
      // request.user is populated by the auth plugin's preHandler chain.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (request as any).user?.userId as string | undefined;
      if (userId) scope.setUser({ id: userId });
      Sentry.captureException(error);
    });
    done();
  });
}
