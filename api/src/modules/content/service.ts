import type { DatabaseClient, QueryExecutor } from '../../database/types.js';
import { writeAudit } from '../../shared/audit.js';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors.js';

export type Kind = 'content' | 'requirements';
const TABLE: Record<Kind, string> = { content: 'public.pt_admin_content_items', requirements: 'public.pt_admin_requirements' };
const ENTITY: Record<Kind, string> = { content: 'content_item', requirements: 'requirement_rule' };

export interface Actor {
  userId: string;
  ip?: string | null;
}
type Row = Record<string, unknown>;

export interface ContentInput {
  slug?: string;
  contentType?: 'guidance' | 'faq' | 'notice';
  category: string;
  title: string;
  summary: string;
  body: string;
  officialAuthority: string;
  keywords?: string[];
}
export interface RuleInput {
  code: string;
  category: string;
  title: string;
  summary: string;
  simpleExplanation: string;
  applicableCondition: string;
  officialSource: string;
  mandatory: boolean;
  metadata?: Record<string, unknown>;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

/**
 * Governed workflow shared by guidance content and requirement rules:
 * draft -> pending_review -> approved -> published, plus reject, unpublish and archive.
 * An item can never be approved by its own author (also enforced by a database constraint).
 */
export class ContentService {
  constructor(
    private readonly db: DatabaseClient,
    private readonly onPublished?: (kind: Kind, id: string) => Promise<void>
  ) {}

  public async list(kind: Kind, status?: string): Promise<Row[]> {
    const cols =
      kind === 'content'
        ? 'id, slug, content_type, category, title, summary, official_authority, keywords, workflow_status, version, updated_at, published_at, rejection_reason'
        : 'id, code, category, title, summary, mandatory, rule_metadata, workflow_status, version, updated_at, published_at, rejection_reason';
    const r = await this.db.query<Row>(
      `SELECT ${cols} FROM ${TABLE[kind]} WHERE ($1::text IS NULL OR workflow_status = $1) ORDER BY updated_at DESC LIMIT 500`,
      [status ?? null]
    );
    return r.rows;
  }

  public async get(kind: Kind, id: string): Promise<Row> {
    const r = await this.db.query<Row>(`SELECT * FROM ${TABLE[kind]} WHERE id = $1`, [id]);
    if (!r.rows[0]) throw new NotFoundError('Item not found.');
    return r.rows[0];
  }

