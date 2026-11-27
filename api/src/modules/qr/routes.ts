import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { ValidationError } from '../../shared/errors.js';
import { USER_ROLES } from '../../shared/roles.js';
import type { QrService, Actor } from './service.js';
import type { QrSigner } from './signing.js';

const issueSchema = z.object({
  profile: z.object({
    nationality: z.string().max(120).optional(),
    purpose: z.string().max(60).optional(),
    travelMode: z.string().max(30).optional(),
    borderPoint: z.string().max(180).optional(),
    destination: z.string().max(180).optional(),
    travellerType: z.string().max(40).optional(),
  }),
  items: z.array(z.object({ code: z.string().max(80), status: z.enum(['complete', 'missing', 'expired', 'not_applicable']) })).max(60),
  clientKey: z.string().uuid().optional(),
});

const parse = <T>(schema: z.ZodType<T>, body: unknown): T => {
  const r = schema.safeParse(body);
  if (!r.success) throw new ValidationError('Invalid request body.', r.error.flatten());
  return r.data;
};

const actorOf = (req: FastifyRequest): Actor => ({ userId: req.authUser!.userId, roles: req.authUser!.roles, ip: req.ip });

interface Options { qr: QrService; signer: QrSigner; authMiddleware: ReturnType<typeof createAuthMiddleware> }

export const qrRoutes: FastifyPluginAsync<Options> = async (fastify, { qr, signer, authMiddleware }) => {
  const { authenticate, requireRoles } = authMiddleware;
  const traveller = [authenticate, requireRoles(USER_ROLES.TRAVELLER, USER_ROLES.ADMIN_STAFF, USER_ROLES.BORDER_OFFICER)];
  const officer = [authenticate, requireRoles(USER_ROLES.BORDER_OFFICER, USER_ROLES.ADMIN_STAFF)];

  fastify.get('/public-key', async (_req, reply) =>
    reply.send({ success: true, data: { keyId: signer.keyId, algorithm: 'Ed25519', publicKeyPem: signer.publicKeyPem() } })
  );

  fastify.post('/issue', { preHandler: traveller }, async (req, reply) => {
    const body = parse(issueSchema, req.body);
    return reply.status(201).send({ success: true, data: await qr.issue(req.authUser!.userId, body) });
  });

  fastify.get('/mine', { preHandler: traveller }, async (req, reply) =>
    reply.send({ success: true, data: await qr.current(req.authUser!.userId) })
  );

  fastify.post('/revoke', { preHandler: traveller }, async (req, reply) => {
    const body = parse(z.object({ referenceCode: z.string().max(40).optional(), reason: z.string().max(300).optional() }), req.body ?? {});
    return reply.send({ success: true, data: await qr.revoke(actorOf(req), body.referenceCode, body.reason ?? 'revoked by the holder') });
  });

  fastify.post('/verify', { preHandler: officer }, async (req, reply) => {
    const { token } = parse(z.object({ token: z.string().min(20).max(2000) }), req.body);
    return reply.send({ success: true, data: await qr.verify(actorOf(req), token) });
  });

  fastify.post('/verifications/:id/decision', { preHandler: [authenticate, requireRoles(USER_ROLES.BORDER_OFFICER)] }, async (req, reply) => {
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params);
    const body = parse(z.object({ decision: z.enum(['approved', 'flagged']), note: z.string().max(500).optional() }), req.body);
    return reply.send({ success: true, data: await qr.decide(actorOf(req), id, body.decision, body.note) });
  });

  fastify.get('/verifications', { preHandler: officer }, async (req, reply) =>
    reply.send({ success: true, data: await qr.history(actorOf(req)) })
  );
};
