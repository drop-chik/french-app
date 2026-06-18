import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getExercises, getExercise, submitAnswers } from './listening.service.js';
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
};

export default listeningRoutes;
