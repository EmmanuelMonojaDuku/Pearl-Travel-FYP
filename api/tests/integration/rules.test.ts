import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createIntegrationApp, hasDatabase } from './harness.js';

describe.skipIf(!hasDatabase)('rules API (real PostgreSQL)', () => {
  let ctx: Awaited<ReturnType<typeof createIntegrationApp>>;
  beforeAll(async () => { ctx = await createIntegrationApp(); });
  afterAll(async () => { await ctx.app.close(); });

  it('serves the published rule set and nationality groups from the database', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/rules/snapshot' });
    expect(res.statusCode).toBe(200);
    const d = res.json().data;
    expect(d.rules.length).toBeGreaterThanOrEqual(20);
    expect(d.groups.eac).toContain('Kenya');
  });

  it('evaluates a profile server-side by nationality and purpose', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/rules/evaluate?nationality=Eritrea&purpose=business' });
    const d = res.json().data;
    expect(d.group).toBe('visa_required');
    expect(d.checklist.map((c: { id: string }) => c.id)).toContain('doc-purpose-business');
  });

  it('never returns rules that are not published', async () => {
    await ctx.db.query(`UPDATE public.pt_admin_requirements SET workflow_status = 'draft' WHERE code = 'req-purpose-family'`);
    try {
      const res = await ctx.app.inject({ method: 'GET', url: '/api/v1/rules/evaluate?nationality=India&purpose=family' });
      expect(res.json().data.checklist.map((c: { id: string }) => c.id)).not.toContain('doc-purpose-family');
    } finally {
      await ctx.db.query(`UPDATE public.pt_admin_requirements SET workflow_status = 'published' WHERE code = 'req-purpose-family'`);
    }
  });
});
