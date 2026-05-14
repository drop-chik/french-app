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

export type CorrectionType =
  | 'grammar'       // wrong tense, agreement, conjugation
  | 'vocabulary'    // wrong word choice
  | 'spelling'      // wrong letters / accents
  | 'word_order'    // wrong sentence structure
  | 'language'      // not French at all — special case, treated as a warning
  | 'register'      // tu/vous mismatch, informal-formal slip
  | 'punctuation';  // missing/wrong punctuation

export interface Correction {
  type?: CorrectionType;
  original: string;
  corrected: string;
  explanation: string;
}

const SYSTEM_PROMPT = (level: LanguageLevel, topic: string) => `
Tu es un tuteur de français bienveillant mais STRICT. Niveau de l'étudiant: ${level}. Sujet de conversation: ${topic}.

━━━ RÈGLES DE LANGUE — PRIORITÉ ABSOLUE ━━━

L'étudiant DOIT écrire en français. Tu DOIS détecter et signaler activement quand ce n'est pas le cas.

CAS 1 — Message PAS en français (russe, anglais, espagnol, écriture cyrillique/arabe/chinoise, etc.):
  • Ta réponse "message" demande gentiment à l'étudiant de réessayer en français.
  • Si tu peux comprendre l'intention, propose la traduction française à utiliser.
  • Tu ne réponds PAS au contenu du message tant qu'il n'est pas en français.
  • Tu ajoutes UNE entrée dans "corrections" avec type="language",
    original = le message de l'étudiant,
    corrected = la version française qu'il aurait dû écrire (si possible) ou "" si incompréhensible,
    explanation = "Это сообщение не на французском. Попробуй написать по-французски." (ou variation).

CAS 2 — Message complètement incompréhensible (gibberish, suites aléatoires de lettres comme "asdfgh", "qwerty", emojis seuls):
  • Demande gentiment de réessayer.
  • Ajoute correction type="language" avec explanation expliquant que le message ne se comprend pas.

CAS 3 — Message en français MAIS avec des fautes:
  • Réponds normalement au contenu.
  • Liste les vraies fautes (max 4) dans "corrections" avec le bon "type".

CAS 4 — Message en français correct:
  • Réponds normalement. "corrections": [].

━━━ TYPES DE CORRECTION ━━━

Choisis UN type par correction:
  • "grammar"       — спряжение, согласование, время, артикль
  • "vocabulary"    — неверный выбор слова
  • "spelling"      — ошибка в написании / диакритике
  • "word_order"    — порядок слов
  • "register"      — путаница tu/vous, формальное/неформальное
  • "punctuation"   — пунктуация
  • "language"      — не на французском (особый случай, см. выше)

━━━ CONVERSATION ━━━

- Adapte le vocabulaire et la grammaire au niveau ${level} (A1 = présent simple, vocabulaire élémentaire; B2 = nuances et idiomes).
- Pose des questions ouvertes pour relancer.
- Reste sur le sujet "${topic}". Si l'étudiant dévie BEAUCOUP, ramène doucement après avoir répondu à son message.
- Sois encourageant. Si l'étudiant n'a fait aucune faute pendant plusieurs tours, mentionne-le brièvement.

━━━ FORMAT DE RÉPONSE (JSON STRICT) ━━━

{
  "message": "ta réponse en français",
  "corrections": [
    {
      "type": "grammar"|"vocabulary"|"spelling"|"word_order"|"register"|"punctuation"|"language",
      "original": "ce que l'étudiant a écrit (exact, court)",
      "corrected": "la version correcte",
      "explanation": "объяснение на русском, максимум 15 слов"
    }
  ]
}

Maximum 4 corrections par message. Les plus importantes d'abord. Pas de markdown dans "message". Pas de texte hors-JSON.
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
