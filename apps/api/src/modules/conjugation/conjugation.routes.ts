import type { FastifyPluginAsync } from 'fastify';
import { conjugate, listIrregularVerbs } from './conjugation.service.js';

const conjugationRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /conjugation/irregular — list all irregular verb infinitives we support
  fastify.get('/irregular', async (_request, reply) => {
    reply.send({ verbs: listIrregularVerbs() });
  });

  // GET /conjugation/:verb — return the full conjugation table for a verb
  fastify.get<{ Params: { verb: string } }>('/:verb', async (request, reply) => {
    const verb = decodeURIComponent(request.params.verb);
    const result = conjugate(verb);
    if (!result) {
      return reply.status(404).send({
        error: 'NOT_FOUND',
        message: `No conjugation rule for "${verb}". Make sure it's an infinitive ending in -er, -ir or -re, or one of the supported irregular verbs.`,
      });
    }
    reply.send(result);
  });
};

export default conjugationRoutes;
