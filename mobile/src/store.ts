import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device cache for structured data (profile, journey, rules, checklist, saved pass) and the queue of unsent changes. */
export async function kvGet<T>(key: string): Promise<T | null> {
  try { const v = await AsyncStorage.getItem(`pt:${key}`); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
export const kvSet = (key: string, value: unknown) => AsyncStorage.setItem(`pt:${key}`, JSON.stringify(value));
export const kvDel = (key: string) => AsyncStorage.removeItem(`pt:${key}`);

export interface OutboxItem { id: string; type: 'journey' | 'assessment'; payload: Record<string, unknown>; createdAt: string }
const OUTBOX = 'outbox';
export const outboxAll = async () => (await kvGet<OutboxItem[]>(OUTBOX)) ?? [];
export async function outboxPut(item: OutboxItem) {
  const rest = (await outboxAll()).filter((i) => i.id !== item.id && !(item.type === 'journey' && i.type === 'journey') && !(item.type === 'assessment' && i.type === 'assessment'));
  await kvSet(OUTBOX, [...rest, item]);
}
export const outboxRemove = async (id: string) => kvSet(OUTBOX, (await outboxAll()).filter((i) => i.id !== id));
