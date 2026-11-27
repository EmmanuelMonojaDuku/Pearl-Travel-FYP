// Evaluates 6 nationalities x 6 purposes with the shared rules evaluator and reports how many distinct checklists result.
// Run from the project root: npx tsx docs/poster/evidence/profile-matrix.mts
import defaults from '../../../shared/defaultRules.json' with { type: 'json' };
import { evaluateRules, type NationalityGroupConfig, type RuleRecord } from '../../../shared/rulesEvaluator.ts';

const nats = ['Uganda', 'Kenya', 'Rwanda', 'United States', 'India', 'Zambia'];
const purposes = ['tourism', 'business', 'family', 'studies', 'transit', 'employment'];
const sets = new Map<string, string[]>();
for (const n of nats) for (const p of purposes) {
  const r = evaluateRules({ nationality: n, purpose: p }, defaults.rules as unknown as RuleRecord[], defaults.groups as NationalityGroupConfig);
  const key = r.checklist.map((c) => c.id).sort().join('|');
  sets.set(key, [...(sets.get(key) ?? []), `${n}/${p}`]);
}
console.log(`profiles: ${nats.length * purposes.length}, distinct checklists: ${sets.size}`);
const byGroup = new Map<string, number[]>();
for (const n of nats) { const r = evaluateRules({ nationality: n, purpose: 'tourism' }, defaults.rules as unknown as RuleRecord[], defaults.groups as NationalityGroupConfig); byGroup.set(r.group, [...(byGroup.get(r.group) ?? []), r.checklist.length]); }
console.log([...byGroup].map(([g, v]) => `${g}: tourism checklist ${v.join('/')} items`).join('\n'));
const r1 = evaluateRules({ nationality: 'Kenya', purpose: 'studies' }, defaults.rules as unknown as RuleRecord[], defaults.groups as NationalityGroupConfig);
const r2 = evaluateRules({ nationality: 'Kenya', purpose: 'studies' }, defaults.rules as unknown as RuleRecord[], defaults.groups as NationalityGroupConfig);
console.log('deterministic:', JSON.stringify(r1) === JSON.stringify(r2));
