import { apiRequest } from '../../lib/apiClient';
import { useAuthStore } from '../auth/authStore';

const BASE = '/api';

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections?: Correction[];
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  topic: string;
  level: string;
  messages: ChatMessage[];
  startedAt: string;
  endedAt: string | null;
}

export const conversationApi = {
  getSessions: () =>
    apiRequest<{ sessions: ConversationSession[] }>('/conversation/sessions'),

  getSession: (id: string) =>
    apiRequest<{ session: ConversationSession }>(`/conversation/sessions/${id}`),

  createSession: (topic: string, level?: string) =>
    apiRequest<{ session: ConversationSession }>('/conversation/sessions', {
      method: 'POST',
      body: JSON.stringify({ topic, level }),
    }),

  deleteSession: (id: string) =>
    apiRequest<{ ok: boolean }>(`/conversation/sessions/${id}`, { method: 'DELETE' }),

  sendMessage: async (
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ) => {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`${BASE}/conversation/sessions/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    });

    if (!res.ok || !res.body) {
      onError('Failed to send message');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6)) as {
            chunk?: string;
            done?: boolean;
            error?: string;
          };
          if (data.error) { onError(data.error); return; }
          if (data.chunk) onChunk(data.chunk);
          if (data.done) { onDone(); return; }
        } catch {
          // ignore malformed lines
        }
      }
    }
  },
};
