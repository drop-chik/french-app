import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@french-app/shared-types';

interface AuthState {
  accessToken: string | null;
  user: Pick<User, 'id' | 'email' | 'name' | 'level' | 'placementTestDone' | 'role'> | null;
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
      setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : state.user })),
      clearAuth: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'french-app-auth',
      // Only persist accessToken and user — not isAuthenticated (derived)
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
