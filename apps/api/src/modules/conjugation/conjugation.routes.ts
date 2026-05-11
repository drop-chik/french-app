import type { FastifyPluginAsync } from 'fastify';
import { conjugate, listIrregularVerbs } from './conjugation.service.js';
import { errorSchema } from '../../openapi/schemas.js';

const conjugationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /conjugation/irregular
  fastify.get('/irregular', {
    schema: {
      tags: ['conjugation'],
      summary: 'List supported irregular verbs',
      description: 'Returns all infinitives the engine knows by heart (être, avoir, aller, faire, …).',
      response: {
        200: {
          type: 'object',
          properties: { verbs: { type: 'array', items: { type: 'string' } } },
        },
      },
    },
  }, async (_request, reply) => {
    reply.send({ verbs: listIrregularVerbs() });
  });

  // GET /conjugation/:verb
  fastify.get<{ Params: { verb: string } }>('/:verb', {
    schema: {
      tags: ['conjugation'],
      summary: 'Full conjugation table for a verb',
      description: 'Accepts an infinitive (case-insensitive). Returns 7 tenses × 6 forms (3 for impératif). Tries the irregular catalog first, then falls back to the regular -er / -ir / -re algorithm.',
      params: {
        type: 'object',
        required: ['verb'],
        properties: { verb: { type: 'string', minLength: 2 } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            infinitive:  { type: 'string' },
            isIrregular: { type: 'boolean' },
            tenses: {
              type: 'object',
              properties: {
                present:      { type: 'array', items: { type: 'string' } },
                passeCompose: { type: 'array', items: { type: 'string' } },
                imparfait:    { type: 'array', items: { type: 'string' } },
                futurSimple:  { type: 'array', items: { type: 'string' } },
                conditionnel: { type: 'array', items: { type: 'string' } },
                subjonctif:   { type: 'array', items: { type: 'string' } },
                imperatif:    { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const verb = decodeURIComponent(request.params.verb);
    const result = conjugate(verb);
    if (!result) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `No conjugation rule for "${verb}".`,
      });
    }
    reply.send(result);
  });
};

export default conjugationRoutes;
