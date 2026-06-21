import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getExercises, getExercise, submitAnswers } from './listening.service.js';
import {
  startMock, getActiveAttempt, submitAnswer as submitMockAnswer,
  finalizeAttempt, cancelAttempt, getMockHistory,
} from './listening-mock.service.js';
import { recordAction } from '../achievements/achievements.service.js';
import { XP_REWARDS } from '../achievements/xp.js';
import { getCachedTTS, synthesizeTTS } from './tts.service.js';
import { tryConsume } from '../profile/ai-credits.service.js';
import { getAudioData } from '../../services/audio.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';
import { ensureLevelAllowed } from '../../lib/level-gate.js';
import type { LanguageLevel } from '@french-app/shared-types';

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const mockStartSchema = z.object({ level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) });
const mockAnswerSchema = z.object({
  exerciseId: z.string().uuid(),
  questionId: z.string(),
  answer: z.string(),
});

const listeningRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /listening/exercises?level=A1
  fastify.get(
    '/exercises',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['listening'],
        summary: 'List listening exercises for a CEFR level',
        security: authorizedSecurity,
        querystring: {
          type: 'object',
          properties: { level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] } },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as { level?: string };
      const requested = (query.level ?? 'A1') as LanguageLevel;
      const level = await ensureLevelAllowed(fastify, request, reply, requested);
      if (!level) return;
      const exercises = await getExercises(fastify.db, request.user.userId, level);
      reply.send({ exercises });
    },
  );

  // GET /listening/exercises/:id
  fastify.get<{ Params: { id: string } }>(
    '/exercises/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['listening'],
        summary: 'Exercise detail (transcript, questions, user progress)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const exercise = await getExercise(fastify.db, request.user.userId, request.params.id);
      if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });
      reply.send({ exercise });
    },
  );

  // GET /listening/exercises/:id/audio — public, no auth (UUID is unguessable)
  fastify.get<{ Params: { id: string } }>(
    '/exercises/:id/audio',
    {
      schema: {
        tags: ['listening'],
        summary: 'Serve pre-generated MP3 (public, UUID-protected)',
        description: 'Streams the bytea audio column as audio/mpeg with 1-year immutable cache headers.',
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        produces: ['audio/mpeg'],
      },
    },
    async (request, reply) => {
      const audioData = await getAudioData(fastify.db, request.params.id);

      if (!audioData) {
        return reply.status(404).send({ error: 'Audio not found' });
      }

      reply
        .header('Content-Type', 'audio/mpeg')
        .header('Content-Length', audioData.length)
        .header('Cache-Control', 'public, max-age=31536000, immutable')
        .header('Accept-Ranges', 'bytes')
        .send(audioData);
    },
  );

  // POST /listening/exercises/:id/submit
  fastify.post<{ Params: { id: string } }>(
    '/exercises/:id/submit',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['listening'],
        summary: 'Submit answers (awards 25 XP)',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
        body: {
          type: 'object',
          required: ['answers'],
          properties: {
            answers: {
              type: 'object',
              description: 'Map of questionId → answer',
              additionalProperties: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const result = await submitAnswers(
        fastify.db,
        request.user.userId,
        request.params.id,
        parsed.data.answers,
      );

      const action = await recordAction(fastify.db, request.user.userId, XP_REWARDS.LISTENING_DONE);
      reply.send({
        ...result,
        xp: { gained: XP_REWARDS.LISTENING_DONE, total: action.totalXp, level: action.level, leveledUp: action.leveledUp },
        unlocked: action.newlyUnlocked,
      });
    },
  );

  // POST /listening/tts — on-demand TTS for vocabulary modes (single words)
  fastify.post(
    '/tts',
    {
      // Paid OpenAI endpoint. Gate it: requireEmailVerified blocks throwaway
      // accounts; the credit charge below (on cache-miss only) blocks scripted
      // bulk synthesis of novel text. Rate-limit is the outer guard.
      preHandler: [fastify.authenticate, fastify.requireEmailVerified],
      // TTS-1-HD is $30/1M chars, ~$0.0002 per word. Heavily cached in
      // tts_cache table so most calls are free. 200/hour fits a 20-word
      // vocab session × 10 sessions, blocks scripted bulk synthesis.
      config: { rateLimit: { max: 200, timeWindow: '1 hour' } },
      schema: {
        tags: ['listening'],
        summary: 'On-demand TTS — used by vocabulary modes to pronounce a word',
        security: authorizedSecurity,
        body: {
          type: 'object',
          required: ['text'],
          properties: { text: { type: 'string', minLength: 1, maxLength: 1000 } },
        },
        produces: ['audio/mpeg'],
      },
    },
    async (request, reply) => {
      const body = request.body as { text?: string };
      if (!body.text || body.text.trim().length === 0) {
        return reply.status(400).send({ error: 'text is required' });
      }
      if (body.text.length > 1000) {
        return reply.status(400).send({ error: 'text too long (max 1000 chars)' });
      }

      try {
        // Cache hit → free. Cache miss → charge 1 credit BEFORE the paid
        // OpenAI call so an out-of-quota user can't trigger synthesis.
        let audio = await getCachedTTS(body.text);
        if (!audio) {
          const consume = await tryConsume(fastify.db, request.user.userId, 'wordTts');
          if (!consume.ok) {
            return reply.status(402).send({ error: 'OUT_OF_CREDITS', credits: consume.state });
          }
          audio = await synthesizeTTS(body.text);
        }
        reply
          .header('Content-Type', 'audio/mpeg')
          .header('Content-Length', audio.length)
          .send(audio);
      } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'TTS generation failed' });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────
  // Mock test — DELF CO (Compréhension Orale): 3 recordings, 25 min
  // ──────────────────────────────────────────────────────────────

  fastify.post('/mock/start', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['listening'], summary: 'Start a new mock listening test (DELF CO)', security: authorizedSecurity,
      body: { type: 'object', required: ['level'], properties: { level: { type: 'string', enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] } } },
    },
  }, async (request, reply) => {
    const parsed = mockStartSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });
    try {
      const attempt = await startMock(fastify.db, request.user.userId, parsed.data.level);
      reply.send({ attempt });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'ACTIVE_ATTEMPT_EXISTS') return reply.status(409).send({ error: 'ACTIVE_ATTEMPT_EXISTS' });
      if (msg === 'NOT_ENOUGH_EXERCISES') return reply.status(422).send({ error: 'NOT_ENOUGH_EXERCISES' });
      throw err;
    }
  });

  fastify.get('/mock/active', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['listening'], summary: 'Get the active mock attempt (or null)', security: authorizedSecurity },
  }, async (request, reply) => {
    const active = await getActiveAttempt(fastify.db, request.user.userId);
    reply.send({ active });
  });

  fastify.post('/mock/:id/answer', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['listening'], summary: 'Submit one answer to an active mock attempt', security: authorizedSecurity,
      params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      body: { type: 'object', required: ['exerciseId', 'questionId', 'answer'], properties: { exerciseId: { type: 'string', format: 'uuid' }, questionId: { type: 'string' }, answer: { type: 'string' } } },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = mockAnswerSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });
    try {
      await submitMockAnswer(fastify.db, id, request.user.userId, parsed.data.exerciseId, parsed.data.questionId, parsed.data.answer);
      reply.send({ ok: true });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'NOT_FOUND') return reply.status(404).send({ error: 'NOT_FOUND' });
      if (msg === 'ALREADY_FINALIZED') return reply.status(409).send({ error: 'ALREADY_FINALIZED' });
      if (msg === 'TIME_EXPIRED') return reply.status(409).send({ error: 'TIME_EXPIRED' });
      throw err;
    }
  });

  fastify.post('/mock/:id/finalize', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['listening'], summary: 'Finalize a mock attempt — returns the breakdown', security: authorizedSecurity, params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await finalizeAttempt(fastify.db, id, request.user.userId);
      reply.send({ result });
    } catch (err) {
      if ((err as Error).message === 'NOT_FOUND') return reply.status(404).send({ error: 'NOT_FOUND' });
      throw err;
    }
  });

  fastify.delete('/mock/:id', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['listening'], summary: 'Cancel an active mock attempt', security: authorizedSecurity, params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } } },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await cancelAttempt(fastify.db, id, request.user.userId);
    reply.send({ ok: true });
  });

  fastify.get('/mock/history', {
    preHandler: [fastify.authenticate],
    schema: { tags: ['listening'], summary: 'Recent finalized mock attempts', security: authorizedSecurity },
  }, async (request, reply) => {
    const history = await getMockHistory(fastify.db, request.user.userId);
    reply.send({ history });
  });
};

export default listeningRoutes;
