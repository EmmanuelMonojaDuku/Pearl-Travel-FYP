import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { DatabaseClient } from '../../database/types.js';
import type { createAuthMiddleware } from '../../middleware/auth.js';
import { writeAudit } from '../../shared/audit.js';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors.js';
import { ALL_USER_ROLES, USER_ROLES } from '../../shared/roles.js';
import type { AssistantService } from '../assistant/service.js';
import type { ContentService, Kind } from '../content/service.js';

const parse = <T>(schema: z.ZodType<T>, data: unknown): T => {
  const r = schema.safeParse(data);
  if (!r.success) throw new ValidationError('Invalid request.', r.error.flatten());
  return r.data;
};

const CATEGORY = z.enum(['immigration', 'health', 'customs', 'border_post', 'transport']);
const contentCreate = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,120}$/).optional(),
  contentType: z.enum(['guidance', 'faq', 'notice']).optional(),
  category: CATEGORY,
  title: z.string().min(3).max(240),
  summary: z.string().min(3).max(1000),
  body: z.string().min(10).max(12000),
  officialAuthority: z.string().min(2).max(220),
  keywords: z.array(z.string().max(60)).max(40).optional(),
});
const contentPatch = contentCreate.partial().omit({ slug: true, contentType: true });
const ruleCreate = z.object({
  code: z.string().regex(/^[a-z0-9-]{3,80}$/),
  category: z.enum(['entry', 'exit', 'visa', 'health', 'customs']),
  title: z.string().min(3).max(240),
  summary: z.string().min(3).max(1000),
  simpleExplanation: z.string().min(3).max(3000),
  applicableCondition: z.string().min(3).max(1000),
  officialSource: z.string().min(2).max(220),
  mandatory: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});
const rulePatch = ruleCreate.partial().omit({ code: true });
const idParam = z.object({ id: z.string().uuid() });
const kindParam = z.object({ kind: z.enum(['content', 'requirements']) });

interface Options {
  db: DatabaseClient;
  content: ContentService;
  assistant: AssistantService;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
}

