import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@french-app/shared-types';
import { setSentryUser } from '../../lib/sentry';
import { identifyUser, resetAnalytics } from '../../lib/analytics';

interface AuthState {
  accessToken: string | null;
  user: Pick<User, 'id' | 'email' | 'name' | 'level' | 'placementTestDone' | 'role' | 'tag'> | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthState['user']) => void;
  updateUser: (updates: Partial<AuthState['user']>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (accessToken, user) => {
        set({ accessToken, user, isAuthenticated: true });
        // Tag Sentry events with the signed-in user so we can correlate
        // production errors with specific accounts during triage.
        if (user) {
          setSentryUser({ id: user.id, email: user.email });
          identifyUser(user.id, { level: user.level, role: user.role });
        }
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : state.user })),
      clearAuth: () => {
        set({ accessToken: null, user: null, isAuthenticated: false });
        setSentryUser(null);
        resetAnalytics();
      },
    }),
    {
      name: 'french-app-auth',
      // Only persist accessToken and user — not isAuthenticated (derived)
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // On page reload, re-attach the user to Sentry from persisted state.
      onRehydrateStorage: () => (state) => {
        if (state?.user) setSentryUser({ id: state.user.id, email: state.user.email });
      },
    },
  ),
);
