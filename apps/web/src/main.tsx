import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter, Link } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { Providers } from './app/providers';
import { initSentry } from './lib/sentry';
import './styles/global.css';

// Init error tracking before anything else so render-time crashes are captured.
// No-op when VITE_SENTRY_DSN is not set (dev, previews).
initSentry();

// Catch async errors React's ErrorBoundary doesn't see (rejected promises,
// stale event handlers throwing). These are common sources of "the app just
// silently broke" bugs. Both feed into Sentry via reportError above.
window.addEventListener('error', (event) => {
  // Filter out script-loading errors from third parties (extensions, etc).
  if (event.error instanceof Error) {
    void import('./lib/sentry').then((m) => m.reportError(event.error, {
      kind: 'window.error',
      message: event.message,
    }));
  }
});

window.addEventListener('unhandledrejection', (event) => {
  void import('./lib/sentry').then((m) => m.reportError(event.reason, {
    kind: 'unhandledrejection',
  }));
});

/**
 * Custom 404 component. The default TanStack Router fallback is just bare
 * text "Not Found", which collides with our stale-SW scenario: a user with
 * an old precached bundle clicking a deep-link to a route the old version
 * didn't have (typical case: email verification link after a deploy). Show
 * a real page with a "Reload" hint that bypasses the SW.
 */
function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        fontFamily: 'var(--font-sans, system-ui)',
        color: 'var(--color-text-primary, #111)',
        background: 'var(--color-bg, #fff)',
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0 }}>404</h1>
      <p style={{ maxWidth: 480, lineHeight: 1.5, color: 'var(--color-text-secondary, #666)' }}>
        Страница не найдена. Если ты пришёл сюда по ссылке из письма после недавнего обновления —
        возможно, браузер закэшировал старую версию приложения. Попробуй <strong>Ctrl + Shift + R</strong>
        {' '}или открой ссылку в режиме инкогнито.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => {
            // Aggressive recovery for stale-PWA users: nuke SW + caches and reload.
            // Safe because we don't store anything user-critical in CacheStorage —
            // auth/JWT lives in cookie + memory, app state is server-side.
            void (async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map((r) => r.unregister()));
                }
                if ('caches' in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
              } finally {
                window.location.reload();
              }
            })();
          }}
          style={{
            padding: '10px 16px',
            border: '1px solid var(--color-border, #ddd)',
            borderRadius: 8,
            background: 'var(--color-brand, #1d4ed8)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Перезагрузить
        </button>
        <Link
          to="/"
          style={{
            padding: '10px 16px',
            border: '1px solid var(--color-border, #ddd)',
            borderRadius: 8,
            color: 'var(--color-text-primary, #111)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

const router = createRouter({ routeTree, defaultNotFoundComponent: NotFound });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
);
