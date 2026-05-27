import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useMemo, type ReactNode } from 'react';
import { ToastProvider, useToast } from '../shared/components/Toast';
import { PWAUpdater } from '../shared/components/PWAUpdater';
import { useI18n } from '../shared/i18n';

export function Providers({ children }: { children: ReactNode }) {
  // ToastProvider must wrap the QueryClient so the global mutation error
  // handler (defined inside) can call useToast(). The order matters —
  // ToastProvider outside → QueryClient inside.
  return (
    <ToastProvider>
      <QueryProviderInner>{children}</QueryProviderInner>
      {/* PWAUpdater is a floating banner, no layout impact — it self-mounts
          a fixed-position element only when a new SW is waiting. Place it
          outside the route tree so it survives navigations. */}
      <PWAUpdater />
    </ToastProvider>
  );
}

function QueryProviderInner({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { t } = useI18n();

  // Stable QueryClient instance — built once per provider mount with the
  // current toast + i18n closures. We could rebuild on language change,
  // but the only consumer is mutation error fallback which uses one key
  // (`t.errors.saveFailed`) — re-render-safe to read at handler-call time.
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        // staleTime 5min covers profile/streak/levels/achievements/social —
        // they don't need refetching between page navigations within a session.
        staleTime: 1000 * 60 * 5,
        retry: 1,
        // Refetching on every tab switch was adding ~50 extra requests per
        // session; the 5min staleTime already covers freshness. Pages that
        // need real-time freshness override per-query.
        refetchOnWindowFocus: false,
        // When the NetworkBanner offline state ends, every query rehydrates.
        refetchOnReconnect: 'always',
      },
    },
    // Global mutation error fallback. v5 behaviour: this fires ONLY when a
    // mutation lacks its own onError, so already-handled mutations
    // (WritingEditor, Conversation, ProfilePage delete-account) keep their
    // tailored messages without a duplicate toast.
    //
    // Closes a long-tail of silent failures: dictionary mark/restart, drill
    // submissions, listening submit, placement save, vocabulary record-answer,
    // social follow/unfollow, reading save-progress. All used to fail mute.
    mutationCache: new MutationCache({
      onError: (err) => {
        // Network failures already produce the NetworkBanner; suppress to
        // avoid double-messaging.
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        const msg = err instanceof Error ? err.message : '';
        // Specific server messages worth showing verbatim (auth gone,
        // validation). Generic Request failed → friendly fallback.
        if (msg && !msg.toLowerCase().includes('request failed') && msg.length < 120) {
          toast.error(msg);
        } else {
          toast.error(t.errors.saveFailed);
        }
      },
    }),
  }), [toast, t]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
