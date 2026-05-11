import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createSession, getSessions, getSession, deleteSession, streamReply } from './conversation.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';
import type { LanguageLevel } from '@french-app/shared-types';

const createSessionSchema = z.object({
  topic: z.string().min(1).max(200),
  level: z.enum(['A1', 'A2', 'B1', 'B2']).optional(),
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
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['conversation'],
        summary: 'Start a new AI conversation on a chosen topic',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['topic'],
          properties: {
            topic: { type: 'string', minLength: 1, maxLength: 200 },
            level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2'] },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = createSessionSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const level = (parsed.data.level ?? 'A1') as LanguageLevel;
      const session = await createSession(fastify.db, request.user.userId, parsed.data.topic, level);
      reply.status(201).send({ session });
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
      preHandler: [fastify.authenticate],
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
        fastify.log.error(err);
        reply.raw.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      } finally {
        reply.raw.end();
      }
    },
  );
};

export default conversationRoutes;
