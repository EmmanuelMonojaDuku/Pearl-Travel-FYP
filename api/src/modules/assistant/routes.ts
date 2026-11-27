import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { ValidationError } from '../../shared/errors.js';
import type { DatabaseClient } from '../../database/types.js';
import type { AssistantService } from './service.js';

const askSchema = z.object({
  question: z.string().min(3).max(500),
  nationalityGroup: z.enum(['citizen', 'eac', 'visa_exempt', 'visa_required']).optional(),
  purpose: z.string().max(40).optional(),
});

interface Options {
  assistant: AssistantService;
  db: DatabaseClient;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const assistantRoutes: FastifyPluginAsync<Options> = async (fastify, { assistant, db, authMiddleware }) => {
  fastify.get('/status', async (_req, reply) => reply.send({ success: true, data: await assistant.status() }));

  // Published guidance for offline caching and for the on-device fallback when the server assistant is unavailable.
  fastify.get('/knowledge', async (_req, reply) => {
    const r = await db.query(
      `SELECT slug, category, title, summary, body, official_authority, keywords, updated_at
         FROM public.pt_admin_content_items WHERE workflow_status = 'published' ORDER BY title`
    );
    return reply.send({ success: true, data: { generatedAt: new Date().toISOString(), articles: r.rows } });
  });

  fastify.post(
    '/ask',
    { preHandler: [authMiddleware.authenticate], config: { rateLimit: { max: 20, timeWindow: 60_000 } } },
    async (req, reply) => {
      const parsed = askSchema.safeParse(req.body);
      if (!parsed.success) throw new ValidationError('Invalid question.', parsed.error.flatten());
      const { question, ...ctx } = parsed.data;
      return reply.send({ success: true, data: await assistant.ask(question, ctx) });
    }
  );
};
