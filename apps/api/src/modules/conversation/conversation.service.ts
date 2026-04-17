import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { conversationSessions } from '../../db/schema/index.js';
import type { LanguageLevel } from '@french-app/shared-types';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  corrections?: Correction[];
  timestamp: string;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

const SYSTEM_PROMPT = (level: LanguageLevel, topic: string) => `
Tu es un tuteur de français bienveillant et patient. Tu parles UNIQUEMENT en français.

Niveau de l'étudiant: ${level}
Sujet de conversation: ${topic}

Règles importantes:
1. Réponds TOUJOURS en JSON avec ce format exact:
{
  "message": "ta réponse en français ici",
  "corrections": [
    {
      "original": "ce que l'étudiant a écrit",
      "corrected": "la version correcte",
      "explanation": "explication courte en russe"
    }
  ]
}
2. Les corrections ne concernent QUE les fautes de l'étudiant dans son DERNIER message.
3. Si l'étudiant n'a pas fait de fautes, "corrections" doit être un tableau vide [].
4. Adapte ton vocabulaire au niveau ${level}.
5. Pose des questions pour encourager la conversation.
6. Sois encourageant et positif.
`.trim();

export async function createSession(db: DB, userId: string, topic: string, level: LanguageLevel) {
  const [session] = await db
    .insert(conversationSessions)
    .values({ userId, topic, level, messages: [] })
    .returning({ id: conversationSessions.id });
  return session;
}

export async function getSession(db: DB, userId: string, sessionId: string) {
  return db.query.conversationSessions.findFirst({
    where: eq(conversationSessions.id, sessionId),
  });
}

export async function getSessions(db: DB, userId: string) {
  return db.query.conversationSessions.findMany({
    where: eq(conversationSessions.userId, userId),
  });
}

export async function deleteSession(db: DB, userId: string, sessionId: string) {
  const session = await db.query.conversationSessions.findFirst({
    where: eq(conversationSessions.id, sessionId),
  });
  if (!session || session.userId !== userId) return false;
  await db.delete(conversationSessions).where(eq(conversationSessions.id, sessionId));
  return true;
}

export async function* streamReply(
  db: DB,
  userId: string,
  sessionId: string,
  userMessage: string,
): AsyncGenerator<string> {
  const session = await db.query.conversationSessions.findFirst({
    where: eq(conversationSessions.id, sessionId),
  });

  if (!session || session.userId !== userId) {
    throw new Error('Session not found');
  }

  const history = (session.messages as ChatMessage[]) ?? [];

  // Build OpenAI messages
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT(session.level as LanguageLevel, session.topic) },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  // Stream from GPT-4o
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      fullText += delta;
      yield delta;
    }
  }

  // Parse and save
  let parsed: { message: string; corrections: Correction[] } = {
    message: fullText,
    corrections: [],
  };

  try {
    parsed = JSON.parse(fullText);
  } catch {
    // if JSON parse fails, use raw text
    parsed.message = fullText;
  }

  const userMsg: ChatMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  };

  const assistantMsg: ChatMessage = {
    role: 'assistant',
    content: parsed.message,
    corrections: parsed.corrections ?? [],
    timestamp: new Date().toISOString(),
  };

  const updatedMessages = [...history, userMsg, assistantMsg];

  await db
    .update(conversationSessions)
    .set({ messages: updatedMessages })
    .where(eq(conversationSessions.id, sessionId));
}
