import type { FastifyPluginAsync } from 'fastify';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';
import { authorizedSecurity, errorSchema, userSchema } from '../../openapi/schemas.js';

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

const authTokenResponse = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', description: 'JWT access token, valid for 15 minutes' },
    user: userSchema,
  },
  required: ['accessToken', 'user'],
} as const;

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /auth/register
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Register a new account',
      description: 'Creates a user, returns an access token + sets a refresh-token cookie (httpOnly, /auth scope, 30 days).',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name:     { type: 'string', minLength: 1 },
        },
      },
      response: {
        201: authTokenResponse,
        400: errorSchema,
        409: { ...errorSchema, description: 'Email already in use' },
      },
    },
  }, async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error', details: parsed.error.flatten() });
    }

    try {
      const user = await registerUser(fastify.db, parsed.data);
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
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Log in with email and password',
      description: 'Returns an access token and sets the refresh-token cookie. Use the access token as the Bearer authorization header for subsequent requests.',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: authTokenResponse,
        400: errorSchema,
        401: { ...errorSchema, description: 'Invalid email or password' },
      },
    },
  }, async (request, reply) => {
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
  fastify.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Refresh access token',
      description: 'Reads the refresh-token cookie and issues a new access token. No body required.',
      response: {
        200: {
          type: 'object',
          properties: { accessToken: { type: 'string' } },
          required: ['accessToken'],
        },
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
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
  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Log out (clears refresh cookie)',
      response: {
        200: {
          type: 'object',
          properties: { ok: { type: 'boolean' } },
          required: ['ok'],
        },
      },
    },
  }, async (_request, reply) => {
    reply.clearCookie('refreshToken', { path: '/auth' }).send({ ok: true });
  });

  // GET /auth/me
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Current user (from token)',
      description: 'Returns the JWT payload (userId, email) of the authenticated request.',
      security: authorizedSecurity,
      response: {
        200: {
          type: 'object',
          properties: {
            userId: { type: 'string', format: 'uuid' },
            email:  { type: 'string', format: 'email' },
          },
        },
        401: errorSchema,
      },
    },
  }, async (request, reply) => {
    reply.send(request.user);
  });
};

export default authRoutes;
