import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createSession, createSessionWithPrimer, getSessions, getSession, deleteSession, streamReply } from './conversation.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';
import { safePrompt } from '../../lib/sanitize-ai-input.js';
import type { LanguageLevel } from '@french-app/shared-types';

const createSessionSchema = z.object({
  topic: z.string().min(1).max(200),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
});

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
});

const conversationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /conversation/sessions — list user sessions
  fastify.get(
    '/sessions',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['conversation'],
        summary: 'List the user\'s conversation sessions',
        security: authorizedSecurity,
      },
    },
    async (request, reply) => {
      const sessions = await getSessions(fastify.db, request.user.userId);
      reply.send({ sessions });
    },
  );

  // POST /conversation/sessions — create new session
  fastify.post(
    '/sessions',
    {
      preHandler: [fastify.authenticate, fastify.requireEmailVerified],
      schema: {
        tags: ['conversation'],
        summary: 'Start a new AI conversation on a chosen topic',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['topic'],
          properties: {
            topic: { type: 'string', minLength: 1, maxLength: 200 },
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = createSessionSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const { value: topic, suspicious } = safePrompt(parsed.data.topic, 200);
      if (suspicious) {
        request.log.warn({ userId: request.user.userId, topic: parsed.data.topic }, 'conversation topic looks like prompt injection');
        return reply.status(400).send({ error: 'Topic invalid' });
      }
      if (!topic) return reply.status(400).send({ error: 'Topic required' });

      const level = (parsed.data.level ?? 'A1') as LanguageLevel;
      const session = await createSession(fastify.db, request.user.userId, topic, level);
      reply.status(201).send({ session });
    },
  );

  // POST /conversation/sessions/with-primer — create a session pre-loaded
  // with the just-studied vocabulary. The AI's opening message is generated
  // server-side and saved as the first message, so the user lands on a
  // chat that's already in motion.
  fastify.post(
    '/sessions/with-primer',
    {
      preHandler: [fastify.authenticate, fastify.requireEmailVerified],
      schema: {
        tags: ['conversation'],
        summary: 'Start a conversation seeded with the just-studied words',
        description: 'Creates a session, generates an AI opening that naturally uses 2-3 of the supplied words, returns session id + opening message.',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['words'],
          properties: {
            words: {
              type: 'array',
              minItems: 1,
              maxItems: 20,
              items: {
                type: 'object',
                required: ['french', 'translation'],
                properties: {
                  french: { type: 'string', minLength: 1, maxLength: 100 },
                  translation: { type: 'string', minLength: 1, maxLength: 200 },
                },
              },
            },
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { words: Array<{ french: string; translation: string }>; level?: string };
      if (!Array.isArray(body.words) || body.words.length === 0) {
        return reply.status(400).send({ error: 'words is required' });
      }
      // Drop incomplete entries before they reach the AI prompt — a
      // missing translation in the system prompt corrupts the opening.
      const sanitisedWords = body.words.filter(
        (w) => typeof w.french === 'string' && w.french.trim().length > 0
          && typeof w.translation === 'string' && w.translation.trim().length > 0,
      );
      if (sanitisedWords.length === 0) {
        return reply.status(400).send({ error: 'No valid words (each needs french + translation)' });
      }
      const level = (body.level ?? 'B1') as LanguageLevel;
      try {
        const result = await createSessionWithPrimer(fastify.db, request.user.userId, sanitisedWords, level);
        reply.status(201).send({ session: { id: result.id }, opening: result.opening });
      } catch (err) {
        fastify.log.error({ err }, 'createSessionWithPrimer failed');
        reply.status(500).send({ error: err instanceof Error ? err.message : 'Failed to create primer session' });
      }
    },
  );

  // GET /conversation/sessions/:id — get session with messages
  fastify.get<{ Params: { id: string } }>(
    '/sessions/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['conversation'],
        summary: 'Session detail with full message history',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const session = await getSession(fastify.db, request.user.userId, request.params.id);
      if (!session) return reply.status(404).send({ error: 'Session not found' });
      if (session.userId !== request.user.userId) return reply.status(403).send({ error: 'Forbidden' });
      reply.send({ session });
    },
  );

  // DELETE /conversation/sessions/:id — delete a session
  fastify.delete<{ Params: { id: string } }>(
    '/sessions/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['conversation'],
        summary: 'Delete a session',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const deleted = await deleteSession(fastify.db, request.user.userId, request.params.id);
      if (!deleted) return reply.status(404).send({ error: 'Session not found' });
      reply.send({ ok: true });
    },
  );

  // POST /conversation/sessions/:id/message — send message, stream reply via SSE
  fastify.post<{ Params: { id: string } }>(
    '/sessions/:id/message',
    {
      preHandler: [fastify.authenticate, fastify.requireEmailVerified],
      // GPT-4o streaming chat: $0.01-0.05 per long exchange. 60/hour ≈ one
      // message per minute — covers genuine practice, blocks bots that
      // hammer the model. SSE keeps the connection open so per-call cost
      // isn't fully bounded; rate-limit ALSO matters as a back-pressure.
      config: { rateLimit: { max: 60, timeWindow: '1 hour' } },
      schema: {
        tags: ['conversation'],
        summary: 'Send a user message; reply streams back as Server-Sent Events',
        description: 'Response is text/event-stream. Each "data:" line carries a JSON object: { chunk: "…" } for partial text, { done: true } at the end, { error: "…" } on failure.',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['message'],
          properties: { message: { type: 'string', minLength: 1, maxLength: 2000 } },
        },
        produces: ['text/event-stream'],
      },
    },
    async (request, reply) => {
      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
        'Access-Control-Allow-Credentials': 'true',
      });

      try {
        const gen = streamReply(
          fastify.db,
          request.user.userId,
          request.params.id,
          parsed.data.message,
        );

        for await (const chunk of gen) {
          reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Stream failed';
        // Smart Credits exhausted — surface the error code + resetAt so the
        // client can show a friendly "your AI quota refreshes in N hours"
        // banner instead of a generic stream failure.
        if (msg === 'OUT_OF_CREDITS') {
          const resetAt = (err as Error & { resetAt?: string }).resetAt;
          reply.raw.write(`data: ${JSON.stringify({ error: 'OUT_OF_CREDITS', resetAt })}\n\n`);
        } else {
          fastify.log.error(err);
          reply.raw.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        }
      } finally {
        reply.raw.end();
      }
    },
  );
};

export default conversationRoutes;
