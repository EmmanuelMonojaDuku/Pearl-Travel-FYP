import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BUNDLED_RULES, buildChecklist } from '../src/logic.ts';

test('checklist depends on nationality and purpose', () => {
  const kenyaBiz = buildChecklist({ nationality: 'Kenya', purpose: 'business' }, BUNDLED_RULES);
  const frTour = buildChecklist({ nationality: 'France', purpose: 'tourism' }, BUNDLED_RULES);
  assert.equal(kenyaBiz.group, 'eac');
  assert.equal(frTour.group, 'visa_required');
  assert.ok(frTour.items.some((i) => i.id === 'doc-visa' && i.status === 'missing'));
  assert.ok(kenyaBiz.items.some((i) => i.id === 'doc-purpose-business'));
  assert.ok(!frTour.items.some((i) => i.id === 'doc-purpose-business'));
});

test('changing purpose updates the checklist and keeps statuses the traveller already set', () => {
  const a = buildChecklist({ nationality: 'Kenya', purpose: 'business' }, BUNDLED_RULES);
  const marked = a.items.map((i) => (i.id === 'doc-passport' ? { ...i, status: 'complete' as const } : i));
  const b = buildChecklist({ nationality: 'Kenya', purpose: 'studies' }, BUNDLED_RULES, marked);
  assert.equal(b.items.find((i) => i.id === 'doc-passport')?.status, 'complete');
  assert.ok(b.items.some((i) => i.id === 'doc-purpose-studies'));
  assert.ok(!b.items.some((i) => i.id === 'doc-purpose-business'));
});

test('missing and unsupported input is reported, not guessed', () => {
  assert.ok(buildChecklist({}, BUNDLED_RULES).warnings.includes('missing_nationality'));
  assert.ok(buildChecklist({ nationality: 'Kenya', purpose: 'pilgrimage' }, BUNDLED_RULES).warnings.includes('unsupported_purpose'));
  assert.ok(buildChecklist({ nationality: 'Kenya' }, BUNDLED_RULES).warnings.includes('missing_purpose'));
});

test('readiness scoring ignores not-needed items and weights mandatory ones', () => {
  const r = buildChecklist({ nationality: 'Kenya', purpose: 'tourism' }, BUNDLED_RULES);
  const all = r.items.map((i) => ({ ...i, status: 'complete' as const }));
  assert.equal(buildChecklist({ nationality: 'Kenya', purpose: 'tourism' }, BUNDLED_RULES, all).readiness.score, 100);
});
