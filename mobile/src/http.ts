import * as SecureStore from 'expo-secure-store';
import { API_BASE } from './config';

export class ApiUnavailableError extends Error { constructor() { super('The server cannot be reached.'); } }
export class ApiError extends Error { constructor(message: string, public status: number, public code?: string) { super(message); } }

export interface Tokens { accessToken: string; refreshToken: string }
const KEY = 'pearl_tokens_v1';

/** Tokens live in the device's secure store (Keychain / Keystore), never in plain storage. */
export const loadTokens = async (): Promise<Tokens | null> => {
  try { const raw = await SecureStore.getItemAsync(KEY); return raw ? (JSON.parse(raw) as Tokens) : null; } catch { return null; }
};
export const saveTokens = (t: Tokens) => SecureStore.setItemAsync(KEY, JSON.stringify(t));
export const clearTokens = () => SecureStore.deleteItemAsync(KEY).catch(() => undefined);

async function raw<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiUnavailableError();
  }
  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; error?: { message?: string; code?: string } } | null;
  if (!res.ok || !json?.success) throw new ApiError(json?.error?.message ?? `Request failed (${res.status})`, res.status, json?.error?.code);
  return json.data as T;
}

let onSignedOut: (() => void) | null = null;
export const setSignedOutHandler = (fn: () => void) => { onSignedOut = fn; };

/** Authenticated call. One 401 triggers a single token refresh, then the call is retried. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const tokens = await loadTokens();
  try {
    return await raw<T>(method, path, body, tokens?.accessToken);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401 && tokens?.refreshToken) {
      try {
        const r = await raw<{ tokens: Tokens }>('POST', '/auth/refresh', { refreshToken: tokens.refreshToken });
        await saveTokens(r.tokens);
        return await raw<T>(method, path, body, r.tokens.accessToken);
      } catch (inner) {
        if (inner instanceof ApiError && inner.status === 401) { await clearTokens(); onSignedOut?.(); }
        throw inner;
      }
    }
    throw e;
  }
}
export const publicApi = <T>(method: string, path: string, body?: unknown) => raw<T>(method, path, body);

export interface ServerUser { id: string; email: string; fullName: string; firstName?: string; nationality?: string | null; travelPurpose?: string | null; roles: string[] }
export async function login(email: string, password: string): Promise<ServerUser> {
  const r = await raw<{ user: ServerUser; tokens: Tokens }>('POST', '/auth/login', { email, password });
  await saveTokens(r.tokens);
  return r.user;
}
export async function register(firstName: string, lastName: string, email: string, password: string): Promise<void> {
  await raw('POST', '/auth/register', { firstName, lastName, email, password, fullName: `${firstName} ${lastName}`.trim() });
}
/** Roles always come from the server. */
export const me = async (): Promise<ServerUser> => (await api<{ user: ServerUser }>('GET', '/auth/me')).user;
export async function logout(): Promise<void> {
  const t = await loadTokens();
  if (t) await raw('POST', '/auth/logout', { refreshToken: t.refreshToken }, t.accessToken).catch(() => undefined);
  await clearTokens();
}
