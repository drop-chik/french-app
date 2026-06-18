import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { eq } from 'drizzle-orm';
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { users } from '../db/schema/index.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string };
    user: { userId: string; email: string };
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCookie);

  await fastify.register(fastifyJwt, {
    secret: process.env['JWT_SECRET'] ?? 'dev_secret_change_me',
    // Access token kept short — a stolen token is only useful for 1h, then
    // the apiClient silently refreshes via the 30-day refresh cookie. 1h
    // (not 15min) leaves margin for the few request paths that don't
    // auto-refresh on 401 (TTS blob fetch, conversation SSE stream), which
    // complete well within an hour of a fresh token. The refresh token is
    // signed separately (jsonwebtoken + JWT_REFRESH_SECRET, 30d) and is
    // unaffected by this default.
    sign: { expiresIn: '1h' },
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    },
  );

  // Use AFTER `authenticate` in a route's preHandler chain. Looks the user's
  // role up fresh from the DB on every admin request (the JWT lives 7 days
  // and only carries userId/email, so we can't trust a cached role claim —
  // and a freshly-revoked admin must lose access immediately). Admin
  // traffic is tiny so the extra round-trip is irrelevant.
  fastify.decorate(
    'requireAdmin',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
      const row = await request.server.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { role: true },
      });
      if (!row || row.role !== 'admin') {
        reply.status(403).send({ error: 'Forbidden' });
      }
    },
  );

  // Hard gate on email verification — apply to "production" features
  // (writing, conversation, image-gen) so unverified accounts can't burn
  // AI budget. Reading / vocab / grammar stay open so the funnel from
  // signup → first session isn't broken; we want the user to try the
  // product, just not spam our OpenAI bill before verifying.
  fastify.decorate(
    'requireEmailVerified',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.userId;
      if (!userId) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
      const row = await request.server.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { emailVerifiedAt: true },
      });
      if (!row?.emailVerifiedAt) {
        reply.status(403).send({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address to use this feature.',
        });
      }
    },
  );
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireEmailVerified: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
