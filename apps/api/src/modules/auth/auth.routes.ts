import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
} from './auth.schema.js';
import {
  registerUser,
  loginUser,
  createPasswordResetToken,
  resetPasswordWithToken,
  createEmailVerificationToken,
  verifyEmailWithToken,
} from './auth.service.js';
import { authorizedSecurity, errorSchema, userSchema } from '../../openapi/schemas.js';

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
  lang: z.enum(['ru', 'en']).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: z.string().min(8).max(200),
});

const verifyEmailSchema = z.object({
  token: z.string().min(32).max(128),
});

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
  // POST /auth/register — tighter rate limit to prevent automated account
  // creation / email enumeration via the 409 response.
  fastify.post('/register', {
    config: {
      rateLimit: { max: 5, timeWindow: '15 minutes' },
    },
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

      // Best-effort verification email — non-blocking. If RESEND_API_KEY
      // isn't set, the email service falls back to console.log; the user
      // can still resend via the dashboard banner.
      const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
      createEmailVerificationToken(fastify.db, user.id, 'ru', frontendUrl).catch((err) => {
        request.log.error({ err }, 'Email verification send failed');
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_TAKEN') {
        return reply.status(409).send({ error: 'Email already in use' });
      }
      throw err;
    }
  });

  // POST /auth/verify-email — consume confirmation token from email link.
  // Always 200 on valid token (including already-used tokens — clicking
  // twice shouldn't error). Rate-limited to block brute-force enumeration.
  fastify.post('/verify-email', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: {
      tags: ['auth'],
      summary: 'Confirm email via token from registration email',
      body: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string', minLength: 32, maxLength: 128 } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            alreadyVerified: { type: 'boolean' },
          },
        },
        400: errorSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = verifyEmailSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error' });
    }
    try {
      const result = await verifyEmailWithToken(fastify.db, parsed.data.token);
      reply.send({ ok: true, alreadyVerified: result.alreadyVerified });
    } catch (err) {
      if (err instanceof Error && err.message === 'INVALID_TOKEN') {
        return reply.status(400).send({ error: 'Invalid or expired token' });
      }
      throw err;
    }
  });

  // POST /auth/resend-verification — let the user kick a new email from
  // the dashboard banner. Tight rate limit so it's not abusable. Always
  // 200 — no signal whether the email was actually sent (verified users
  // get no-op silently).
  fastify.post('/resend-verification', {
    preHandler: [fastify.authenticate],
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
    schema: {
      tags: ['auth'],
      summary: 'Resend the email-verification link',
      security: authorizedSecurity,
      response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
    },
  }, async (request, reply) => {
    const { userId } = request.user;
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    try {
      await createEmailVerificationToken(fastify.db, userId, 'ru', frontendUrl);
    } catch (err) {
      request.log.error({ err }, 'Verification email resend failed');
    }
    reply.send({ ok: true });
  });

  // POST /auth/login — strict rate limit blocks brute-force credential
  // stuffing. 10/min/IP is enough for legitimate retries (typos, password
  // manager fumbles) but stops automated dictionary attacks dead.
  fastify.post('/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
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

  // POST /auth/forgot-password — request a reset link.
  // Always returns 200 with the same body, whether or not the email matches
  // a user. This prevents email enumeration via the response. Rate limited
  // tight (5/15min/IP) because the only legitimate use is "I forgot, send
  // the link" — a burst is always an attack or a buggy client.
  fastify.post('/forgot-password', {
    config: {
      rateLimit: { max: 5, timeWindow: '15 minutes' },
    },
    schema: {
      tags: ['auth'],
      summary: 'Request a password-reset email',
      description:
        'Sends a one-time link if the email is registered. Always returns ' +
        '{ ok: true } regardless of whether the email exists — no enumeration.',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', maxLength: 255 },
          lang:  { type: 'string', enum: ['ru', 'en'] },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        400: errorSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error' });
    }
    const lang = parsed.data.lang ?? 'ru';
    const frontendUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:5173';
    try {
      await createPasswordResetToken(fastify.db, parsed.data.email, lang, frontendUrl);
    } catch (err) {
      // Never bubble email-send failures up to the caller — that would let
      // an attacker probe deliverability. Log for our side instead.
      request.log.error({ err }, 'Password reset email failed');
    }
    // Always 200 — same body whether the email matched or not.
    reply.send({ ok: true });
  });

  // POST /auth/reset-password — consume a token + set new password.
  fastify.post('/reset-password', {
    config: {
      rateLimit: { max: 10, timeWindow: '15 minutes' },
    },
    schema: {
      tags: ['auth'],
      summary: 'Reset password using a token from email',
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token:    { type: 'string', minLength: 32, maxLength: 128 },
          password: { type: 'string', minLength: 8,  maxLength: 200 },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        400: errorSchema,
      },
    },
  }, async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation error' });
    }
    try {
      await resetPasswordWithToken(fastify.db, parsed.data.token, parsed.data.password);
      reply.send({ ok: true });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'INVALID_TOKEN') {
          return reply.status(400).send({ error: 'Invalid or expired token' });
        }
        if (err.message === 'PASSWORD_TOO_SHORT') {
          return reply.status(400).send({ error: 'Password must be at least 8 characters' });
        }
      }
      throw err;
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
