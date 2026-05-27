import type { LoginRequest, RegisterRequest, AuthResponse } from '@french-app/shared-types';

const BASE_URL = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((error as { error?: string }).error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  refresh: () =>
    request<{ accessToken: string }>('/auth/refresh', { method: 'POST' }),

  logout: () =>
    request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string, lang: 'ru' | 'en') =>
    request<{ ok: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, lang }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),

  verifyEmail: (token: string) =>
    request<{ ok: boolean; alreadyVerified: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: async () => {
    // This one is authenticated → needs the access token. Use apiRequest
    // pattern from lib/apiClient by lazy-importing to keep this file's
    // top of file untouched.
    const { apiRequest } = await import('../../lib/apiClient');
    return apiRequest<{ ok: boolean }>('/auth/resend-verification', { method: 'POST' });
  },
};
