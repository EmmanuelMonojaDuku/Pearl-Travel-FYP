import { answerQuestion } from '../../../src/data/assistantEngine';
import { generateRequirementsForProfile, generateDefaultChecklist, calculateReadinessScore } from '../../../src/data/travelRequirementsEngine';
(globalThis as any).localStorage = { getItem: () => null, setItem() {} };

const profile: any = { firstName: 'A', fullName: 'A B', nationality: 'Kenya', travelPurpose: 'business' };
const checklist = generateDefaultChecklist({ ...profile, hasYellowFeverVax: true, hasReturnTicket: true } as any);
const ctx = (extra = {}): any => ({ profile, journey: { intendedBorderPoint: 'Malaba One-Stop Border Post (OSBP)' }, checklist, lastArticleId: null, ...extra });

type T = { q: string; group: 'in-scope' | 'personal' | 'app' | 'out-of-scope' | 'unsupported'; expect: string[] };
const tests: T[] = [
  { q: 'Do I need a visa for Uganda?', group: 'in-scope', expect: ['kb-evisa-application', 'kb-eac-free-movement'] },
  { q: 'How much is the Uganda e-visa?', group: 'in-scope', expect: ['kb-evisa-application'] },
  { q: 'What is the Yellow Fever rule?', group: 'in-scope', expect: ['kb-yellow-fever'] },
  { q: 'Do I need a yellow card to enter Uganda?', group: 'in-scope', expect: ['kb-yellow-fever'] },
  { q: 'Can EAC citizens use a national ID?', group: 'in-scope', expect: ['kb-eac-free-movement'] },
  { q: 'What documents do I need to drive my car across?', group: 'in-scope', expect: ['kb-road-vehicle-clearance'] },
  { q: 'What is COMESA insurance?', group: 'in-scope', expect: ['kb-road-vehicle-clearance'] },
  { q: 'Can I bring a drone into Uganda?', group: 'in-scope', expect: ['kb-customs-allowances'] },
  { q: 'How much cash can I carry across the border?', group: 'in-scope', expect: ['kb-customs-allowances'] },
  { q: 'How does clearance work at Malaba?', group: 'in-scope', expect: ['kb-malaba-osbp-clearing'] },
  { q: 'What are the border opening hours?', group: 'in-scope', expect: ['kb-land-border-general'] },
  { q: 'Tell me about Busia border', group: 'in-scope', expect: ['kb-busia'] },
  { q: 'Which border crossings does Uganda have?', group: 'in-scope', expect: ['kb-border-list'] },
  { q: 'What happens at Entebbe airport?', group: 'in-scope', expect: ['kb-entebbe-airport'] },
  { q: 'Can I travel with my child?', group: 'in-scope', expect: ['kb-minors'] },
  { q: 'I lost my passport', group: 'in-scope', expect: ['kb-problems-border'] },
  { q: 'How do I extend my stay?', group: 'in-scope', expect: ['kb-problems-border'] },
  { q: 'Where can I exchange money?', group: 'in-scope', expect: ['kb-money-border'] },
  { q: 'Transit through Uganda to Rwanda', group: 'in-scope', expect: ['kb-transit-rules'] },
  { q: 'Katuna border Rwanda', group: 'in-scope', expect: ['kb-katuna-rwanda'] },
  { q: 'Elegu South Sudan crossing', group: 'in-scope', expect: ['kb-elegu-south-sudan'] },
  { q: 'Mutukula Tanzania', group: 'in-scope', expect: ['kb-mutukula-tanzania'] },
  { q: 'Is Bunagana open?', group: 'in-scope', expect: ['kb-drc-borders'] },
  { q: 'Should I pay someone to skip the queue?', group: 'in-scope', expect: ['kb-land-border-general'] },
  { q: 'What am I still missing?', group: 'personal', expect: ['personal'] },
  { q: 'Am I ready to cross?', group: 'personal', expect: ['personal'] },
  { q: 'What documents do I need?', group: 'personal', expect: ['personal'] },
  { q: 'How do I use the QR pass?', group: 'app', expect: ['app'] },
  { q: 'How does offline mode work?', group: 'app', expect: ['app'] },
  { q: 'Who won the football world cup?', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'Write me a poem about love', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'What is the capital of France?', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'How do I cook rice?', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'Explain quantum physics', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'Recommend a good movie', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'Help me with my maths homework', group: 'out-of-scope', expect: ['out-of-scope'] },
  { q: 'What is the speed limit on Malaba road?', group: 'unsupported', expect: ['no-data', 'out-of-scope'] },
  { q: 'How many officers work at Malaba?', group: 'unsupported', expect: ['no-data', 'out-of-scope'] },
  { q: 'Can I enter Uganda with a fake passport?', group: 'unsupported', expect: ['no-data', 'out-of-scope'] },
];
const rows: any[] = [];
for (const t of tests) {
  const r = answerQuestion(t.q, ctx());
  const got = r.articleId || r.kind;
  const ok = t.expect.includes(got) || t.expect.includes(r.kind);
  rows.push({ ...t, got, ok });
}
const groups = ['in-scope', 'personal', 'app', 'out-of-scope', 'unsupported'];
const summary = Object.fromEntries(groups.map((g) => [g, { total: rows.filter((r) => r.group === g).length, pass: rows.filter((r) => r.group === g && r.ok).length }]));
console.log(JSON.stringify({ summary, total: rows.length, pass: rows.filter((r) => r.ok).length }, null, 1));
for (const r of rows.filter((r) => !r.ok)) console.log('FAIL', r.group, '|', r.q, '| got:', r.got, '| expected:', r.expect.join('/'));

// profile matrix for the rule engine
const nats = ['Kenya', 'Uganda', 'Rwanda', 'United States', 'Eritrea', 'India'];
const purposes = ['tourism', 'business', 'studies', 'transit', 'family', 'employment'];
const out: any[] = [];
for (const n of nats) {
  const row: any = { nat: n, perPurpose: {} };
  for (const p of purposes) {
    const pr: any = { fullName: 'T', nationality: n, travelPurpose: p, travellerType: 'solo', destination: 'Malaba' };
    const reqs = generateRequirementsForProfile(pr);
    const cl = generateDefaultChecklist(pr);
    const visa = reqs.find((r) => r.category === 'visa');
    row.perPurpose[p] = { reqs: reqs.length, mandatory: reqs.filter((r) => r.mandatory).length, checklist: cl.length, visa: visa?.title };
  }
  out.push(row);
}
console.log('\nMATRIX');
for (const r of out) console.log(r.nat.padEnd(14), purposes.map((p) => `${p}:${r.perPurpose[p].reqs}/${r.perPurpose[p].checklist}`).join('  '), '|', r.perPurpose.tourism.visa);
const sig = new Set(out.flatMap((r) => purposes.map((p) => JSON.stringify(generateRequirementsForProfile({ fullName: 'T', nationality: r.nat, travelPurpose: p, travellerType: 'solo', destination: 'Malaba' } as any).map((x) => x.id)))));
console.log('distinct requirement sets across', nats.length * purposes.length, 'profiles:', sig.size);
const a = JSON.stringify(generateRequirementsForProfile({ fullName: 'T', nationality: 'India', travelPurpose: 'business' } as any));
const b = JSON.stringify(generateRequirementsForProfile({ fullName: 'T', nationality: 'India', travelPurpose: 'business' } as any));
console.log('deterministic (same input -> same output):', a === b);
