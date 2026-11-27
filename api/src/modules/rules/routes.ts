import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors.js';
import type { RulesService } from './service.js';

const evaluateQuery = z.object({
  nationality: z.string().max(120).optional(),
  purpose: z.string().max(60).optional(),
  travelMode: z.string().max(30).optional(),
  borderPoint: z.string().max(180).optional(),
  destination: z.string().max(180).optional(),
  travellerType: z.string().max(40).optional(),
});

export const rulesRoutes: FastifyPluginAsync<{ rules: RulesService }> = async (fastify, { rules }) => {
  // Published rules are public guidance. Clients cache this snapshot for offline evaluation.
  fastify.get('/snapshot', async (_req, reply) => reply.send({ success: true, data: await rules.snapshot() }));

  fastify.get('/evaluate', async (req, reply) => {
    const parsed = evaluateQuery.safeParse(req.query);
    if (!parsed.success) throw new ValidationError('Invalid profile.', parsed.error.flatten());
    return reply.send({ success: true, data: await rules.evaluate(parsed.data) });
  });
};