/** All routes here require a server-verified administrator role. Roles are never taken from the browser. */
export const adminManagementRoutes: FastifyPluginAsync<Options> = async (fastify, { db, content, assistant, authMiddleware }) => {
  const adminOnly = [authMiddleware.authenticate, authMiddleware.requireRoles(USER_ROLES.ADMIN_STAFF)];
  const actor = (req: FastifyRequest) => ({ userId: req.authUser!.userId, ip: req.ip });
  const ok = (data: unknown, status = 200) => ({ status, body: { success: true, data } });

  /* ── Content and rule workflow (kind = content | requirements) ── */
  fastify.get('/workflow/:kind', { preHandler: adminOnly }, async (req, reply) => {
    const { kind } = parse(kindParam, req.params);
    const { status } = parse(z.object({ status: z.string().optional() }), req.query);
    return reply.send({ success: true, data: await content.list(kind, status) });
  });
  fastify.get('/workflow/:kind/:id', { preHandler: adminOnly }, async (req, reply) => {
    const { kind } = parse(kindParam, req.params);
    const { id } = parse(idParam, req.params);
    return reply.send({ success: true, data: await content.get(kind, id) });
  });
  fastify.post('/workflow/content', { preHandler: adminOnly }, async (req, reply) =>
    reply.status(201).send({ success: true, data: await content.createContent(actor(req), parse(contentCreate, req.body)) }));
  fastify.post('/workflow/requirements', { preHandler: adminOnly }, async (req, reply) =>
    reply.status(201).send({ success: true, data: await content.createRule(actor(req), parse(ruleCreate, req.body)) }));
  fastify.patch('/workflow/:kind/:id', { preHandler: adminOnly }, async (req, reply) => {
    const { kind } = parse(kindParam, req.params);
    const { id } = parse(idParam, req.params);
    const patch = kind === 'content' ? parse(contentPatch, req.body) : parse(rulePatch, req.body);
    return reply.send({ success: true, data: await content.update(kind, actor(req), id, patch as Record<string, unknown>) });
  });
  const actions: Record<string, (k: Kind, a: ReturnType<typeof actor>, id: string, body: Record<string, unknown>) => Promise<unknown>> = {
    submit: (k, a, id) => content.submit(k, a, id),
    approve: (k, a, id) => content.approve(k, a, id, false),
    publish: (k, a, id) => content.approve(k, a, id, true),
    reject: (k, a, id, body) => content.reject(k, a, id, String(parse(z.object({ reason: z.string().min(3).max(500) }), body).reason)),
    unpublish: (k, a, id) => content.unpublish(k, a, id),
    archive: (k, a, id) => content.archive(k, a, id),
  };
  fastify.post('/workflow/:kind/:id/:action', { preHandler: adminOnly }, async (req, reply) => {
    const { kind } = parse(kindParam, req.params);
    const { id } = parse(idParam, req.params);
    const { action } = parse(z.object({ action: z.enum(['submit', 'approve', 'publish', 'reject', 'unpublish', 'archive']) }), req.params);
    return reply.send({ success: true, data: await actions[action]!(kind, actor(req), id, (req.body ?? {}) as Record<string, unknown>) });
  });

  /* ── Users, roles, officer assignments ── */
  fastify.get('/users', { preHandler: adminOnly }, async (_req, reply) => {
    const r = await db.query(
      `SELECT u.id, u.email, u.full_name, u.is_active, u.created_at,
              COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
              COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE a.is_active), '{}') AS border_posts
         FROM public.pt_auth_users u
         LEFT JOIN public.pt_auth_user_roles ur ON ur.user_id = u.id
         LEFT JOIN public.pt_auth_roles r ON r.id = ur.role_id
         LEFT JOIN public.pt_admin_officer_assignments a ON a.user_id = u.id
         LEFT JOIN public.pt_admin_border_posts p ON p.id = a.border_post_id
        WHERE u.email_normalized <> 'system@pearltravel.invalid'
        GROUP BY u.id ORDER BY u.created_at DESC LIMIT 500`
    );
    return reply.send({ success: true, data: r.rows });
  });

  fastify.post('/users/:id/roles', { preHandler: adminOnly }, async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const { role } = parse(z.object({ role: z.enum(ALL_USER_ROLES as [string, ...string[]]) }), req.body);
    const roleRow = await db.query<{ id: string }>(`SELECT id FROM public.pt_auth_roles WHERE code = $1`, [role]);
    const exists = await db.query(`SELECT 1 FROM public.pt_auth_users WHERE id = $1`, [id]);
    if (!exists.rowCount || !roleRow.rows[0]) throw new NotFoundError('User or role not found.');
    await db.query(`INSERT INTO public.pt_auth_user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, roleRow.rows[0].id]);
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'user.role.grant', entityType: 'user', entityId: id, metadata: { role }, ipAddress: req.ip });
    return reply.send({ success: true, data: { userId: id, role } });
  });

  fastify.delete('/users/:id/roles/:role', { preHandler: adminOnly }, async (req, reply) => {
    const { id, role } = parse(z.object({ id: z.string().uuid(), role: z.enum(ALL_USER_ROLES as [string, ...string[]]) }), req.params);
    if (id === req.authUser!.userId && role === USER_ROLES.ADMIN_STAFF) throw new ConflictError('You cannot remove your own administrator role.');
    await db.query(`DELETE FROM public.pt_auth_user_roles WHERE user_id = $1 AND role_id = (SELECT id FROM public.pt_auth_roles WHERE code = $2)`, [id, role]);
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'user.role.revoke', entityType: 'user', entityId: id, metadata: { role }, ipAddress: req.ip });
    return reply.send({ success: true, data: { userId: id, role } });
  });

  fastify.get('/border-posts', { preHandler: adminOnly }, async (_req, reply) =>
    reply.send({ success: true, data: (await db.query(`SELECT id, code, name, status, operating_hours FROM public.pt_admin_border_posts ORDER BY name`)).rows }));

  fastify.post('/users/:id/assignments', { preHandler: adminOnly }, async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const { borderPostCode } = parse(z.object({ borderPostCode: z.string().max(40) }), req.body);
    const isOfficer = await db.query(`SELECT 1 FROM public.pt_auth_user_roles ur JOIN public.pt_auth_roles r ON r.id = ur.role_id WHERE ur.user_id = $1 AND r.code = 'border_officer'`, [id]);
    if (!isOfficer.rowCount) throw new ConflictError('Grant the border_officer role before assigning a border post.');
    const r = await db.query(
      `INSERT INTO public.pt_admin_officer_assignments (user_id, border_post_id, assigned_by)
       SELECT $1, p.id, $3 FROM public.pt_admin_border_posts p WHERE p.code = $2
       ON CONFLICT (user_id, border_post_id) DO UPDATE SET is_active = TRUE, assigned_by = $3, assigned_at = NOW() RETURNING id`,
      [id, borderPostCode, req.authUser!.userId]
    );
    if (!r.rowCount) throw new NotFoundError('Border post not found.');
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'officer.assign', entityType: 'user', entityId: id, metadata: { borderPostCode }, ipAddress: req.ip });
    return reply.status(201).send({ success: true, data: { userId: id, borderPostCode } });
  });

  fastify.delete('/users/:id/assignments/:code', { preHandler: adminOnly }, async (req, reply) => {
    const { id, code } = parse(z.object({ id: z.string().uuid(), code: z.string().max(40) }), req.params);
    await db.query(`UPDATE public.pt_admin_officer_assignments SET is_active = FALSE WHERE user_id = $1 AND border_post_id = (SELECT id FROM public.pt_admin_border_posts WHERE code = $2)`, [id, code]);
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'officer.unassign', entityType: 'user', entityId: id, metadata: { code }, ipAddress: req.ip });
    return reply.send({ success: true, data: { userId: id, code } });
  });

  /* ── Audit log ── */
  fastify.get('/audit-logs', { preHandler: adminOnly }, async (req, reply) => {
    const { limit } = parse(z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) }), req.query);
    const r = await db.query(
      `SELECT l.id, l.action, l.entity_type, l.entity_id, l.metadata, l.created_at, l.actor_role, u.email AS actor_email
         FROM public.pt_admin_audit_logs l LEFT JOIN public.pt_auth_users u ON u.id = l.actor_user_id ORDER BY l.created_at DESC LIMIT $1`, [limit]);
    return reply.send({ success: true, data: r.rows });
  });

  /* ── AI-drafted suggestions: a human must approve every one ── */
  fastify.get('/ai-suggestions', { preHandler: adminOnly }, async (req, reply) => {
    const { status } = parse(z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() }), req.query);
    const r = await db.query(`SELECT * FROM public.pt_ai_suggestions WHERE ($1::text IS NULL OR status = $1) ORDER BY created_at DESC LIMIT 200`, [status ?? null]);
    return reply.send({ success: true, data: r.rows });
  });

  fastify.post('/ai-suggestions', { preHandler: adminOnly }, async (req, reply) => {
    const b = parse(z.object({ kind: z.enum(['ADD', 'UPDATE']), contentItemId: z.string().uuid().optional(), category: CATEGORY, title: z.string().min(3).max(240), proposedSummary: z.string().min(3).max(1000), proposedBody: z.string().min(10).max(12000), rationale: z.string().max(600).optional(), sourceNote: z.string().max(500).optional() }), req.body);
    const r = await db.query(`INSERT INTO public.pt_ai_suggestions (kind, content_item_id, category, title, proposed_summary, proposed_body, rationale, source_note, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [b.kind, b.contentItemId ?? null, b.category, b.title, b.proposedSummary, b.proposedBody, b.rationale ?? null, b.sourceNote ?? null, req.authUser!.userId]);
    return reply.status(201).send({ success: true, data: r.rows[0] });
  });

  fastify.post('/ai-suggestions/draft', { preHandler: adminOnly }, async (req, reply) => {
    const b = parse(z.object({ topic: z.string().min(3).max(200), sourceText: z.string().min(40).max(8000), contentItemId: z.string().uuid().optional() }), req.body);
    const d = await assistant.draftSuggestion(b.topic, b.sourceText);
    const r = await db.query(`INSERT INTO public.pt_ai_suggestions (kind, content_item_id, category, title, proposed_summary, proposed_body, rationale, source_note, model, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.contentItemId ? 'UPDATE' : 'ADD', b.contentItemId ?? null, d.category, d.title, d.summary, d.body, d.rationale, `Drafted from administrator-supplied text about: ${b.topic}`, d.model, req.authUser!.userId]);
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'ai.suggestion.draft', entityType: 'ai_suggestion', entityId: String((r.rows[0] as { id: string }).id), ipAddress: req.ip });
    return reply.status(201).send({ success: true, data: r.rows[0] });
  });

  // Approving a suggestion is the human review: the content is authored by the system user (the AI) and approved by this administrator.
  fastify.post('/ai-suggestions/:id/approve', { preHandler: adminOnly }, async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const adminId = req.authUser!.userId;
    const result = await db.transaction(async (tx) => {
      const s = await tx.query<{ id: string; kind: string; content_item_id: string | null; category: string; title: string; proposed_summary: string; proposed_body: string }>(
        `SELECT * FROM public.pt_ai_suggestions WHERE id = $1 AND status = 'pending' FOR UPDATE`, [id]);
      const sug = s.rows[0];
      if (!sug) throw new ConflictError('Suggestion not found or already reviewed.');
      const sys = await tx.query<{ id: string }>(`SELECT id FROM public.pt_auth_users WHERE email_normalized = 'system@pearltravel.invalid'`);
      let itemId = sug.content_item_id;
      if (sug.kind === 'UPDATE' && itemId) {
        await tx.query(`UPDATE public.pt_admin_content_items SET title=$2, summary=$3, body=$4, category=$5, author_id=$6, approver_id=$7, workflow_status='published', published_at=NOW(), reviewed_at=NOW(), version=version+1 WHERE id=$1`,
          [itemId, sug.title, sug.proposed_summary, sug.proposed_body, sug.category, sys.rows[0]!.id, adminId]);
      } else {
        const ins = await tx.query<{ id: string }>(`INSERT INTO public.pt_admin_content_items (slug, content_type, category, title, summary, body, official_authority, author_id, approver_id, workflow_status, published_at, reviewed_at) VALUES ($1,'guidance',$2,$3,$4,$5,'Reviewed by Pearl Travel administrator',$6,$7,'published',NOW(),NOW()) RETURNING id`,
          [`ai-${Date.now().toString(36)}-${id.slice(0, 6)}`, sug.category, sug.title, sug.proposed_summary, sug.proposed_body, sys.rows[0]!.id, adminId]);
        itemId = ins.rows[0]!.id;
      }
      await tx.query(`UPDATE public.pt_ai_suggestions SET status='approved', reviewed_by=$2, reviewed_at=NOW(), content_item_id=$3 WHERE id=$1`, [id, adminId, itemId]);
      await writeAudit(tx, { actorUserId: adminId, actorRole: 'admin_staff', action: 'ai.suggestion.approve', entityType: 'ai_suggestion', entityId: id, ipAddress: req.ip });
      return itemId!;
    });
    await assistant.indexContentItem(result).catch(() => undefined);
    return reply.send({ success: true, data: { id, contentItemId: result } });
  });

  fastify.post('/ai-suggestions/:id/reject', { preHandler: adminOnly }, async (req, reply) => {
    const { id } = parse(idParam, req.params);
    const { reason } = parse(z.object({ reason: z.string().min(3).max(500) }), req.body);
    const r = await db.query(`UPDATE public.pt_ai_suggestions SET status='rejected', rejection_reason=$2, reviewed_by=$3, reviewed_at=NOW() WHERE id=$1 AND status='pending' RETURNING id`, [id, reason, req.authUser!.userId]);
    if (!r.rowCount) throw new ConflictError('Suggestion not found or already reviewed.');
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'ai.suggestion.reject', entityType: 'ai_suggestion', entityId: id, ipAddress: req.ip });
    return reply.send({ success: true, data: { id } });
  });

  /* ── Knowledge base index ── */
  fastify.post('/kb/reindex', { preHandler: adminOnly }, async (req, reply) => {
    const out = await assistant.reindexAll();
    await writeAudit(db, { actorUserId: req.authUser!.userId, actorRole: 'admin_staff', action: 'kb.reindex', metadata: out, ipAddress: req.ip });
    return reply.send({ success: true, data: out });
  });
  void ok;
};
