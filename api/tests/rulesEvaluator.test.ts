import { describe, expect, it } from 'vitest';
import defaults from '../../shared/defaultRules.json' with { type: 'json' };
import { classifyNationality, evaluateRules, scoreReadiness, KNOWN_PURPOSES, type NationalityGroupConfig, type RuleRecord } from '../../shared/rulesEvaluator.js';

const rules = defaults.rules as unknown as RuleRecord[];
const groups = defaults.groups as NationalityGroupConfig;
const run = (nationality: string | undefined, purpose: string | undefined, extra: Record<string, string> = {}) =>
  evaluateRules({ nationality, purpose, ...extra }, rules, groups);
const ids = (r: ReturnType<typeof run>) => r.checklist.map((c) => c.id);

describe('rules evaluator: nationality and purpose of travel', () => {
  it('classifies nationalities into groups', () => {
    expect(classifyNationality('Uganda', groups)).toBe('citizen');
    expect(classifyNationality('Kenya', groups)).toBe('eac');
    expect(classifyNationality('Zambia', groups)).toBe('visa_exempt');
    expect(classifyNationality('India', groups)).toBe('visa_required');
    expect(classifyNationality('  kenya ', groups)).toBe('eac');
  });

  it('applies the right visa rule for every nationality group', () => {
    const visa = (n: string) => run(n, 'tourism').requirements.find((r) => r.category === 'visa')?.code;
    expect(visa('Uganda')).toBe('req-visa-citizen');
    expect(visa('Rwanda')).toBe('req-visa-eac');
    expect(visa('Zambia')).toBe('req-visa-exempt');
    expect(visa('Eritrea')).toBe('req-visa-evisa');
  });

  it('changing the purpose of travel changes the guidance and checklist', () => {
    const tourism = ids(run('India', 'tourism'));
    expect(ids(run('India', 'business'))).toContain('doc-purpose-business');
    expect(tourism).not.toContain('doc-purpose-business');
    expect(ids(run('India', 'studies'))).toContain('doc-purpose-studies');
    expect(ids(run('India', 'family'))).toContain('doc-purpose-family');
    expect(ids(run('India', 'employment'))).toContain('doc-purpose-employment');
    expect(ids(run('India', 'transit'))).toContain('doc-purpose-transit');
  });

  it('transit uses the transit visa and drops accommodation and return-ticket items', () => {
    const t = run('Eritrea', 'transit');
    expect(t.requirements.some((r) => r.code === 'req-visa-transit')).toBe(true);
    expect(t.requirements.some((r) => r.code === 'req-visa-evisa')).toBe(false);
    expect(ids(t)).not.toContain('doc-accommodation');
    expect(ids(t)).not.toContain('doc-return-ticket');
  });

  it('does not ask citizens for visitor-only documents', () => {
    const c = run('Uganda', 'business');
    expect(ids(c)).not.toContain('doc-purpose-business');
    expect(ids(c)).not.toContain('doc-return-ticket');
  });

  it('produces many distinct rule sets across nationality x purpose (not just a few hard-coded cases)', () => {
    const sets = new Set<string>();
    for (const n of ['Uganda', 'Kenya', 'Zambia', 'India']) for (const p of KNOWN_PURPOSES) sets.add(JSON.stringify(run(n, p).requirements.map((r) => r.code)));
    expect(sets.size).toBeGreaterThanOrEqual(12);
  });

  it('handles missing, unsupported and ambiguous input safely', () => {
    expect(run(undefined, 'tourism').warnings).toContain('missing_nationality');
    expect(run('India', undefined).warnings).toContain('missing_purpose');
    const odd = run('India', 'pilgrimage');
    expect(odd.warnings).toContain('unsupported_purpose');
    expect(odd.purpose).toBe('other');
    // base rules still apply, purpose-specific ones do not
    expect(ids(odd)).toContain('doc-passport');
    expect(ids(odd).some((i) => i.startsWith('doc-purpose-'))).toBe(false);
  });

  it('flags rules that are not yet officially verified and is deterministic', () => {
    const a = run('India', 'business');
    expect(a.warnings).toContain('unverified_rules_applied');
    expect(JSON.stringify(a)).toBe(JSON.stringify(run('India', 'business')));
  });

  it('is configurable: a rule added as data is applied without changing code', () => {
    const extra: RuleRecord = { ...rules[0]!, code: 'req-test-extra', order: 999, when: { nationalityGroups: ['eac'], purposes: ['studies'] }, checklist: { id: 'doc-extra', title: 'Extra', description: 'd', category: 'supporting' } };
    const r = evaluateRules({ nationality: 'Kenya', purpose: 'studies' }, [...rules, extra], groups);
    expect(r.checklist.map((c) => c.id)).toContain('doc-extra');
    expect(evaluateRules({ nationality: 'Kenya', purpose: 'tourism' }, [...rules, extra], groups).checklist.map((c) => c.id)).not.toContain('doc-extra');
  });

  it('interpolates nationality and purpose into guidance text', () => {
    const e = run('Eritrea', 'business').requirements.find((r) => r.code === 'req-visa-evisa')!;
    expect(e.applicableCondition).toContain('Eritrea');
    expect(e.applicableCondition).toContain('business');
  });

  it('scores readiness: mandatory counts double and N/A is ignored', () => {
    const s = scoreReadiness([
      { mandatory: true, status: 'complete' },
      { mandatory: true, status: 'missing' },
      { mandatory: false, status: 'complete' },
      { mandatory: false, status: 'not_applicable' },
    ]);
    expect(s.score).toBe(Math.round((3 / 5) * 100));
    expect(s.missingMandatoryCount).toBe(1);
    expect(s.totalCount).toBe(3);
  });
});
