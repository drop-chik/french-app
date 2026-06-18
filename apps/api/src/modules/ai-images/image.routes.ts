import type { FastifyPluginAsync } from 'fastify';
import { eq } from 'drizzle-orm';
import { words } from '../../db/schema/index.js';
import { generateWordImage } from './image.service.js';
import { tryConsume } from '../profile/ai-credits.service.js';
import { authorizedSecurity } from '../../openapi/schemas.js';

const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /images/words/:id — generate image for a word (synchronous for now).
  //
  // DALL-E 3 is a paid call (~$0.04/image). This route must carry the same
  // guard stack as every other costly AI endpoint, otherwise an authenticated
  // user could enumerate word ids and burn the OpenAI budget unbounded:
  //   - requireEmailVerified : no throwaway accounts
  //   - rateLimit 5/hour     : caps scripted abuse (mirrors /words/:id/image)
  //   - tryConsume credits   : charges Smart Credits, 402 when depleted
  fastify.post<{ Params: { id: string } }>(
    '/words/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireEmailVerified],
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
      schema: {
        tags: ['images'],
        summary: 'Generate (or fetch) DALL-E illustration for a word',
        description: 'Synchronous — DALL-E takes ~5-10s. If the word already has an imageUrl it is returned without re-generating. Costs 10 Smart Credits per fresh generation.',
        security: authorizedSecurity,
        params: { type: 'object', properties: { id: { type: 'string', format: 'uuid' } } },
      },
    },
    async (request, reply) => {
      const word = await fastify.db.query.words.findFirst({
        where: eq(words.id, request.params.id),
      });

      if (!word) return reply.status(404).send({ error: 'Word not found' });
      // Cached image is free — no credit charge, no OpenAI call.
      if (word.imageUrl) return reply.send({ imageUrl: word.imageUrl });

      // Charge credits BEFORE the paid OpenAI call so a depleted account
      // can't trigger generation. 402 with resetAt mirrors writing/conversation.
      const charge = await tryConsume(fastify.db, request.user.userId, 'imageGeneration');
      if (!charge.ok) {
        return reply.status(402).send({ error: 'OUT_OF_CREDITS', resetAt: charge.state.resetAt });
      }

      // Generate synchronously (DALL-E takes ~5-10s)
      const imageUrl = await generateWordImage(fastify.db, request.params.id);

      if (!imageUrl) {
        return reply.status(500).send({ error: 'Image generation failed' });
      }

      reply.send({ imageUrl });
    },
  );
};

export default imageRoutes;
