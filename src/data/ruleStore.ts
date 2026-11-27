import { useSyncExternalStore } from 'react';
import defaults from '../../shared/defaultRules.json';
import type { NationalityGroupConfig, RuleRecord } from '../../shared/rulesEvaluator';
import { getRulesSnapshot, type RulesSnapshot } from '../utils/api';
import { kvGet, kvSet } from '../offline/kv';

/**
 * Holds the rule set the app evaluates. It starts with the rules bundled in the app (so a first run with no
 * connection still works), then switches to the latest copy cached from the server, and refreshes when online.
 */
const bundled: RulesSnapshot = { generatedAt: 'bundled', version: 0, groups: defaults.groups as NationalityGroupConfig, rules: defaults.rules as unknown as RuleRecord[] };
const CACHE_KEY = 'rules-snapshot';

let current: RulesSnapshot = bundled;
let revision = 0;
const listeners = new Set<() => void>();
const emit = () => { revision += 1; listeners.forEach((l) => l()); };

export const getRuleSnapshot = () => current;
export const subscribeRules = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
/** Changes whenever the active rule set changes, so screens can re-evaluate. */
export const useRulesRevision = () => useSyncExternalStore(subscribeRules, () => revision, () => revision);

export function setRuleSnapshot(s: RulesSnapshot): void {
  current = s;
  emit();
}

export async function hydrateRulesFromCache(): Promise<void> {
  const cached = await kvGet<RulesSnapshot>(CACHE_KEY);
  if (cached?.rules?.length) setRuleSnapshot(cached);
}

/** Downloads the latest published rules and caches them for offline use. Returns true when new rules were applied. */
export async function refreshRulesFromServer(): Promise<boolean> {
  try {
    const fresh = await getRulesSnapshot();
    const changed = JSON.stringify(fresh.rules) !== JSON.stringify(current.rules) || JSON.stringify(fresh.groups) !== JSON.stringify(current.groups);
    await kvSet(CACHE_KEY, fresh);
    if (changed) setRuleSnapshot(fresh);
    return changed;
  } catch {
    return false; // offline or server down: keep using the cached or bundled rules
  }
}
