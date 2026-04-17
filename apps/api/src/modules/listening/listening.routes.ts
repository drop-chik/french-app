import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getExercises, getExercise, submitAnswers } from './listening.service.js';
import { generateTTS } from './tts.service.js';
import type { LanguageLevel } from '@french-app/shared-types';

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

const listeningRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /listening/exercises?level=A1
  fastify.get(
    '/exercises',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const query = request.query as { level?: string };
      const level = (query.level ?? 'A1') as LanguageLevel;
      const exercises = await getExercises(fastify.db, level);
      reply.send({ exercises });
    },
  );

  // GET /listening/exercises/:id
  fastify.get<{ Params: { id: string } }>(
    '/exercises/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const exercise = await getExercise(fastify.db, request.user.userId, request.params.id);
      if (!exercise) return reply.status(404).send({ error: 'Exercise not found' });
      reply.send({ exercise });
    },
  );

  // POST /listening/exercises/:id/submit
  fastify.post<{ Params: { id: string } }>(
    '/exercises/:id/submit',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) return reply.status(400).send({ error: 'Invalid body' });

      const result = await submitAnswers(
        fastify.db,
        request.user.userId,
        request.params.id,
        parsed.data.answers,
      );
      reply.send(result);
    },
  );

  // POST /listening/tts — generate TTS for a text snippet (streaming MP3)
  fastify.post(
    '/tts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body as { text?: string };
      if (!body.text || body.text.trim().length === 0) {
        return reply.status(400).send({ error: 'text is required' });
      }
      if (body.text.length > 1000) {
        return reply.status(400).send({ error: 'text too long (max 1000 chars)' });
      }

      try {
        const audio = await generateTTS(body.text);
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
