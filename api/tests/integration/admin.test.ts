import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assignOfficer, auth, createIntegrationApp, hasDatabase, makeUser, type TestUser } from './harness.js';
import { USER_ROLES } from '../../src/shared/roles.js';

const tag = randomUUID().slice(0, 6);
const guidance = { category: 'customs', title: `Duty free alcohol test ${tag}`, summary: 'Alcohol allowance summary', body: 'Travellers may bring a small quantity of alcohol for personal use. Confirm the current allowance with URA.', officialAuthority: 'Uganda Revenue Authority', keywords: ['alcohol'] };

describe.skipIf(!hasDatabase)('central officer/admin data, RBAC and audit (real PostgreSQL)', () => {
  let ctx: Awaited<ReturnType<typeof createIntegrationApp>>;
  let adminA: TestUser, adminB: TestUser, officer: TestUser, traveller: TestUser;
  const call = (u: TestUser | null, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT', url: string, payload?: unknown) =>
    ctx.app.inject({ method, url: `/api/v1${url}`, headers: u ? auth(u) : {}, payload: payload as object });

  beforeAll(async () => {
    ctx = await createIntegrationApp();
    // leftovers from earlier runs of this suite must not leak into assertions
    await ctx.db.query(`DELETE FROM public.pt_admin_requirements WHERE code LIKE 'req-test-%'`);
    adminA = await makeUser(ctx, USER_ROLES.ADMIN_STAFF);
    adminB = await makeUser(ctx, USER_ROLES.ADMIN_STAFF);
    officer = await makeUser(ctx, USER_ROLES.BORDER_OFFICER);
    traveller = await makeUser(ctx, USER_ROLES.TRAVELLER);
  });
  afterAll(async () => {
    await ctx.db.query(`DELETE FROM public.pt_admin_requirements WHERE code LIKE 'req-test-%'`);
    await ctx.app.close();
  });

  it('blocks every admin endpoint for anonymous users, travellers and officers', async () => {
    for (const u of [null, traveller, officer]) {
      for (const [m, url] of [['GET', '/admin/users'], ['GET', '/admin/workflow/content'], ['GET', '/admin/audit-logs'], ['POST', '/admin/kb/reindex'], ['GET', '/admin/ai-suggestions']] as const) {
        const res = await call(u, m, url);
        expect(res.statusCode, `${u ? 'role' : 'anon'} ${m} ${url}`).toBe(u ? 403 : 401);
      }
    }
  });

  it('runs the content workflow: draft, submit, no self-approval, second administrator publishes', async () => {
    const created = (await call(adminA, 'POST', '/admin/workflow/content', guidance)).json().data;
    expect(created.workflow_status).toBe('draft');
    const published = async () => (await call(null, 'GET', '/assistant/knowledge')).json().data.articles.map((a: { title: string }) => a.title);
    expect(await published()).not.toContain(guidance.title);

    expect((await call(adminA, 'POST', `/admin/workflow/content/${created.id}/submit`)).statusCode).toBe(200);
    const self = await call(adminA, 'POST', `/admin/workflow/content/${created.id}/publish`);
    expect(self.statusCode).toBe(403);
    expect(self.json().error.code).toBe('SELF_APPROVAL_BLOCKED');
    expect(await published()).not.toContain(guidance.title);

    expect((await call(adminB, 'POST', `/admin/workflow/content/${created.id}/publish`)).statusCode).toBe(200);
    expect(await published()).toContain(guidance.title);

    // published items cannot be edited in place
    expect((await call(adminA, 'PATCH', `/admin/workflow/content/${created.id}`, { title: 'Changed' })).statusCode).toBe(409);
    await call(adminA, 'POST', `/admin/workflow/content/${created.id}/unpublish`);
    expect(await published()).not.toContain(guidance.title);
    expect((await call(adminA, 'PATCH', `/admin/workflow/content/${created.id}`, { title: 'Duty free alcohol (edited)' })).statusCode).toBe(200);
  });

  it('requires a reason to reject and lets the author fix and resubmit', async () => {
    const c = (await call(adminA, 'POST', '/admin/workflow/content', { ...guidance, title: `Reject me please ${tag}` })).json().data;
    await call(adminA, 'POST', `/admin/workflow/content/${c.id}/submit`);
    expect((await call(adminB, 'POST', `/admin/workflow/content/${c.id}/reject`, {})).statusCode).toBe(400);
    expect((await call(adminB, 'POST', `/admin/workflow/content/${c.id}/reject`, { reason: 'Needs the official source link' })).statusCode).toBe(200);
    expect((await call(adminA, 'POST', `/admin/workflow/content/${c.id}/submit`)).statusCode).toBe(200);
  });

  it('manages rules as data: a new rule reaches travellers only after approval, and is then marked verified', async () => {
    const code = `req-test-${randomUUID().slice(0, 6)}`;
    const rule = (await call(adminA, 'POST', '/admin/workflow/requirements', {
      code, category: 'entry', title: 'Study: test letter', summary: 'Test', simpleExplanation: 'Carry the test letter.', applicableCondition: 'Studying', officialSource: 'Test source', mandatory: false,
      metadata: { order: 300, when: { purposes: ['studies'], nationalityGroups: ['eac'] }, checklist: { id: 'doc-test-letter', title: 'Test letter', description: 'd', category: 'supporting' } },
    })).json().data;
    const ids = async () => (await call(null, 'GET', '/rules/evaluate?nationality=Kenya&purpose=studies')).json().data.checklist.map((c: { id: string }) => c.id);
    expect(await ids()).not.toContain('doc-test-letter');
    await call(adminA, 'POST', `/admin/workflow/requirements/${rule.id}/submit`);
    expect((await call(adminA, 'POST', `/admin/workflow/requirements/${rule.id}/publish`)).statusCode).toBe(403);
    expect((await call(adminB, 'POST', `/admin/workflow/requirements/${rule.id}/publish`)).statusCode).toBe(200);
    expect(await ids()).toContain('doc-test-letter');
    const item = (await call(null, 'GET', '/rules/evaluate?nationality=Kenya&purpose=studies')).json().data.checklist.find((c: { id: string }) => c.id === 'doc-test-letter');
    expect(item.verification.status).toBe('verified');
    // other purposes are unaffected
    expect((await call(null, 'GET', '/rules/evaluate?nationality=Kenya&purpose=tourism')).json().data.checklist.map((c: { id: string }) => c.id)).not.toContain('doc-test-letter');
  });

  it('manages roles and officer assignments on the server and audits each change', async () => {
    const newUser = await makeUser(ctx, USER_ROLES.TRAVELLER);
    // assignment needs the officer role first
    expect((await call(adminA, 'POST', `/admin/users/${newUser.id}/assignments`, { borderPostCode: 'MALABA-OSBP' })).statusCode).toBe(409);
    expect((await call(adminA, 'POST', `/admin/users/${newUser.id}/roles`, { role: 'border_officer' })).statusCode).toBe(200);
    expect((await call(adminA, 'POST', `/admin/users/${newUser.id}/assignments`, { borderPostCode: 'MALABA-OSBP' })).statusCode).toBe(201);
    const users = (await call(adminA, 'GET', '/admin/users')).json().data;
    const row = users.find((u: { id: string }) => u.id === newUser.id);
    expect(row.roles).toContain('border_officer');
    expect(row.border_posts).toContain('MALABA-OSBP');
    expect(users.some((u: { email: string }) => u.email.includes('system@'))).toBe(false);
    // an administrator cannot remove their own admin role
    expect((await call(adminA, 'DELETE', `/admin/users/${adminA.id}/roles/admin_staff`)).statusCode).toBe(409);
    const audit = (await call(adminA, 'GET', '/admin/audit-logs?limit=100')).json().data.map((l: { action: string }) => l.action);
    for (const a of ['user.role.grant', 'officer.assign', 'content_item.publish', 'requirement_rule.publish']) expect(audit).toContain(a);
  });

  it('only lets an officer with a border assignment use verification (assignment lives in the database, not the browser)', async () => {
    const res = await call(officer, 'GET', '/qr/verifications');
    expect(res.statusCode).toBe(200); // history is open to officers
    const verify = await call(officer, 'POST', '/qr/verify', { token: `PT1.${'a'.repeat(30)}.${'b'.repeat(30)}` });
    expect(verify.statusCode).toBe(403);
    await assignOfficer(ctx, officer.id);
    expect((await call(officer, 'POST', '/qr/verify', { token: `PT1.${'a'.repeat(30)}.${'b'.repeat(30)}` })).statusCode).toBe(200);
  });

  it('manages AI suggestions: a human approves before anything is published', async () => {
    const s = (await call(adminA, 'POST', '/admin/ai-suggestions', { kind: 'ADD', category: 'health', title: `Malaria prevention note ${tag}`, proposedSummary: 'Summary of the suggestion', proposedBody: 'Consider malaria prevention advice from the Ministry of Health before travel.', rationale: 'Test' })).json().data;
    expect(s.status).toBe('pending');
    const before = (await call(null, 'GET', '/assistant/knowledge')).json().data.articles.map((a: { title: string }) => a.title);
    expect(before).not.toContain(`Malaria prevention note ${tag}`);
    expect((await call(adminB, 'POST', `/admin/ai-suggestions/${s.id}/approve`)).statusCode).toBe(200);
    expect((await call(null, 'GET', '/assistant/knowledge')).json().data.articles.map((a: { title: string }) => a.title)).toContain(`Malaria prevention note ${tag}`);
    expect((await call(adminB, 'POST', `/admin/ai-suggestions/${s.id}/approve`)).statusCode).toBe(409);
    const r = (await call(adminA, 'POST', '/admin/ai-suggestions', { kind: 'ADD', category: 'health', title: `Reject this suggestion ${tag}`, proposedSummary: 'Summary of it', proposedBody: 'Some body text for the suggestion here.' })).json().data;
    expect((await call(adminA, 'POST', `/admin/ai-suggestions/${r.id}/reject`, { reason: 'Not supported by an official source' })).statusCode).toBe(200);
    // drafting needs an LLM; without one the API says so instead of faking a draft
    expect((await call(adminA, 'POST', '/admin/ai-suggestions/draft', { topic: 'Visa fees', sourceText: 'x'.repeat(60) })).statusCode).toBe(503);
  });

  it('synchronises traveller data idempotently: stale journeys are ignored and duplicate assessments are not stored twice', async () => {
    const journey = { intendedBorderPoint: 'Malaba One-Stop Border Post (OSBP)', destinationCountry: 'Uganda', travelPurpose: 'business', travelMode: 'road', travelDate: '2026-12-20', stayDurationDays: 7, notes: null };
    expect((await call(traveller, 'PUT', '/me/journey', { ...journey, clientUpdatedAt: '2026-11-27T10:00:00.000Z' })).json().data.applied).toBe(true);
    expect((await call(traveller, 'PUT', '/me/journey', { ...journey, travelDate: '2026-12-25', clientUpdatedAt: '2026-11-27T09:00:00.000Z' })).json().data).toMatchObject({ applied: false, reason: 'stale' });
    expect((await call(traveller, 'GET', '/me/journey')).json().data.travel_date).toBe('2026-12-20');
    expect((await call(traveller, 'PUT', '/me/journey', { ...journey, travelDate: '2026-12-30', clientUpdatedAt: '2026-11-27T11:00:00.000Z' })).json().data.applied).toBe(true);
    expect((await call(traveller, 'GET', '/me/journey')).json().data.travel_date).toBe('2026-12-30');

    const a = { clientKey: randomUUID(), nationality: 'Kenya', score: 70, status: 'Action Needed', completedItems: 4, totalItems: 6, missingMandatoryCount: 1, checklist: [{ code: 'doc-passport', status: 'complete' }] };
    expect((await call(traveller, 'POST', '/me/assessments', a)).statusCode).toBe(201);
    const dup = await call(traveller, 'POST', '/me/assessments', a);
    expect(dup.statusCode).toBe(200);
    expect(dup.json().data.duplicate).toBe(true);
    const count = await ctx.db.query(`SELECT 1 FROM public.pt_readiness_assessments WHERE client_key = $1`, [a.clientKey]);
    expect(count.rowCount).toBe(1);
    expect((await call(null, 'PUT', '/me/journey', journey)).statusCode).toBe(401);
  });
});
