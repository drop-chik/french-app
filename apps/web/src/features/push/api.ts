import { apiRequest } from '../../lib/apiClient';

export interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export const pushApi = {
  publicKey: () => apiRequest<{ publicKey: string }>('/push/public-key'),
  subscribe: (body: SubscribeBody) =>
    apiRequest<{ ok: boolean; id: string }>('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  unsubscribe: (endpoint: string) =>
    apiRequest<{ ok: boolean }>('/push/subscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),
  test: () =>
    apiRequest<{ sent: number; failed: number; pruned: number }>('/push/test', {
      method: 'POST',
    }),
};
