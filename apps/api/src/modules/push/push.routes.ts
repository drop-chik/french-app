import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { saveSubscription, deleteSubscription, sendToUser, getPublicKey } from './push.service.js';
import { authorizedSecurity, errorSchema } from '../../openapi/schemas.js';

const subscribeBody = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const pushRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /push/public-key — VAPID public key the client needs to subscribe
  fastify.get('/public-key', {
    schema: {
      tags: ['push'],
      summary: 'VAPID public key (needed by the browser to subscribe)',
      response: {
        200: { type: 'object', properties: { publicKey: { type: 'string' } } },
      },
    },
  }, async (_req, reply) => {
    reply.send({ publicKey: getPublicKey() });
  });

  // POST /push/subscribe — store the browser subscription
  fastify.post('/subscribe', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['push'],
      summary: 'Register a browser push subscription for the current user',
      security: authorizedSecurity,
      body: {
        type: 'object',
        required: ['endpoint', 'keys'],
        properties: {
          endpoint: { type: 'string', format: 'uri' },
          keys: {
            type: 'object',
            required: ['p256dh', 'auth'],
            properties: {
              p256dh: { type: 'string' },
              auth: { type: 'string' },
            },
          },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' }, id: { type: 'string', format: 'uuid' } } },
        400: errorSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = subscribeBody.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid subscription body' });

    const result = await saveSubscription(
      fastify.db,
      request.user.userId,
      parsed.data,
      request.headers['user-agent'] ?? null,
    );
    reply.send(result);
  });

  // DELETE /push/subscribe — remove a subscription by endpoint
  fastify.delete('/subscribe', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['push'],
      summary: 'Unregister a browser push subscription',
      security: authorizedSecurity,
      body: {
        type: 'object',
        required: ['endpoint'],
        properties: { endpoint: { type: 'string', format: 'uri' } },
      },
    },
  }, async (request, reply) => {
    const body = request.body as { endpoint?: string };
    if (!body.endpoint) return reply.status(400).send({ error: 'endpoint required' });
    await deleteSubscription(fastify.db, request.user.userId, body.endpoint);
    reply.send({ ok: true });
  });

  // POST /push/test — send a test notification to the current user's devices
  fastify.post('/test', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['push'],
      summary: 'Send a test push to all the current user\'s registered devices',
      description: 'Useful for verifying the subscription chain works end-to-end. Returns delivery stats.',
      security: authorizedSecurity,
    },
  }, async (request, reply) => {
    const result = await sendToUser(fastify.db, request.user.userId, {
      title: 'FrenchUp 🔔',
      body: 'Тестовое уведомление — всё работает! 🎉',
      url: '/dashboard',
      tag: 'test',
    });
    reply.send(result);
  });
};

export default pushRoutes;
