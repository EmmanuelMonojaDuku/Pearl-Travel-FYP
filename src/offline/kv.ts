/**
 * Structured offline storage on IndexedDB: a key/value store (rules snapshot, guidance, last pass)
 * and an outbox of changes waiting to be synchronised. Falls back to memory when IndexedDB is unavailable
 * (for example in a private window) so the app keeps working.
 */
const DB_NAME = 'pearl-travel';
const DB_VERSION = 1;

export interface OutboxItem {
  id: string; // idempotency key, also sent to the server as clientKey
  type: 'journey' | 'assessment';
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

const memKv = new Map<string, unknown>();
const memOutbox = new Map<string, OutboxItem>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function run<T>(store: 'kv' | 'outbox', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) return resolve(undefined);
        try {
          const req = fn(db.transaction(store, mode).objectStore(store));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      })
  );
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await open();
  if (!db) return memKv.get(key) as T | undefined;
  return run<T>('kv', 'readonly', (s) => s.get(key));
}
export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await open();
  if (!db) { memKv.set(key, value); return; }
  await run('kv', 'readwrite', (s) => s.put(value, key));
}
export async function kvDel(key: string): Promise<void> {
  const db = await open();
  if (!db) { memKv.delete(key); return; }
  await run('kv', 'readwrite', (s) => s.delete(key));
}

export async function outboxAll(): Promise<OutboxItem[]> {
  const db = await open();
  const items = db ? ((await run<OutboxItem[]>('outbox', 'readonly', (s) => s.getAll())) ?? []) : [...memOutbox.values()];
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function outboxPut(item: OutboxItem): Promise<void> {
  const db = await open();
  if (!db) { memOutbox.set(item.id, item); return; }
  await run('outbox', 'readwrite', (s) => s.put(item));
}
export async function outboxRemove(id: string): Promise<void> {
  const db = await open();
  if (!db) { memOutbox.delete(id); return; }
  await run('outbox', 'readwrite', (s) => s.delete(id));
}
