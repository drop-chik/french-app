import { useAuthStore } from '../features/auth/authStore';

const BASE = '/api';

// Default timeout — 30s covers normal requests. AI endpoints (writing
// feedback, conversation, image generation) should pass a longer timeout
// via `options.signal` or accept the default and rely on the abort wrapper.
const DEFAULT_TIMEOUT_MS = 30_000;

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

interface ApiOptions extends RequestInit {
  /** Override the default request timeout (ms). 0 disables the timeout. */
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const makeRequest = async (token: string | null) => {
    const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
    // If caller already supplied a signal, respect it; otherwise auto-abort
    // after timeoutMs so a hung backend doesn't freeze the UI forever.
    const controller = fetchOptions.signal ? null : new AbortController();
    const timer = controller && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;
    try {
      return await fetch(`${BASE}${path}`, {
        ...fetchOptions,
        signal: fetchOptions.signal ?? controller?.signal ?? null,
        headers: {
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...fetchOptions.headers,
        },
        credentials: 'include',
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  let token = useAuthStore.getState().accessToken;
  let res: Response;
  try {
    res = await makeRequest(token);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  }

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
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    const code = (err as { error?: string }).error;
    const message = (err as { message?: string }).message;
    // Surface a structured error so callers (or a global handler) can
    // tell apart "auth gate" failures from generic 5xx noise.
    const e = new Error(message ?? code ?? 'Request failed') as Error & {
      code?: string;
      status?: number;
    };
    if (code) e.code = code;
    e.status = res.status;
    // Email-verify gate: broadcast so a global listener can pop the
    // verify banner / re-send modal regardless of which page fired the
    // request.
    if (code === 'EMAIL_NOT_VERIFIED' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('email-verify-required'));
    }
    throw e;
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
