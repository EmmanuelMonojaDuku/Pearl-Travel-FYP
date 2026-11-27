import { useSyncExternalStore } from 'react';
import type { KnowledgeArticle } from '../types';
import { VERIFIED_KNOWLEDGE_ARTICLES } from './verifiedKnowledgeBase';
import { getKnowledge, type KnowledgeSnapshot } from '../utils/api';
import { kvGet, kvSet } from '../offline/kv';

/** Guidance used by the on-device assistant and the alerts list: bundled copy, replaced by the latest cached server copy. */
const CACHE_KEY = 'knowledge-snapshot';
let articles: KnowledgeArticle[] = VERIFIED_KNOWLEDGE_ARTICLES;
let revision = 0;
const listeners = new Set<() => void>();

export const getKnowledgeArticles = () => articles;
export const useKnowledgeRevision = () => useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => revision, () => revision);

function apply(s: KnowledgeSnapshot) {
  articles = s.articles.map((a) => ({
    id: a.slug,
    category: a.category as KnowledgeArticle['category'],
    title: a.title,
    summary: a.summary,
    detailedContent: a.body,
    officialAuthority: a.official_authority,
    approvedByAdmin: true, // the server only returns published (reviewed) items
    lastReviewedDate: a.updated_at.slice(0, 10),
    keywords: a.keywords ?? [],
  }));
  revision += 1;
  listeners.forEach((l) => l());
}

export async function hydrateKnowledgeFromCache(): Promise<void> {
  const cached = await kvGet<KnowledgeSnapshot>(CACHE_KEY);
  if (cached?.articles?.length) apply(cached);
}

export async function refreshKnowledgeFromServer(): Promise<boolean> {
  try {
    const fresh = await getKnowledge();
    await kvSet(CACHE_KEY, fresh);
    apply(fresh);
    return true;
  } catch {
    return false;
  }
}
