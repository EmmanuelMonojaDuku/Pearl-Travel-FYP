import { ApiRequestError, refreshWithApi, request } from './apiClient';
import { loadPersistedSession, persistSession } from './authStorage';
import type { NationalityGroupConfig, RuleRecord } from '../../shared/rulesEvaluator';

/**
 * Authenticated calls to the Pearl Travel API. The access token is short-lived, so a 401 triggers one
 * refresh using the stored refresh token before the call is retried.
 */
export async function api<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const attempt = async (token?: string) =>
    (await request<T>(path, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: body === undefined ? undefined : JSON.stringify(body),
    })).data;

  const session = loadPersistedSession();
  const token = session?.user.accessToken;
  try {
    return await attempt(token);
  } catch (e) {
    if (e instanceof ApiRequestError && e.statusCode === 401 && session?.user.refreshToken) {
      try {
        const fresh = await refreshWithApi(session.user.refreshToken);
        persistSession({ ...session.user, accessToken: fresh.accessToken, refreshToken: fresh.refreshToken, roles: fresh.roles }, session.rememberMe);
        return await attempt(fresh.accessToken);
      } catch {
        throw e;
      }
    }
    throw e;
  }
}

/* ───────── Rules and knowledge (public) ───────── */
export interface RulesSnapshot { generatedAt: string; version: number; groups: NationalityGroupConfig; rules: RuleRecord[] }
export const getRulesSnapshot = () => api<RulesSnapshot>('GET', '/rules/snapshot');

export interface KnowledgeSnapshot { generatedAt: string; articles: { slug: string; category: string; title: string; summary: string; body: string; official_authority: string; keywords: string[]; updated_at: string }[] }
export const getKnowledge = () => api<KnowledgeSnapshot>('GET', '/assistant/knowledge');

/* ───────── Assistant (RAG) ───────── */
export interface AskResult {
  mode: 'rag' | 'general' | 'fallback';
  reason?: string;
  answer: string;
  sources: { id: string; title: string; authority: string; category: string; excerpt: string; reviewedAt: string }[];
  generatedBy: string | null;
  disclaimer: string;
}
export const assistantStatus = () => api<{ configured: boolean; indexedChunks: number; model: string | null }>('GET', '/assistant/status');
export const askAssistant = (question: string, ctx: { nationalityGroup?: string; purpose?: string }) => api<AskResult>('POST', '/assistant/ask', { question, ...ctx });

/* ───────── Signed QR pass ───────── */
export interface IssuedPass { token: string; referenceCode: string; expiresAt: string; score: number; status: string; documentCodes: string; advisory: string }
export const issuePass = (profile: Record<string, string | undefined>, items: { code: string; status: string }[], clientKey?: string) =>
  api<IssuedPass>('POST', '/qr/issue', { profile, items, clientKey });
export const currentPass = () => api<{ referenceCode: string; score: number; status: string; documentCodes: string; issuedAt: string; expiresAt: string; state: string } | null>('GET', '/qr/mine');
export const revokePass = () => api<{ revoked: number }>('POST', '/qr/revoke', {});

export interface VerifyResult { outcome: 'verified' | 'expired' | 'revoked' | 'invalid'; reason?: string; verificationId?: string; referenceCode?: string; score?: number; status?: string; documentCodes?: string; issuedAt?: string; expiresAt?: string; advisory: string }
export const verifyPass = (token: string) => api<VerifyResult>('POST', '/qr/verify', { token });
export const decidePass = (id: string, decision: 'approved' | 'flagged', note?: string) => api<{ id: string; decision: string }>('POST', `/qr/verifications/${id}/decision`, { decision, note });
export interface VerificationRecord { id: string; referenceCode: string; outcome: string; decision: string | null; verifiedAt: string; score: number; borderPost: string | null }
export const verificationHistory = () => api<VerificationRecord[]>('GET', '/qr/verifications');

/* ───────── Traveller sync ───────── */
export const putJourney = (j: Record<string, unknown>) => api<{ applied: boolean }>('PUT', '/me/journey', j);
export const postAssessment = (a: Record<string, unknown>) => api<{ stored: boolean; duplicate: boolean }>('POST', '/me/assessments', a);

/* ───────── Administrator ───────── */
export type Workflow = 'content' | 'requirements';
export type WorkflowRow = Record<string, unknown> & { id: string; title: string; workflow_status: string; version: number };
export const adminOverview = () => api<import('./apiClient').AdminOverview>('GET', '/admin/overview');
export const wfList = (kind: Workflow, status?: string) => api<WorkflowRow[]>('GET', `/admin/workflow/${kind}${status ? `?status=${status}` : ''}`);
export const wfCreateContent = (b: Record<string, unknown>) => api<WorkflowRow>('POST', '/admin/workflow/content', b);
export const wfCreateRule = (b: Record<string, unknown>) => api<WorkflowRow>('POST', '/admin/workflow/requirements', b);
export const wfAction = (kind: Workflow, id: string, action: 'submit' | 'approve' | 'publish' | 'reject' | 'unpublish' | 'archive', body?: Record<string, unknown>) =>
  api<WorkflowRow>('POST', `/admin/workflow/${kind}/${id}/${action}`, body ?? {});
export interface AdminUser { id: string; email: string; full_name: string; is_active: boolean; roles: string[]; border_posts: string[] }
export const adminUsers = () => api<AdminUser[]>('GET', '/admin/users');
export const grantRole = (id: string, role: string) => api('POST', `/admin/users/${id}/roles`, { role });
export const revokeRole = (id: string, role: string) => api('DELETE', `/admin/users/${id}/roles/${role}`);
export const assignPost = (id: string, borderPostCode: string) => api('POST', `/admin/users/${id}/assignments`, { borderPostCode });
export const unassignPost = (id: string, code: string) => api('DELETE', `/admin/users/${id}/assignments/${code}`);
export const borderPosts = () => api<{ id: string; code: string; name: string }[]>('GET', '/admin/border-posts');
export const auditLogs = () => api<{ id: string; action: string; actor_email: string | null; entity_type: string | null; created_at: string }[]>('GET', '/admin/audit-logs?limit=50');
export interface AiSuggestion { id: string; kind: 'ADD' | 'UPDATE'; category: string; title: string; proposed_summary: string; proposed_body: string; rationale: string | null; model: string | null; status: 'pending' | 'approved' | 'rejected'; created_at: string }
export const aiSuggestions = (status?: string) => api<AiSuggestion[]>('GET', `/admin/ai-suggestions${status ? `?status=${status}` : ''}`);
export const aiApprove = (id: string) => api('POST', `/admin/ai-suggestions/${id}/approve`, {});
export const aiReject = (id: string, reason: string) => api('POST', `/admin/ai-suggestions/${id}/reject`, { reason });
export const aiDraft = (topic: string, sourceText: string) => api<AiSuggestion>('POST', '/admin/ai-suggestions/draft', { topic, sourceText });
export const reindexKb = () => api<{ items: number; chunks: number }>('POST', '/admin/kb/reindex', {});
