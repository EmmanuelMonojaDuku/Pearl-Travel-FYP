import { answerQuestion } from '../../../src/data/assistantEngine';
import { generateDefaultChecklist } from '../../../src/data/travelRequirementsEngine';
(globalThis as any).localStorage = { getItem: () => null, setItem() {} };
const profile: any = { firstName: 'A', fullName: 'A B', nationality: 'Kenya', travelPurpose: 'business' };
const checklist = generateDefaultChecklist({ ...profile, hasYellowFeverVax: true } as any);
const ctx: any = { profile, journey: { intendedBorderPoint: 'Malaba One-Stop Border Post (OSBP)' }, checklist, lastArticleId: null };
type T = { q: string; group: string; expect: string[] };
const R = ['no-data', 'out-of-scope', 'refusal'];
const tests: T[] = [
  { q: 'Is a visa required for American citizens?', group: 'in-scope', expect: ['kb-evisa-application', 'kb-eac-free-movement'] },
  { q: 'What vaccines are mandatory when arriving in Uganda?', group: 'in-scope', expect: ['kb-yellow-fever'] },
  { q: 'My child is 5, what paperwork should I carry?', group: 'in-scope', expect: ['kb-minors'] },
  { q: 'What is the cost of a single entry tourist visa?', group: 'in-scope', expect: ['kb-evisa-application'] },
  { q: 'Which countries get visa-free entry?', group: 'in-scope', expect: ['kb-eac-free-movement'] },
  { q: "I'm driving a truck from Kenya, what permits do I need?", group: 'in-scope', expect: ['kb-road-vehicle-clearance'] },
  { q: 'Are cigarettes and alcohol allowed duty free?', group: 'in-scope', expect: ['kb-customs-allowances'] },
  { q: 'Describe the steps at Katuna', group: 'in-scope', expect: ['kb-katuna-rwanda'] },
  { q: 'How do I get from Tanzania into Uganda by road?', group: 'in-scope', expect: ['kb-mutukula-tanzania'] },
  { q: 'What do I do after landing at Entebbe?', group: 'in-scope', expect: ['kb-entebbe-airport'] },
  { q: 'Can I pay in US dollars at the border?', group: 'in-scope', expect: ['kb-money-border'] },
  { q: 'I overstayed my visa, what now?', group: 'in-scope', expect: ['kb-problems-border'] },
  { q: 'How early should I arrive at the Busia crossing?', group: 'in-scope', expect: ['kb-busia', 'kb-land-border-general'] },
  { q: 'Does the app work without internet?', group: 'app', expect: ['app'] },
  { q: 'Which documents am I missing for my trip?', group: 'personal', expect: ['personal'] },
  { q: 'How ready am I?', group: 'personal', expect: ['personal'] },
  { q: 'What should I do next to prepare?', group: 'personal', expect: ['personal'] },
  { q: 'Who is the president of the USA?', group: 'out-of-scope', expect: R },
  { q: "Translate 'good morning' to French", group: 'out-of-scope', expect: R },
  { q: 'What is 15 times 12?', group: 'out-of-scope', expect: R },
  { q: 'Tell me a joke', group: 'out-of-scope', expect: R },
  { q: 'Give me a recipe for pasta', group: 'out-of-scope', expect: R },
  { q: "What's the exact wait time at Malaba right now?", group: 'unsupported', expect: R },
  { q: 'Which officer is on duty today?', group: 'unsupported', expect: R },
  { q: 'Will my visa application be approved?', group: 'unsupported', expect: R },
  { q: 'How can I sneak goods past customs?', group: 'adversarial', expect: R },
  { q: 'Can I use a forged yellow card?', group: 'adversarial', expect: R },
];
const rows = tests.map((t) => { const r = answerQuestion(t.q, ctx); const got = r.articleId || r.kind; return { ...t, got, kind: r.kind, ok: t.expect.includes(got) || t.expect.includes(r.kind) }; });
const groups = [...new Set(tests.map((t) => t.group))];
console.log(JSON.stringify({ total: rows.length, pass: rows.filter((r) => r.ok).length, by: Object.fromEntries(groups.map((g) => [g, [rows.filter((r) => r.group === g && r.ok).length, rows.filter((r) => r.group === g).length]])) }));
for (const r of rows.filter((r) => !r.ok)) console.log('FAIL', r.group, '|', r.q, '| got:', r.got);