  public async createContent(actor: Actor, input: ContentInput): Promise<Row> {
    const slug = input.slug ?? `${slugify(input.title)}-${Date.now().toString(36)}`;
    const r = await this.db
      .query<Row>(
        `INSERT INTO ${TABLE.content} (slug, content_type, category, title, summary, body, official_authority, keywords, author_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [slug, input.contentType ?? 'guidance', input.category, input.title, input.summary, input.body, input.officialAuthority, input.keywords ?? [], actor.userId]
      )
      .catch((e: { code?: string }) => {
        if (e.code === '23505') throw new ConflictError('An item with this slug already exists.');
        throw e;
      });
    await writeAudit(this.db, { actorUserId: actor.userId, actorRole: 'admin_staff', action: 'content.create', entityType: ENTITY.content, entityId: String(r.rows[0]!.id), ipAddress: actor.ip ?? null });
    return r.rows[0]!;
  }

  public async createRule(actor: Actor, input: RuleInput): Promise<Row> {
    const meta = { order: 500, when: {}, checklist: null, ...input.metadata, verification: { status: 'pending', verifiedAt: null } };
    const r = await this.db
      .query<Row>(
        `INSERT INTO ${TABLE.requirements} (code, category, title, summary, simple_explanation, applicable_condition, official_source, mandatory, rule_metadata, author_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) RETURNING *`,
        [input.code, input.category, input.title, input.summary, input.simpleExplanation, input.applicableCondition, input.officialSource, input.mandatory, JSON.stringify(meta), actor.userId]
      )
      .catch((e: { code?: string }) => {
        if (e.code === '23505') throw new ConflictError('A rule with this code already exists.');
        throw e;
      });
    await writeAudit(this.db, { actorUserId: actor.userId, actorRole: 'admin_staff', action: 'rule.create', entityType: ENTITY.requirements, entityId: String(r.rows[0]!.id), ipAddress: actor.ip ?? null });
    return r.rows[0]!;
  }

  /** Only drafts and rejected items can be edited. Published items must be unpublished first, then re-approved. */
  public async update(kind: Kind, actor: Actor, id: string, patch: Record<string, unknown>): Promise<Row> {
    const cur = await this.get(kind, id);
    if (!['draft', 'rejected'].includes(String(cur.workflow_status))) {
      throw new ConflictError('Only draft or rejected items can be edited. Unpublish a published item first.');
    }
    const allowed: Record<string, string> =
      kind === 'content'
        ? { title: 'title', summary: 'summary', body: 'body', category: 'category', officialAuthority: 'official_authority', keywords: 'keywords' }
        : { title: 'title', summary: 'summary', simpleExplanation: 'simple_explanation', applicableCondition: 'applicable_condition', officialSource: 'official_source', mandatory: 'mandatory', category: 'category' };
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, col] of Object.entries(allowed)) {
      if (patch[k] !== undefined) {
        vals.push(patch[k]);
        sets.push(`${col} = $${vals.length}`);
      }
    }
    if (kind === 'requirements' && patch.metadata && typeof patch.metadata === 'object') {
      vals.push(JSON.stringify({ ...(cur.rule_metadata as object), ...(patch.metadata as object), verification: { status: 'pending', verifiedAt: null } }));
      sets.push(`rule_metadata = $${vals.length}::jsonb`);
    }
    if (!sets.length) throw new ValidationError('Nothing to update.');
    vals.push(id);
    const r = await this.db.query<Row>(
      `UPDATE ${TABLE[kind]} SET ${sets.join(', ')}, workflow_status = 'draft', version = version + 1 WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    await writeAudit(this.db, { actorUserId: actor.userId, actorRole: 'admin_staff', action: `${ENTITY[kind]}.update`, entityType: ENTITY[kind], entityId: id, ipAddress: actor.ip ?? null });
    return r.rows[0]!;
  }

  private async transition(kind: Kind, actor: Actor, id: string, from: string[], setSql: string, params: unknown[], action: string, tx?: QueryExecutor): Promise<Row> {
    const q = tx ?? this.db;
    const r = await q.query<Row>(`UPDATE ${TABLE[kind]} SET ${setSql} WHERE id = $1 AND workflow_status = ANY($2::text[]) RETURNING *`, [id, from, ...params]);
    if (!r.rows[0]) {
      await this.get(kind, id); // 404 if it does not exist
      throw new ConflictError("This action is not allowed from the item's current status.");
    }
    await writeAudit(q, { actorUserId: actor.userId, actorRole: 'admin_staff', action: `${ENTITY[kind]}.${action}`, entityType: ENTITY[kind], entityId: id, ipAddress: actor.ip ?? null });
    return r.rows[0]!;
  }

  public submit(kind: Kind, actor: Actor, id: string) {
    return this.transition(kind, actor, id, ['draft', 'rejected'], `workflow_status = 'pending_review', submitted_at = NOW(), rejection_reason = NULL`, [], 'submit');
  }

  public async approve(kind: Kind, actor: Actor, id: string, publish: boolean) {
    const cur = await this.get(kind, id);
    if (cur.author_id === actor.userId) {
      throw new ForbiddenError('You cannot approve content you authored. Ask another administrator to review it.', 'SELF_APPROVAL_BLOCKED');
    }
    const status = publish ? 'published' : 'approved';
    // Approving a rule records who verified it and when; the verification badge in the app then clears.
    const verification =
      kind === 'requirements'
        ? `, rule_metadata = jsonb_set(rule_metadata, '{verification}', jsonb_build_object('status', 'verified', 'verifiedAt', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), 'verifiedBy', $3::uuid::text))`
        : '';
    const row = await this.transition(
      kind,
      actor,
      id,
      ['pending_review', 'approved'],
      `workflow_status = '${status}', approver_id = $3::uuid, reviewed_at = NOW()${publish ? ', published_at = NOW()' : ''}${verification}`,
      [actor.userId],
      publish ? 'publish' : 'approve'
    );
    if (publish) await this.onPublished?.(kind, id);
    return row;
  }

  public reject(kind: Kind, actor: Actor, id: string, reason: string) {
    return this.transition(kind, actor, id, ['pending_review'], `workflow_status = 'rejected', reviewed_at = NOW(), rejection_reason = $3`, [reason], 'reject');
  }
  public unpublish(kind: Kind, actor: Actor, id: string) {
    return this.transition(kind, actor, id, ['published', 'approved'], `workflow_status = 'draft', published_at = NULL, approver_id = NULL`, [], 'unpublish');
  }
  public archive(kind: Kind, actor: Actor, id: string) {
    return this.transition(kind, actor, id, ['draft', 'rejected', 'pending_review', 'approved', 'published'], `workflow_status = 'archived', archived_at = NOW()`, [], 'archive');
  }
}
