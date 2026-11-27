import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { api, ApiError, ApiUnavailableError, publicApi } from './http';
import { BUNDLED_RULES, type RulesSnapshot } from './logic';
import { kvGet, kvSet, outboxAll, outboxPut, outboxRemove } from './store';

const RULES_KEY = 'rules-snapshot';
export const loadRules = async (): Promise<RulesSnapshot> => (await kvGet<RulesSnapshot>(RULES_KEY)) ?? BUNDLED_RULES;

/** Pulls the latest published rules from the server and caches them. Offline, the cached or bundled rules stay in use. */
export async function refreshRules(): Promise<RulesSnapshot | null> {
  try {
    const snap = await publicApi<RulesSnapshot>('GET', '/rules/snapshot');
    await kvSet(RULES_KEY, snap);
    return snap;
  } catch { return null; }
}

export const queueJourney = (journey: Record<string, unknown>) =>
  outboxPut({ id: 'journey-latest', type: 'journey', payload: { ...journey, clientUpdatedAt: new Date().toISOString() }, createdAt: new Date().toISOString() });

export async function queueAssessment(snapshot: Record<string, unknown>) {
  const id = Crypto.randomUUID();
  await outboxPut({ id, type: 'assessment', payload: { ...snapshot, clientKey: id }, createdAt: new Date().toISOString() });
}

/** Sends queued changes. Duplicates are harmless: assessments have a unique key, journeys keep the newest timestamp. */
export async function flushOutbox(): Promise<{ sent: number; remaining: number }> {
  let sent = 0;
  for (const item of await outboxAll()) {
    try {
      if (item.type === 'journey') await api('PUT', '/me/journey', item.payload);
      else await api('POST', '/me/assessments', item.payload);
      await outboxRemove(item.id);
      sent += 1;
    } catch (e) {
      if (e instanceof ApiUnavailableError) break;
      if (e instanceof ApiError && (e.status === 401 || e.status === 429)) break;
      await outboxRemove(item.id); // the server rejected it as invalid; retrying would never succeed
    }
  }
  return { sent, remaining: (await outboxAll()).length };
}

export const isOnline = async () => Boolean((await NetInfo.fetch()).isConnected);
export const onConnectivity = (cb: (online: boolean) => void) => NetInfo.addEventListener((s) => cb(Boolean(s.isConnected)));
