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
    sign: { expiresIn: '7d' },
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
};

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(authPlugin, { name: 'auth' });
