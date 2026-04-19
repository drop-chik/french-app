import { useAuthStore } from '../features/auth/authStore';

const BASE = '/api';

let refreshPromise: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = (await res.json()) as { accessToken: string };
  // Update store with new token (keep existing user)
  const { user } = useAuthStore.getState();
  useAuthStore.getState().setAuth(data.accessToken, user!);
  return data.accessToken;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const makeRequest = async (token: string | null) => {
    const hasBody = options.body !== undefined && options.body !== null;
    return fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      credentials: 'include',
    });
  };

  let token = useAuthStore.getState().accessToken;
  let res = await makeRequest(token);

  // If 401 — try to refresh once
  if (res.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
      }
      token = await refreshPromise;
      res = await makeRequest(token);
    } catch {
      // Refresh failed — clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error((err as { error?: string }).error ?? 'Request failed');
  }

  return res.json() as Promise<T>;
}

export async function apiRequestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const token = useAuthStore.getState().accessToken;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Request failed');
  return res.blob();
}
