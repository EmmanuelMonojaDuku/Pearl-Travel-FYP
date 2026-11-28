import defaults from '../../shared/defaultRules.json';
import { evaluateRules, scoreReadiness, type EvaluationProfile, type ItemStatus, type NationalityGroupConfig, type RuleRecord } from '../../shared/rulesEvaluator';

export interface RulesSnapshot { generatedAt: string; version: number; groups: NationalityGroupConfig; rules: RuleRecord[] }
export const BUNDLED_RULES: RulesSnapshot = { generatedAt: 'bundled', version: 0, groups: defaults.groups as NationalityGroupConfig, rules: defaults.rules as unknown as RuleRecord[] };

export interface Traveller { nationality?: string; purpose?: string; travelMode?: string; borderPoint?: string; passport?: boolean; yellowFever?: boolean; returnTicket?: boolean; accommodation?: boolean; insurance?: boolean }
export interface CheckItem { id: string; title: string; description: string; mandatory: boolean; status: ItemStatus; guidanceNote?: string; reasons?: string[] }

const initial = (id: string, t: Traveller, group: string): ItemStatus => {
  switch (id) {
    case 'doc-passport': return t.passport ? 'complete' : 'missing';
    case 'doc-visa': return group === 'visa_required' ? 'missing' : 'complete';
    case 'doc-yellow-fever': return t.yellowFever ? 'complete' : 'missing';
    case 'doc-return-ticket': return t.returnTicket ? 'complete' : 'missing';
    case 'doc-accommodation': return t.accommodation ? 'complete' : 'missing';
    case 'doc-travel-insurance': return t.insurance ? 'complete' : 'missing';
    default: return 'missing';
  }
};

/** Evaluates the rules for the traveller's nationality and purpose, then keeps statuses the traveller already set. */
export function buildChecklist(t: Traveller, rules: RulesSnapshot, existing: CheckItem[] = []) {
  const profile: EvaluationProfile = { nationality: t.nationality, purpose: t.purpose, travelMode: t.travelMode, borderPoint: t.borderPoint };
  const result = evaluateRules(profile, rules.rules, rules.groups);
  const kept = new Map(existing.map((i) => [i.id, i.status]));
  const checklist: CheckItem[] = result.checklist.map((c) => ({
    id: c.id, title: c.title, description: c.description, mandatory: c.mandatory, guidanceNote: c.guidanceNote, reasons: c.reasons,
    status: kept.get(c.id) ?? initial(c.id, t, result.group),
  }));
  return { ...result, items: checklist, readiness: scoreReadiness(checklist) };
}
