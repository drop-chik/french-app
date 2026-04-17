import type { FastifyPluginAsync } from 'fastify';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() });
    }

    try {
      const user = await registerUser(fastify.db, parsed.data);
      const accessToken = fastify.jwt.sign({ userId: user.id, email: user.email });
      // Refresh token signed with separate secret via raw jsonwebtoken
      const { default: jwt } = await import('jsonwebtoken');
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env['JWT_REFRESH_SECRET'] ?? 'refresh_secret',
        { expiresIn: '30d' },
      );

      reply
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXPIRY,
          path: '/auth',
        })
        .status(201)
        .send({ accessToken, user });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return reply.status(409).send({ error: 'Email already in use' });
      }
      throw err;
    }
  });

  // POST /auth/login
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() });
    }

    try {
      const user = await loginUser(fastify.db, parsed.data);
      const accessToken = fastify.jwt.sign({ userId: user.id, email: user.email });
      const { default: jwt } = await import('jsonwebtoken');
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env['JWT_REFRESH_SECRET'] ?? 'refresh_secret',
        { expiresIn: '30d' },
      );

      reply
        .setCookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env['NODE_ENV'] === 'production',
          sameSite: 'strict',
          maxAge: REFRESH_TOKEN_EXPIRY,
          path: '/auth',
        })
        .send({ accessToken, user });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      throw err;
    }
  });

  // POST /auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      return reply.status(401).send({ error: 'No refresh token' });
    }

    try {
      const { default: jwt } = await import('jsonwebtoken');
      const payload = jwt.verify(
        refreshToken,
        process.env['JWT_REFRESH_SECRET'] ?? 'refresh_secret',
      ) as { userId: string; email: string };
      const accessToken = fastify.jwt.sign({ userId: payload.userId, email: payload.email });
      reply.send({ accessToken });
    } catch {
      reply.clearCookie('refreshToken', { path: '/auth' });
      reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  // POST /auth/logout
  fastify.post('/logout', async (_request, reply) => {
    reply.clearCookie('refreshToken', { path: '/auth' }).send({ ok: true });
  });

  // GET /auth/me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    reply.send(request.user);
  });
};

export default authRoutes;
