import type { QueryExecutor } from '../database/types.js';

export interface AuditEntry {
  actorUserId: string | null;
  actorRole?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/** Records a sensitive administrator or officer action in pt_admin_audit_logs. */
export async function writeAudit(db: QueryExecutor, entry: AuditEntry): Promise<void> {
  await db.query(
    `INSERT INTO public.pt_admin_audit_logs (actor_user_id, actor_role, action, entity_type, entity_id, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
    [
      entry.actorUserId,
      entry.actorRole ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      JSON.stringify(entry.metadata ?? {}),
      entry.ipAddress ?? null,
    ]
  );
}
