import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '../../database/types.js';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { ValidationError } from '../../shared/errors.js';

const parse = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const r = schema.safeParse(data);
  if (!r.success) throw new ValidationError('Invalid request.', r.error.flatten());
  return r.data;
};

const journeySchema = z.object({
  intendedBorderPoint: z.string().min(2).max(180),
  destinationCountry: z.string().max(140).default('Uganda'),
  travelPurpose: z.string().max(60),
  travelMode: z.enum(['road', 'air', 'rail']),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stayDurationDays: z.number().int().min(1).max(365).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  /** When the traveller changed it on the device. The newest change wins; older replays are ignored. */
  clientUpdatedAt: z.string().datetime(),
});

const assessmentSchema = z.object({
  clientKey: z.string().uuid(),
  nationality: z.string().max(120),
  score: z.number().int().min(0).max(100),
  status: z.enum(['Ready', 'Action Needed', 'Critical Requirements Missing']),
  completedItems: z.number().int().min(0),
  totalItems: z.number().int().min(0),
  missingMandatoryCount: z.number().int().min(0),
  checklist: z.array(z.object({ code: z.string().max(80), status: z.enum(['complete', 'missing', 'expired', 'not_applicable']) })).max(60),
});

interface Options { db: DatabaseClient; authMiddleware: ReturnType<typeof createAuthMiddleware> }

/** Traveller data that the app synchronises when connectivity returns. Every write is idempotent. */
export const meRoutes: FastifyPluginAsync<Options> = async (fastify, { db, authMiddleware }) => {
  const pre = [authMiddleware.authenticate];

  fastify.get('/journey', { preHandler: pre }, async (req, reply) => {
    const r = await db.query(
      `SELECT intended_border_point, destination_country, travel_purpose, travel_mode, travel_date::text AS travel_date, stay_duration_days, notes, status, client_updated_at, updated_at
         FROM public.pt_journeys WHERE user_id = $1 AND status IN ('planned','ready','in_transit') ORDER BY updated_at DESC LIMIT 1`,
      [req.authUser!.userId]
    );
    return reply.send({ success: true, data: r.rows[0] ?? null });
  });

  fastify.put('/journey', { preHandler: pre }, async (req, reply) => {
    const j = parse(journeySchema, req.body);
    const uid = req.authUser!.userId;
    const existing = await db.query<{ id: string; client_updated_at: Date | null }>(
      `SELECT id, client_updated_at FROM public.pt_journeys WHERE user_id = $1 AND status IN ('planned','ready','in_transit')`, [uid]);
    const row = existing.rows[0];
    const incoming = new Date(j.clientUpdatedAt);
    if (row?.client_updated_at && row.client_updated_at >= incoming) {
      // A newer version is already stored: ignore this stale replay instead of overwriting it.
      return reply.send({ success: true, data: { applied: false, reason: 'stale' } });
    }
    if (row) {
      await db.query(
        `UPDATE public.pt_journeys SET intended_border_point=$2, destination_country=$3, travel_purpose=$4, travel_mode=$5, travel_date=$6, stay_duration_days=$7, notes=$8, client_updated_at=$9 WHERE id=$1`,
        [row.id, j.intendedBorderPoint, j.destinationCountry, j.travelPurpose, j.travelMode, j.travelDate, j.stayDurationDays ?? null, j.notes ?? null, incoming]);
    } else {
      await db.query(
        `INSERT INTO public.pt_journeys (user_id, intended_border_point, destination_country, travel_purpose, travel_mode, travel_date, stay_duration_days, notes, client_updated_at, border_post_id)
         VALUES ($1,$2::text,$3,$4,$5,$6,$7,$8,$9,(SELECT id FROM public.pt_admin_border_posts WHERE $2::text ILIKE '%' || split_part(name, ' ', 1) || '%' LIMIT 1))`,
        [uid, j.intendedBorderPoint, j.destinationCountry, j.travelPurpose, j.travelMode, j.travelDate, j.stayDurationDays ?? null, j.notes ?? null, incoming]);
    }
    return reply.send({ success: true, data: { applied: true } });
  });

  fastify.post('/assessments', { preHandler: pre }, async (req, reply) => {
    const a = parse(assessmentSchema, req.body);
    const r = await db.query<{ id: string }>(
      `INSERT INTO public.pt_readiness_assessments (user_id, nationality, score, readiness_status, completed_items, total_items, missing_mandatory_count, checklist_snapshot, client_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
       ON CONFLICT (user_id, client_key) WHERE client_key IS NOT NULL DO NOTHING RETURNING id`,
      [req.authUser!.userId, a.nationality, a.score, a.status, a.completedItems, a.totalItems, a.missingMandatoryCount, JSON.stringify(a.checklist), a.clientKey]);
    return reply.status(r.rows[0] ? 201 : 200).send({ success: true, data: { stored: Boolean(r.rows[0]), duplicate: !r.rows[0] } });
  });
};
