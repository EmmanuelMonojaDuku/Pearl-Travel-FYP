import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { assignOfficer, auth, createIntegrationApp, hasDatabase, makeUser, type TestUser } from './harness.js';
import { USER_ROLES } from '../../src/shared/roles.js';

const profile = { nationality: 'Kenya', purpose: 'business', travelMode: 'road', borderPoint: 'Malaba One-Stop Border Post (OSBP)', destination: 'Entebbe & Kampala' };
const allComplete = ['doc-passport', 'doc-visa', 'doc-yellow-fever', 'doc-return-ticket', 'doc-accommodation', 'doc-travel-insurance', 'doc-purpose-business'].map((code) => ({ code, status: 'complete' as const }));
const decode = (t: string) => JSON.parse(Buffer.from(t.split('.')[1]!, 'base64url').toString());

describe.skipIf(!hasDatabase)('signed QR pass (real PostgreSQL)', () => {
  let ctx: Awaited<ReturnType<typeof createIntegrationApp>>;
  let traveller: TestUser, officer: TestUser, officer2: TestUser, unassigned: TestUser;

  const issue = (u: TestUser, items = allComplete, clientKey?: string) =>
    ctx.app.inject({ method: 'POST', url: '/api/v1/qr/issue', headers: auth(u), payload: { profile, items, clientKey } });
  const verify = (u: TestUser | null, token: string) =>
    ctx.app.inject({ method: 'POST', url: '/api/v1/qr/verify', headers: u ? auth(u) : {}, payload: { token } });

  beforeAll(async () => {
    ctx = await createIntegrationApp();
    traveller = await makeUser(ctx, USER_ROLES.TRAVELLER);
    officer = await makeUser(ctx, USER_ROLES.BORDER_OFFICER);
    officer2 = await makeUser(ctx, USER_ROLES.BORDER_OFFICER);
    unassigned = await makeUser(ctx, USER_ROLES.BORDER_OFFICER);
    await assignOfficer(ctx, officer.id);
    await assignOfficer(ctx, officer2.id);
  });
  afterAll(async () => { await ctx.app.close(); });

  it('issues a pass whose payload contains no personal information', async () => {
    const res = await issue(traveller);
    expect(res.statusCode).toBe(201);
    const { token, referenceCode } = res.json().data;
    const claims = decode(token);
    expect(Object.keys(claims).sort()).toEqual(['dc', 'exp', 'iat', 'kid', 'ref', 'rs', 'sc', 'v']);
    const raw = JSON.stringify(claims) + token;
    for (const pii of [traveller.email, 'Test', 'User', 'Kenya', 'business', traveller.id]) expect(raw).not.toContain(pii);
    expect(referenceCode).toMatch(/^PT-[A-Z2-9]{10}$/);
  });

  it('exposes the public verification key', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/qr/public-key' });
    expect(res.json().data.algorithm).toBe('Ed25519');
    expect(res.json().data.publicKeyPem).toContain('BEGIN PUBLIC KEY');
  });

  it('lets an assigned officer verify a genuine pass and returns only minimal readiness data', async () => {
    const { token } = (await issue(traveller)).json().data;
    const res = await verify(officer, token);
    const d = res.json().data;
    expect(d.outcome).toBe('verified');
    expect(d.score).toBe(100);
    expect(d.documentCodes).toHaveLength(6);
    expect(Object.keys(d)).not.toContain('name');
    expect(JSON.stringify(d)).not.toContain(traveller.email);
    expect(d.advisory).toMatch(/not an identity check/i);
  });

  it('rejects a tampered payload (score edited) and a tampered signature', async () => {
    const { token } = (await issue(traveller, allComplete.map((i) => ({ ...i, status: 'missing' as const })))).json().data;
    const [h, p, s] = token.split('.');
    const claims = JSON.parse(Buffer.from(p!, 'base64url').toString());
    claims.sc = 100;
    const forgedPayload = `${h}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${s}`;
    expect((await verify(officer, forgedPayload)).json().data).toMatchObject({ outcome: 'invalid', reason: 'bad_signature' });
    const flipped = `${h}.${p}.${s!.slice(0, -2)}AA`;
    expect((await verify(officer, flipped)).json().data.outcome).toBe('invalid');
    expect((await verify(officer, `PT1.${'a'.repeat(30)}.${'b'.repeat(30)}`)).json().data.outcome).toBe('invalid');
    expect((await verify(officer, 'PT1.garbage.garbage')).statusCode).toBe(400);
  });

  it('rejects a fabricated pass signed with a different key', async () => {
    const { generateKeyPairSync, sign } = await import('node:crypto');
    const { privateKey } = generateKeyPairSync('ed25519');
    const claims = { v: 1, ref: 'PT-FAKEFAKE22', kid: ctx.config.qr.keyId, iat: 1, exp: 9999999999, sc: 100, rs: 'R', dc: 'cccccc' };
    const body = `PT1.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`;
    const forged = `${body}.${sign(null, Buffer.from(body), privateKey).toString('base64url')}`;
    expect((await verify(officer, forged)).json().data).toMatchObject({ outcome: 'invalid', reason: 'bad_signature' });
  });

  it('computes the score on the server: declaring nothing complete cannot produce a high score', async () => {
    const res = await issue(traveller, [{ code: 'not-a-real-doc', status: 'complete' }]);
    expect(res.json().data.score).toBe(0);
    expect(res.json().data.status).toBe('Critical Requirements Missing');
  });

  it('keeps only one valid pass per traveller and reports the older pass as revoked', async () => {
    const first = (await issue(traveller)).json().data.token;
    const second = (await issue(traveller)).json().data.token;
    expect((await verify(officer, first)).json().data.outcome).toBe('revoked');
    expect((await verify(officer, second)).json().data.outcome).toBe('verified');
  });

  it('supports revocation by the holder', async () => {
    const { token } = (await issue(traveller)).json().data;
    const res = await ctx.app.inject({ method: 'POST', url: '/api/v1/qr/revoke', headers: auth(traveller), payload: {} });
    expect(res.statusCode).toBe(200);
    expect((await verify(officer, token)).json().data.outcome).toBe('revoked');
    expect((await ctx.app.inject({ method: 'POST', url: '/api/v1/qr/revoke', headers: auth(traveller), payload: {} })).statusCode).toBe(404);
  });

  it('reports an expired pass as expired', async () => {
    const { token, referenceCode } = (await issue(traveller)).json().data;
    await ctx.db.query(`UPDATE public.pt_qr_summaries SET expires_at = NOW() - INTERVAL '1 minute' WHERE reference_code = $1`, [referenceCode]);
    expect((await verify(officer, token)).json().data.outcome).toBe('expired');
  });

  it('enforces authentication and roles on verification', async () => {
    const { token } = (await issue(traveller)).json().data;
    expect((await verify(null, token)).statusCode).toBe(401);
    expect((await verify(traveller, token)).statusCode).toBe(403);
    const noPost = await verify(unassigned, token);
    expect(noPost.statusCode).toBe(403);
    expect(noPost.json().error.code).toBe('NO_BORDER_ASSIGNMENT');
  });

  it('records officer decisions and scopes history to the officer who made them', async () => {
    const { token } = (await issue(traveller)).json().data;
    const v = (await verify(officer, token)).json().data;
    const dec = await ctx.app.inject({ method: 'POST', url: `/api/v1/qr/verifications/${v.verificationId}/decision`, headers: auth(officer), payload: { decision: 'approved' } });
    expect(dec.statusCode).toBe(200);
    // another officer cannot decide on it
    const other = await ctx.app.inject({ method: 'POST', url: `/api/v1/qr/verifications/${v.verificationId}/decision`, headers: auth(officer2), payload: { decision: 'flagged' } });
    expect(other.statusCode).toBe(404);
    const mine = (await ctx.app.inject({ method: 'GET', url: '/api/v1/qr/verifications', headers: auth(officer) })).json().data;
    expect(mine.some((h: { id: string; decision: string }) => h.id === v.verificationId && h.decision === 'approved')).toBe(true);
    const theirs = (await ctx.app.inject({ method: 'GET', url: '/api/v1/qr/verifications', headers: auth(officer2) })).json().data;
    expect(theirs.some((h: { id: string }) => h.id === v.verificationId)).toBe(false);
    const audit = await ctx.db.query(`SELECT 1 FROM public.pt_admin_audit_logs WHERE action = 'qr.decision.approved' AND entity_id = $1`, [v.verificationId]);
    expect(audit.rowCount).toBe(1);
  });

  it('is idempotent for replayed offline requests', async () => {
    const key = randomUUID();
    expect((await issue(traveller, allComplete, key)).statusCode).toBe(201);
    const replay = await issue(traveller, allComplete, key);
    expect(replay.statusCode).toBe(409);
    expect(replay.json().error.code).toBe('ALREADY_ISSUED');
  });
});
