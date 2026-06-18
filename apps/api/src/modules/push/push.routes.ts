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

// Web-push endpoints only ever come from these provider hosts. Restricting
// the accepted endpoint to this allowlist closes a blind-SSRF hole: without
// it, an attacker could register an internal address (cloud metadata,
// internal service) and /push/test would make the server POST to it.
const ALLOWED_PUSH_HOST_SUFFIXES = [
  '.googleapis.com',          // FCM (Chrome/Edge): fcm.googleapis.com, android.googleapis.com
  '.push.services.mozilla.com', // Firefox: updates.push.services.mozilla.com
  '.push.apple.com',          // Safari/Apple: web.push.apple.com
  '.notify.windows.com',      // legacy WNS
];

function isAllowedPushEndpoint(endpoint: string): boolean {
  let host: string;
  try {
    const u = new URL(endpoint);
    if (u.protocol !== 'https:') return false;
    host = u.hostname.toLowerCase();
  } catch {
    return false;
  }
  return ALLOWED_PUSH_HOST_SUFFIXES.some(
    (s) => host === s.slice(1) || host.endsWith(s),
  );
}

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
    if (!isAllowedPushEndpoint(parsed.data.endpoint)) {
      return reply.status(400).send({ error: 'Endpoint host not allowed' });
    }

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
    // Same shape the streak-reminder cron will use later — keeping it
    // consistent so this test exercises the real production payload.
    const result = await sendToUser(fastify.db, request.user.userId, {
      title: '🔥 Не теряй серию!',
      body: 'Твоя серия ждёт — потрать 5 минут на повторение и удержи streak.',
      url: '/vocabulary',
      tag: 'streak-reminder',
    });
    reply.send(result);
  });
};

export default pushRoutes;
