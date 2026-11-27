import type { DatabaseClient } from '../../database/types.js';
import { scoreReadiness, type EvaluationProfile, type ItemStatus } from '../../../../shared/rulesEvaluator.js';
import { writeAudit } from '../../shared/audit.js';
import { AppError, ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { USER_ROLES, type UserRole } from '../../shared/roles.js';
import type { RulesService } from '../rules/service.js';
import { newReference, QrSigner, tokenDigest } from './signing.js';

/** The six core documents carried in every pass, in a fixed order. */
const CORE_DOCS = ['doc-passport', 'doc-visa', 'doc-yellow-fever', 'doc-return-ticket', 'doc-accommodation', 'doc-travel-insurance'] as const;
const STATUS_CODE: Record<ItemStatus, string> = { complete: 'c', missing: 'm', expired: 'e', not_applicable: 'n' };
const RS: Record<string, 'R' | 'A' | 'C'> = { Ready: 'R', 'Action Needed': 'A', 'Critical Requirements Missing': 'C' };
const RS_LABEL = { R: 'Ready', A: 'Action Needed', C: 'Critical Requirements Missing' } as const;

export const QR_ADVISORY =
  'Advisory preparation summary only. It is not an identity check, an immigration approval or a travel permit. Check the traveller\'s documents through the normal procedure.';

export interface IssueInput {
  profile: EvaluationProfile;
  items: { code: string; status: ItemStatus }[];
  clientKey?: string;
}

export interface Actor { userId: string; roles: UserRole[]; ip?: string | null }

export class QrService {
  constructor(
    private readonly db: DatabaseClient,
    private readonly signer: QrSigner,
    private readonly rules: RulesService
  ) {}

  private async setting<T>(key: string, fallback: T): Promise<T> {
    const r = await this.db.query<{ value_json: T }>(`SELECT value_json FROM public.pt_admin_settings WHERE key = $1`, [key]);
    return r.rows[0]?.value_json ?? fallback;
  }

  /** Issues a signed pass. The score is recomputed on the server from the published rules and the declared statuses. */
  public async issue(userId: string, input: IssueInput) {
    const evaluated = await this.rules.evaluate(input.profile);
    const declared = new Map(input.items.map((i) => [i.code, i.status]));
    const scored = evaluated.checklist.map((c) => ({ code: c.code, id: c.id, mandatory: c.mandatory, status: (declared.get(c.id) ?? declared.get(c.code) ?? 'missing') as ItemStatus }));
    const result = scoreReadiness(scored);
    const dc = CORE_DOCS.map((id) => {
      const hit = scored.find((s) => s.id === id);
      return hit ? STATUS_CODE[hit.status] : 'n';
    }).join('');

    const ttlHours = await this.setting<number>('qr_summary_ttl_hours', 72);
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + Math.max(1, Number(ttlHours)) * 3600;
    const ref = newReference();
    const rs = RS[result.statusLabel] ?? 'A';
    const token = this.signer.issue({ ref, iat, exp, sc: result.score, rs, dc });

    return this.db.transaction(async (tx) => {
      // Idempotent: replaying the same offline request returns the pass already issued for it.
      if (input.clientKey) {
        const dup = await tx.query<{ id: string }>(
          `SELECT id FROM public.pt_readiness_assessments WHERE user_id = $1 AND client_key = $2`,
          [userId, input.clientKey]
        );
        if (dup.rows[0]) {
          const existing = await tx.query<{ reference_code: string; expires_at: Date; readiness_score: number; readiness_status: string; document_codes: string }>(
            `SELECT reference_code, expires_at, readiness_score, readiness_status, document_codes
               FROM public.pt_qr_summaries WHERE assessment_id = $1 ORDER BY issued_at DESC LIMIT 1`,
            [dup.rows[0].id]
          );
          if (existing.rows[0]) throw new AppError(409, 'ALREADY_ISSUED', 'This pass request was already processed.', { referenceCode: existing.rows[0].reference_code });
        }
      }

      await tx.query(
        `UPDATE public.pt_qr_summaries SET status = 'revoked', revoked_at = NOW(), revocation_reason = 'superseded by a newer pass'
          WHERE user_id = $1 AND status = 'valid'`,
        [userId]
      );
      const assessment = await tx.query<{ id: string }>(
        `INSERT INTO public.pt_readiness_assessments
           (user_id, nationality, requirements_version, score, readiness_status, completed_items, total_items, missing_mandatory_count, checklist_snapshot, client_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10) RETURNING id`,
        [userId, input.profile.nationality ?? 'Unknown', evaluated.rulesVersion, result.score, result.statusLabel, result.completedCount, result.totalCount, result.missingMandatoryCount, JSON.stringify(scored.map((s) => ({ code: s.code, mandatory: s.mandatory, status: s.status }))), input.clientKey ?? null]
      );
      await tx.query(
        `INSERT INTO public.pt_qr_summaries
           (reference_code, user_id, assessment_id, token_digest, requirements_version, readiness_score, readiness_status, expires_at, signature_kid, document_codes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), $9, $10)`,
        [ref, userId, assessment.rows[0]!.id, tokenDigest(token), evaluated.rulesVersion, result.score, result.statusLabel, exp, this.signer.keyId, dc]
      );
      return { token, referenceCode: ref, expiresAt: new Date(exp * 1000).toISOString(), score: result.score, status: result.statusLabel, documentCodes: dc, advisory: QR_ADVISORY };
    });
  }

  public async current(userId: string) {
    const r = await this.db.query<{ reference_code: string; readiness_score: number; readiness_status: string; document_codes: string; issued_at: Date; expires_at: Date; status: string }>(
      `SELECT reference_code, readiness_score, readiness_status, document_codes, issued_at, expires_at, status
         FROM public.pt_qr_summaries WHERE user_id = $1 ORDER BY issued_at DESC LIMIT 1`,
      [userId]
    );
    const row = r.rows[0];
    if (!row) return null;
    const expired = row.status === 'valid' && row.expires_at.getTime() < Date.now();
    return { referenceCode: row.reference_code, score: row.readiness_score, status: row.readiness_status, documentCodes: row.document_codes, issuedAt: row.issued_at.toISOString(), expiresAt: row.expires_at.toISOString(), state: expired ? 'expired' : row.status };
  }

  public async revoke(actor: Actor, referenceCode: string | undefined, reason: string) {
    const isAdmin = actor.roles.includes(USER_ROLES.ADMIN_STAFF);
    const r = await this.db.query<{ id: string; reference_code: string }>(
      isAdmin && referenceCode
        ? `UPDATE public.pt_qr_summaries SET status='revoked', revoked_at=NOW(), revoked_by=$1, revocation_reason=$2 WHERE reference_code=$3 AND status='valid' RETURNING id, reference_code`
        : `UPDATE public.pt_qr_summaries SET status='revoked', revoked_at=NOW(), revoked_by=$1, revocation_reason=$2 WHERE user_id=$1 AND status='valid' RETURNING id, reference_code`,
      isAdmin && referenceCode ? [actor.userId, reason, referenceCode] : [actor.userId, reason]
    );
    if (!r.rows[0]) throw new NotFoundError('No active pass to revoke.');
    if (isAdmin) await writeAudit(this.db, { actorUserId: actor.userId, actorRole: 'admin_staff', action: 'qr.revoke', entityType: 'qr_summary', entityId: r.rows[0].reference_code, metadata: { reason }, ipAddress: actor.ip ?? null });
    return { revoked: r.rows.length };
  }

  /** Officers must hold an active border-post assignment (unless scoping is switched off by an administrator). */
  private async officerPost(actor: Actor): Promise<string | null> {
    if (actor.roles.includes(USER_ROLES.ADMIN_STAFF) && !actor.roles.includes(USER_ROLES.BORDER_OFFICER)) return null;
    const a = await this.db.query<{ border_post_id: string }>(
      `SELECT border_post_id FROM public.pt_admin_officer_assignments WHERE user_id = $1 AND is_active = TRUE ORDER BY assigned_at DESC LIMIT 1`,
      [actor.userId]
    );
    const post = a.rows[0]?.border_post_id ?? null;
    const enforce = await this.setting<boolean>('enforce_officer_post_scoping', true);
    if (!post && enforce) throw new ForbiddenError('No active border post is assigned to this officer account.', 'NO_BORDER_ASSIGNMENT');
    return post;
  }

  public async verify(actor: Actor, token: string) {
    const postId = await this.officerPost(actor);
    const checked = this.signer.verifyToken(token);
    if (!checked.ok) {
      await writeAudit(this.db, { actorUserId: actor.userId, action: 'qr.verify.invalid', entityType: 'qr_summary', metadata: { reason: checked.reason }, ipAddress: actor.ip ?? null });
      return { outcome: 'invalid' as const, reason: checked.reason, advisory: QR_ADVISORY };
    }
    const claims = checked.claims;
    const row = await this.db.query<{ id: string; status: string; expires_at: Date; readiness_score: number; readiness_status: string; document_codes: string; issued_at: Date }>(
      `SELECT id, status, expires_at, readiness_score, readiness_status, document_codes, issued_at
         FROM public.pt_qr_summaries WHERE reference_code = $1 AND token_digest = $2`,
      [claims.ref, tokenDigest(token)]
    );
    const rec = row.rows[0];
    if (!rec) {
      await writeAudit(this.db, { actorUserId: actor.userId, action: 'qr.verify.unknown', entityType: 'qr_summary', entityId: claims.ref, ipAddress: actor.ip ?? null });
      return { outcome: 'invalid' as const, reason: 'unknown_pass', advisory: QR_ADVISORY };
    }
    const outcome = rec.status === 'revoked' ? 'revoked' : rec.expires_at.getTime() < Date.now() || claims.exp * 1000 < Date.now() ? 'expired' : 'verified';
    const v = await this.db.query<{ id: string }>(
      `INSERT INTO public.pt_qr_verifications (qr_summary_id, officer_user_id, border_post_id, outcome) VALUES ($1, $2, $3, $4) RETURNING id`,
      [rec.id, actor.userId, postId, outcome]
    );
    return {
      outcome,
      verificationId: v.rows[0]!.id,
      referenceCode: claims.ref,
      score: rec.readiness_score,
      status: RS_LABEL[RS[rec.readiness_status] ?? 'A'],
      documentCodes: rec.document_codes,
      issuedAt: rec.issued_at.toISOString(),
      expiresAt: rec.expires_at.toISOString(),
      advisory: QR_ADVISORY,
    };
  }

  public async decide(actor: Actor, verificationId: string, decision: 'approved' | 'flagged', note?: string) {
    const r = await this.db.query<{ id: string }>(
      `UPDATE public.pt_qr_verifications SET decision = $3, decision_note = $4
        WHERE id = $1 AND officer_user_id = $2 AND outcome = 'verified' RETURNING id`,
      [verificationId, actor.userId, decision, note ?? null]
    );
    if (!r.rows[0]) throw new NotFoundError('Verification not found for this officer, or the pass was not valid.');
    await writeAudit(this.db, { actorUserId: actor.userId, actorRole: 'border_officer', action: `qr.decision.${decision}`, entityType: 'qr_verification', entityId: verificationId, ipAddress: actor.ip ?? null });
    return { id: r.rows[0].id, decision };
  }

  /** Officers see only their own verifications; administrators see all. */
  public async history(actor: Actor, limit = 50) {
    const isAdmin = actor.roles.includes(USER_ROLES.ADMIN_STAFF);
    const r = await this.db.query<{ id: string; reference_code: string; outcome: string; decision: string | null; verified_at: Date; readiness_score: number; border_post: string | null }>(
      `SELECT v.id, s.reference_code, v.outcome, v.decision, v.verified_at, s.readiness_score, p.code AS border_post
         FROM public.pt_qr_verifications v
         JOIN public.pt_qr_summaries s ON s.id = v.qr_summary_id
         LEFT JOIN public.pt_admin_border_posts p ON p.id = v.border_post_id
        WHERE ($1::boolean OR v.officer_user_id = $2)
        ORDER BY v.verified_at DESC LIMIT $3`,
      [isAdmin, actor.userId, limit]
    );
    return r.rows.map((x) => ({ id: x.id, referenceCode: x.reference_code, outcome: x.outcome, decision: x.decision, verifiedAt: x.verified_at.toISOString(), score: x.readiness_score, borderPost: x.border_post }));
  }
}
