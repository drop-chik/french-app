import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
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

const router = createRouter({ routeTree });

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
