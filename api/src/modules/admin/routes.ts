import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { QueryResultRow } from 'pg';
import type { DatabaseClient } from '../../database/types.js';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { USER_ROLES } from '../../shared/roles.js';

interface AdminOverviewRow extends QueryResultRow {
  total_travellers: number;
  total_journeys: number;
  active_journeys: number;
  total_assessments: number;
  pending_content_reviews: number;
  total_qr_verifications: number;
  valid_qr_summaries: number;
}

interface AdminRoutesOptions {
  db: DatabaseClient;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

export const adminRoutes: FastifyPluginAsync<AdminRoutesOptions> = async (
  fastify: FastifyInstance,
  { db, authMiddleware }
) => {
  fastify.get(
    '/overview',
    {
      preHandler: [
        authMiddleware.authenticate,
        authMiddleware.requireRoles(USER_ROLES.ADMIN_STAFF),
      ],
    },
    async (_request, reply) => {
      const [result, databaseHealth] = await Promise.all([
        db.query<AdminOverviewRow>(`
          SELECT
            (
              SELECT COUNT(*)::int
              FROM public.pt_auth_users u
              JOIN public.pt_auth_user_roles ur ON ur.user_id = u.id
              JOIN public.pt_auth_roles r ON r.id = ur.role_id
              WHERE r.code = 'traveller'
            ) AS total_travellers,
            (SELECT COUNT(*)::int FROM public.pt_journeys) AS total_journeys,
            (
              SELECT COUNT(*)::int
              FROM public.pt_journeys
              WHERE status IN ('planned', 'ready', 'in_transit')
            ) AS active_journeys,
            (SELECT COUNT(*)::int FROM public.pt_readiness_assessments) AS total_assessments,
            (
              SELECT COUNT(*)::int
              FROM public.pt_admin_content_items
              WHERE workflow_status = 'pending_review'
            ) AS pending_content_reviews,
            (SELECT COUNT(*)::int FROM public.pt_qr_verifications) AS total_qr_verifications,
            (
              SELECT COUNT(*)::int
              FROM public.pt_qr_summaries
              WHERE status = 'valid' AND expires_at > NOW()
            ) AS valid_qr_summaries
        `),
        db.checkHealth(),
      ]);

      const stats = result.rows[0];
      if (!stats) {
        throw new Error('Admin overview query returned no statistics row.');
      }

      return reply.status(200).send({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          kpis: {
            totalTravellers: stats.total_travellers,
            totalJourneys: stats.total_journeys,
            activeJourneys: stats.active_journeys,
            totalAssessments: stats.total_assessments,
            pendingContentReviews: stats.pending_content_reviews,
            totalQrVerifications: stats.total_qr_verifications,
            validQrSummaries: stats.valid_qr_summaries,
          },
          systemHealth: {
            api: 'healthy',
            database: databaseHealth.status,
            databaseLatencyMs: databaseHealth.latencyMs ?? null,
          },
        },
      });
    }
  );
};
