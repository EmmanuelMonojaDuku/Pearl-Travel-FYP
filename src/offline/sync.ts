import { ApiRequestError, ApiUnavailableError } from '../utils/apiClient';
import { postAssessment, putJourney } from '../utils/api';
import { refreshRulesFromServer } from '../data/ruleStore';
import { refreshKnowledgeFromServer } from '../data/knowledgeStore';
import { outboxAll, outboxPut, outboxRemove, type OutboxItem } from './kv';

export interface SyncSummary {
  online: boolean;
  rulesUpdated: boolean;
  knowledgeRefreshed: boolean;
  sent: number;
  failed: number;
  remaining: number;
}

let flushing: Promise<{ sent: number; failed: number }> | null = null;

/** Queues a journey change. Only the newest journey is kept, because only it matters. */
export async function queueJourney(journey: Record<string, unknown>): Promise<void> {
  await outboxPut({ id: 'journey-latest', type: 'journey', payload: { ...journey, clientUpdatedAt: new Date().toISOString() }, createdAt: new Date().toISOString(), attempts: 0 });
}

/** Queues a readiness snapshot. Older unsent snapshots are replaced by the newest one. */
export async function queueAssessment(snapshot: Record<string, unknown>): Promise<void> {
  for (const old of await outboxAll()) if (old.type === 'assessment') await outboxRemove(old.id);
  const id = crypto.randomUUID();
  await outboxPut({ id, type: 'assessment', payload: { ...snapshot, clientKey: id }, createdAt: new Date().toISOString(), attempts: 0 });
}

async function send(item: OutboxItem): Promise<void> {
  if (item.type === 'journey') await putJourney(item.payload);
  else await postAssessment(item.payload);
}

/**
 * Sends queued changes in order. Network problems keep items queued for the next try.
 * Server-side duplicates are harmless: assessments carry a unique key and journeys are last-write-wins by timestamp.
 */
export function flushOutbox(): Promise<{ sent: number; failed: number }> {
  flushing ??= (async () => {
    let sent = 0;
    let failed = 0;
    for (const item of await outboxAll()) {
      try {
        await send(item);
        await outboxRemove(item.id);
        sent += 1;
      } catch (e) {
        if (e instanceof ApiUnavailableError) break; // offline: try again later
        if (e instanceof ApiRequestError && (e.statusCode === 401 || e.statusCode === 429)) break; // signed out or rate limited
        if (e instanceof ApiRequestError && e.statusCode >= 400 && e.statusCode < 500) {
          await outboxRemove(item.id); // the server rejected it for good; retrying cannot help
          failed += 1;
          continue;
        }
        await outboxPut({ ...item, attempts: item.attempts + 1, lastError: e instanceof Error ? e.message : 'error' });
        failed += 1;
        break;
      }
    }
    return { sent, failed };
  })().finally(() => { flushing = null; });
  return flushing;
}

export async function syncAll(hasServerSession: boolean): Promise<SyncSummary> {
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  if (!online) return { online: false, rulesUpdated: false, knowledgeRefreshed: false, sent: 0, failed: 0, remaining: (await outboxAll()).length };
  const [rulesUpdated, knowledgeRefreshed] = await Promise.all([refreshRulesFromServer(), refreshKnowledgeFromServer()]);
  const { sent, failed } = hasServerSession ? await flushOutbox() : { sent: 0, failed: 0 };
  return { online: true, rulesUpdated, knowledgeRefreshed, sent, failed, remaining: (await outboxAll()).length };
}
