import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import {
  createTestConfig,
  FakeDatabaseClient,
  InMemoryAuthRepository,
  SpyEmailService,
} from './helpers/inMemoryAuthFixtures.js';

describe('Administrator dashboard API', () => {
  let repo: InMemoryAuthRepository;
  let emailService: SpyEmailService;
  let db: FakeDatabaseClient;

  beforeEach(() => {
    repo = new InMemoryAuthRepository();
    emailService = new SpyEmailService();
    db = new FakeDatabaseClient();
    db.queryRows = [
      {
        total_travellers: 1,
        total_journeys: 2,
        active_journeys: 1,
        total_assessments: 3,
        pending_content_reviews: 4,
        total_qr_verifications: 5,
        valid_qr_summaries: 6,
      },
    ];
  });

  it('grants the configured verified admin role and protects overview data', async () => {
    const app = await buildApp({
      config: createTestConfig({ ADMIN_EMAILS: 'EmmanuelMonoJaDuku@gmail.com' }),
      db,
      authRepository: repo,
      emailService,
    });

    const registration = await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'emmanuelmonojaduku@gmail.com',
        password: 'StrongAdmin2026!',
        fullName: 'Emmanuel Monojaduku',
      },
    });
    expect(registration.statusCode).toBe(201);
    const verificationToken = emailService.verificationEmails[0]?.verificationToken;
    expect(verificationToken).toBeTruthy();

    await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: verificationToken },
    });

    const login = await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'emmanuelmonojaduku@gmail.com',
        password: 'StrongAdmin2026!',
      },
    });
    expect(login.statusCode).toBe(200);
    expect(login.json().data.user.roles).toContain('admin_staff');

    const overview = await app.app.inject({
      method: 'GET',
      url: '/api/v1/admin/overview',
      headers: {
        authorization: `Bearer ${login.json().data.tokens.accessToken}`,
      },
    });
    expect(overview.statusCode).toBe(200);
    expect(overview.json().data.kpis).toEqual({
      totalTravellers: 1,
      totalJourneys: 2,
      activeJourneys: 1,
      totalAssessments: 3,
      pendingContentReviews: 4,
      totalQrVerifications: 5,
      validQrSummaries: 6,
    });

    await app.app.close();
  });

  it('rejects unverified bootstrap admin login and denies travellers the overview', async () => {
    const app = await buildApp({
      config: createTestConfig({ ADMIN_EMAILS: 'emmanuelmonojaduku@gmail.com' }),
      db,
      authRepository: repo,
      emailService,
    });

    await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'emmanuelmonojaduku@gmail.com',
        password: 'StrongAdmin2026!',
        fullName: 'Emmanuel Monojaduku',
      },
    });
    const unverifiedAdminLogin = await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'emmanuelmonojaduku@gmail.com',
        password: 'StrongAdmin2026!',
      },
    });
    // Signs in, but only as a traveller: no administrator role until the email is verified.
    expect(unverifiedAdminLogin.statusCode).toBe(200);
    expect(unverifiedAdminLogin.json().data.user.roles).not.toContain('admin_staff');

    const travellerRegistration = await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'traveller@example.com',
        password: 'StrongTraveller2026!',
        fullName: 'Regular Traveller',
      },
    });
    expect(travellerRegistration.statusCode).toBe(201);
    const travellerLogin = await app.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'traveller@example.com',
        password: 'StrongTraveller2026!',
      },
    });
    const deniedOverview = await app.app.inject({
      method: 'GET',
      url: '/api/v1/admin/overview',
      headers: {
        authorization: `Bearer ${travellerLogin.json().data.tokens.accessToken}`,
      },
    });
    expect(deniedOverview.statusCode).toBe(403);
    expect(deniedOverview.json().error.code).toBe('INSUFFICIENT_ROLE');

    await app.app.close();
  });
});
