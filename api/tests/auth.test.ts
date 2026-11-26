import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { USER_ROLES } from '../src/shared/roles.js';
import {
  createTestConfig,
  FakeDatabaseClient,
  InMemoryAuthRepository,
  SpyEmailService,
} from './helpers/inMemoryAuthFixtures.js';

describe('Independent Authentication & RBAC API', () => {
  let repo: InMemoryAuthRepository;
  let emailSpy: SpyEmailService;
  let fakeDb: FakeDatabaseClient;

  beforeEach(() => {
    repo = new InMemoryAuthRepository();
    emailSpy = new SpyEmailService();
    fakeDb = new FakeDatabaseClient();
  });

  const buildTestInstance = async (overrides: Partial<NodeJS.ProcessEnv> = {}) => {
    return buildApp({
      config: createTestConfig(overrides),
      db: fakeDb,
      authRepository: repo,
      emailService: emailSpy,
    });
  };

  it('validates registration input and rejects weak passwords or missing names', async () => {
    const { app } = await buildTestInstance();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'not-an-email',
        password: 'weak',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');

    await app.close();
  });

  it('registers a traveller with Argon2id password hash, rejects duplicates, and never leaks secrets', async () => {
    const { app } = await buildTestInstance();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: '  Amina.Kato@Example.com ',
        password: 'PearlBorder2026!',
        firstName: 'Amina',
        lastName: 'Kato',
        nationality: 'Ugandan',
        travelPurpose: 'business',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('amina.kato@example.com');
    expect(body.data.user.roles).toEqual([USER_ROLES.TRAVELLER]);
    expect(body.data.user.passwordHash).toBeUndefined();
    expect(body.data.user.password_hash).toBeUndefined();
    expect(emailSpy.verificationEmails).toHaveLength(1);

    // Confirm Argon2id hash stored in repository
    const storedUser = await repo.findUserByEmail('amina.kato@example.com');
    expect(storedUser).not.toBeNull();
    expect(storedUser!.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(storedUser!.passwordHash).not.toContain('PearlBorder2026!');

    // Duplicate registration rejected with 409 Conflict
    const dupRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'AMINA.KATO@example.com',
        password: 'AnotherPassword2026!',
        fullName: 'Amina Duplicate',
      },
    });
    expect(dupRes.statusCode).toBe(409);
    expect(dupRes.json().error.code).toBe('EMAIL_EXISTS');

    await app.close();
  });

  it('handles login success, failed password, unknown email, and inactive account blocking', async () => {
    const { app } = await buildTestInstance();

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'david.okello@example.com',
        password: 'BorderSafe2026!',
        fullName: 'David Okello',
      },
    });

    // Wrong password
    const badPwRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'david.okello@example.com',
        password: 'WrongPassword123!',
      },
    });
    expect(badPwRes.statusCode).toBe(401);
    expect(badPwRes.json().error.code).toBe('INVALID_CREDENTIALS');

    // Unknown email
    const unknownRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'nobody@example.com',
        password: 'BorderSafe2026!',
      },
    });
    expect(unknownRes.statusCode).toBe(401);
    expect(unknownRes.json().error.code).toBe('INVALID_CREDENTIALS');

    // Valid login
    const okRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'david.okello@example.com',
        password: 'BorderSafe2026!',
      },
    });
    expect(okRes.statusCode).toBe(200);
    const okBody = okRes.json();
    expect(okBody.data.tokens.accessToken).toBeTypeOf('string');
    expect(okBody.data.tokens.refreshToken).toMatch(/^pt_rt_/);
    expect(okBody.data.user.passwordHash).toBeUndefined();

    // Inactive user rejected with 403
    repo.setUserActive(okBody.data.user.id, false);
    const inactiveRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'david.okello@example.com',
        password: 'BorderSafe2026!',
      },
    });
    expect(inactiveRes.statusCode).toBe(403);
    expect(inactiveRes.json().error.code).toBe('ACCOUNT_INACTIVE');

    await app.close();
  });

  it('verifies email with single-use hashed tokens, supports resend, and rejects reuse or expiry', async () => {
    const { app } = await buildTestInstance();

    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'grace.namono@example.com',
        password: 'MalabaPass2026!',
        fullName: 'Grace Namono',
      },
    });
    expect(regRes.statusCode).toBe(201);

    const firstToken = emailSpy.verificationEmails[0]!.verificationToken;

    // Resend invalidates the old token and issues a new one
    const resendRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/resend-verification',
      payload: { email: 'grace.namono@example.com' },
    });
    expect(resendRes.statusCode).toBe(200);
    expect(emailSpy.verificationEmails).toHaveLength(2);
    const secondToken = emailSpy.verificationEmails[1]!.verificationToken;

    // Old invalidated token fails
    const staleVerify = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: firstToken },
    });
    expect(staleVerify.statusCode).toBe(401);

    // New token succeeds once
    const verifyOk = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: secondToken },
    });
    expect(verifyOk.statusCode).toBe(200);

    const userAfter = await repo.findUserByEmail('grace.namono@example.com');
    expect(userAfter!.emailVerified).toBe(true);

    // Reusing the same verification token fails
    const reuseRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: secondToken },
    });
    expect(reuseRes.statusCode).toBe(401);

    await app.close();
  });

  it('rotates refresh tokens, detects token reuse to revoke token family, and supports logout', async () => {
    const { app } = await buildTestInstance();

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'peter.ssemakula@example.com',
        password: 'RotatePass2026!',
        fullName: 'Peter Ssemakula',
      },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'peter.ssemakula@example.com',
        password: 'RotatePass2026!',
      },
    });
    const rt1 = loginRes.json().data.tokens.refreshToken as string;

    // Refresh once -> gets rt2
    const refresh1 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rt1 },
    });
    expect(refresh1.statusCode).toBe(200);
    const rt2 = refresh1.json().data.tokens.refreshToken as string;
    expect(rt2).not.toBe(rt1);

    // Reusing old rt1 triggers family-wide revocation
    const reuseAttempt = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rt1 },
    });
    expect(reuseAttempt.statusCode).toBe(401);
    expect(reuseAttempt.json().error.code).toBe('REFRESH_TOKEN_REUSED');

    // Now even rt2 in the same compromised family is revoked!
    const compromisedFollowup = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rt2 },
    });
    expect(compromisedFollowup.statusCode).toBe(401);

    // New login -> logout revokes active refresh token
    const login2 = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'peter.ssemakula@example.com',
        password: 'RotatePass2026!',
      },
    });
    const rt3 = login2.json().data.tokens.refreshToken as string;

    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: { refreshToken: rt3 },
    });
    expect(logoutRes.statusCode).toBe(200);

    const afterLogoutRefresh = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rt3 },
    });
    expect(afterLogoutRefresh.statusCode).toBe(401);

    await app.close();
  });

  it('prevents email enumeration on forgot-password and revokes sessions on reset-password', async () => {
    const { app } = await buildTestInstance();

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'sarah.muwanga@example.com',
        password: 'InitialPass2026!',
        fullName: 'Sarah Muwanga',
      },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'sarah.muwanga@example.com',
        password: 'InitialPass2026!',
      },
    });
    const activeRefreshToken = loginRes.json().data.tokens.refreshToken as string;

    const existingForgot = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'sarah.muwanga@example.com' },
    });
    const unknownForgot = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'nonexistent.user@example.com' },
    });

    // Both responses must be identical so attackers cannot enumerate accounts
    expect(existingForgot.statusCode).toBe(200);
    expect(unknownForgot.statusCode).toBe(200);
    expect(existingForgot.json()).toEqual(unknownForgot.json());
    expect(emailSpy.resetEmails).toHaveLength(1);

    const resetToken = emailSpy.resetEmails[0]!.resetToken;

    // Weak new password fails validation
    const weakReset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken, newPassword: 'short' },
    });
    expect(weakReset.statusCode).toBe(400);

    // Valid reset succeeds
    const validReset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken, newPassword: 'UpdatedPass2026!' },
    });
    expect(validReset.statusCode).toBe(200);

    // Reset token is single-use
    const reuseReset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken, newPassword: 'AnotherPass2026!' },
    });
    expect(reuseReset.statusCode).toBe(401);

    // Prior refresh token was revoked during password reset
    const oldSessionRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: activeRefreshToken },
    });
    expect(oldSessionRes.statusCode).toBe(401);

    // Old password fails, new password works
    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'sarah.muwanga@example.com', password: 'InitialPass2026!' },
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'sarah.muwanga@example.com', password: 'UpdatedPass2026!' },
    });
    expect(newLogin.statusCode).toBe(200);

    await app.close();
  });

  it('protects GET /api/v1/auth/me and rejects expired or invalid access tokens', async () => {
    const { app, config } = await buildTestInstance();

    // Missing token
    const missingRes = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    expect(missingRes.statusCode).toBe(401);

    // Malformed token
    const malformedRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: 'Bearer invalid.jwt.token' },
    });
    expect(malformedRes.statusCode).toBe(401);

    // Expired JWT token
    const expiredJwt = await new SignJWT({
      email: 'expired@example.com',
      roles: [USER_ROLES.TRAVELLER],
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-123')
      .setIssuer(config.auth.jwtIssuer)
      .setAudience(config.auth.jwtAudience)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(config.auth.jwtAccessSecret));

    const expiredRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${expiredJwt}` },
    });
    expect(expiredRes.statusCode).toBe(401);
    expect(expiredRes.json().error.code).toBe('INVALID_OR_EXPIRED_TOKEN');

    // Valid login & /me
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'me.user@example.com',
        password: 'ValidUser2026!',
        fullName: 'Me User',
      },
    });
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'me.user@example.com', password: 'ValidUser2026!' },
    });
    const accessToken = loginRes.json().data.tokens.accessToken as string;

    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().data.user.email).toBe('me.user@example.com');
    expect(meRes.json().data.user.passwordHash).toBeUndefined();

    await app.close();
  });

  it('enforces role-based authorization across Traveller, Border Officer, and Admin Staff roles', async () => {
    const { app, authMiddleware } = await buildTestInstance();

    // Register isolated RBAC test routes on the Fastify instance
    app.get(
      '/test-rbac/officer-only',
      { preHandler: [authMiddleware.authenticate, authMiddleware.requireRoles(USER_ROLES.BORDER_OFFICER)] },
      async () => ({ ok: true, area: 'border_officer' })
    );
    app.get(
      '/test-rbac/admin-only',
      { preHandler: [authMiddleware.authenticate, authMiddleware.requireRoles(USER_ROLES.ADMIN_STAFF)] },
      async () => ({ ok: true, area: 'admin_staff' })
    );

    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'officer.test@example.com',
        password: 'OfficerPass2026!',
        fullName: 'Inspector Okello',
      },
    });
    const userId = regRes.json().data.user.id as string;

    // Default Traveller login
    const travellerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'officer.test@example.com', password: 'OfficerPass2026!' },
    });
    const travellerToken = travellerLogin.json().data.tokens.accessToken as string;

    // Traveller denied access to officer route (403)
    const deniedOfficer = await app.inject({
      method: 'GET',
      url: '/test-rbac/officer-only',
      headers: { authorization: `Bearer ${travellerToken}` },
    });
    expect(deniedOfficer.statusCode).toBe(403);
    expect(deniedOfficer.json().error.code).toBe('INSUFFICIENT_ROLE');

    // Elevate to BORDER_OFFICER and re-login
    repo.setUserRoles(userId, [USER_ROLES.BORDER_OFFICER]);
    const officerLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'officer.test@example.com', password: 'OfficerPass2026!' },
    });
    const officerToken = officerLogin.json().data.tokens.accessToken as string;

    // Border Officer allowed on officer route (200), denied on admin route (403)
    const allowedOfficer = await app.inject({
      method: 'GET',
      url: '/test-rbac/officer-only',
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(allowedOfficer.statusCode).toBe(200);

    const deniedAdmin = await app.inject({
      method: 'GET',
      url: '/test-rbac/admin-only',
      headers: { authorization: `Bearer ${officerToken}` },
    });
    expect(deniedAdmin.statusCode).toBe(403);

    await app.close();
  });

  it('rejects expired email verification, refresh, and password reset tokens', async () => {
    const { app } = await buildTestInstance();

    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'expiry.check@example.com',
        password: 'ExpiryPass2026!',
        fullName: 'Expiry Check',
      },
    });

    // Expire verification token directly in fixture
    const verifToken = emailSpy.verificationEmails[0]!.verificationToken;
    for (const record of repo.verificationTokens.values()) {
      record.expiresAt = new Date(Date.now() - 10_000);
    }

    const expiredVerif = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/verify-email',
      payload: { token: verifToken },
    });
    expect(expiredVerif.statusCode).toBe(401);

    // Expire refresh token
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'expiry.check@example.com', password: 'ExpiryPass2026!' },
    });
    const rt = loginRes.json().data.tokens.refreshToken as string;
    for (const record of repo.refreshTokens.values()) {
      record.expiresAt = new Date(Date.now() - 10_000);
    }

    const expiredRefresh = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: { refreshToken: rt },
    });
    expect(expiredRefresh.statusCode).toBe(401);
    expect(expiredRefresh.json().error.code).toBe('REFRESH_TOKEN_EXPIRED');

    // Expire password reset token
    await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      payload: { email: 'expiry.check@example.com' },
    });
    const resetToken = emailSpy.resetEmails[0]!.resetToken;
    for (const record of repo.resetTokens.values()) {
      record.expiresAt = new Date(Date.now() - 10_000);
    }

    const expiredReset = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/reset-password',
      payload: { token: resetToken, newPassword: 'NewExpiryPass2026!' },
    });
    expect(expiredReset.statusCode).toBe(401);
    expect(expiredReset.json().error.code).toBe('INVALID_RESET_TOKEN');

    await app.close();
  });

  it('enforces strict rate limiting on authentication endpoints', async () => {
    const { app } = await buildTestInstance({ AUTH_RATE_LIMIT_MAX: '2' });

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'rate@example.com', password: 'SomePassword123' },
    });
    expect(first.statusCode).toBe(401);

    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'rate@example.com', password: 'SomePassword123' },
    });
    expect(second.statusCode).toBe(401);

    const third = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'rate@example.com', password: 'SomePassword123' },
    });
    expect(third.statusCode).toBe(429);
    expect(third.json().error.code).toBe('RATE_LIMIT_EXCEEDED');

    await app.close();
  });
});
