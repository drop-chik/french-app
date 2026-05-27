import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ToastProvider } from '../shared/components/Toast';

// Defaults applied to every useQuery unless overridden per-call:
//   - staleTime 5min covers profile/streak/levels/achievements/social — they
//     don't need refetching between page navigations within a session.
//   - retry: 1 — one quick retry on transient network blip, then surface.
//   - refetchOnWindowFocus: false — refetching on every tab switch was
//     adding ~50 extra requests per session; the 5min staleTime already
//     covers freshness. Pages that need it (Dashboard plan, social feed)
//     can override per-query if real-time matters.
//   - refetchOnReconnect: 'always' — when the network comes back from the
//     NetworkBanner offline state, every page should re-pull fresh data.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
