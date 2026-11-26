import { describe, expect, it } from 'vitest';
import { loadMigrationFiles, validateMigrationSafety } from '../src/database/migrate.js';
import { PasswordService } from '../src/modules/auth/password.js';
import { TokenService } from '../src/modules/auth/tokens.js';
import { UnconfiguredEmailService } from '../src/shared/email/index.js';
import { createTestConfig } from './helpers/inMemoryAuthFixtures.js';

describe('Security primitives, email interface, and additive migrations', () => {
  it('hashes passwords with Argon2id and never produces identical hashes for the same password', async () => {
    const passwordService = new PasswordService(createTestConfig());
    const hash1 = await passwordService.hashPassword('UgandaBorder2026!');
    const hash2 = await passwordService.hashPassword('UgandaBorder2026!');

    expect(hash1.startsWith('$argon2id$')).toBe(true);
    expect(hash2.startsWith('$argon2id$')).toBe(true);
    expect(hash1).not.toBe(hash2);
    expect(await passwordService.verifyPassword(hash1, 'UgandaBorder2026!')).toBe(true);
    expect(await passwordService.verifyPassword(hash1, 'WrongPassword2026!')).toBe(false);
  });

  it('stores opaque tokens as SHA-256 digests distinct from raw tokens', () => {
    const tokenService = new TokenService(createTestConfig());
    const rt = tokenService.generateRefreshToken();
    const ev = tokenService.generateEmailVerificationToken();
    const pr = tokenService.generatePasswordResetToken();

    expect(rt.rawToken).not.toBe(rt.tokenHash);
    expect(rt.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(ev.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(pr.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('honestly reports unconfigured email delivery when EMAIL_PROVIDER=disabled', async () => {
    const emailService = new UnconfiguredEmailService();
    expect(emailService.isConfigured()).toBe(false);

    const verifResult = await emailService.sendVerificationEmail({
      to: 'traveller@example.com',
      fullName: 'Traveller Test',
      verificationToken: 'pt_ev_test',
      verificationUrl: 'http://localhost:3000/verify-email?token=pt_ev_test',
      expiresInMinutes: 60,
    });
    expect(verifResult.delivered).toBe(false);
    expect(verifResult.configured).toBe(false);
    expect(verifResult.provider).toBe('disabled');
  });

  it('validates all additive SQL migrations without destructive statements', async () => {
    const migrations = await loadMigrationFiles();
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    expect(() => validateMigrationSafety(migrations)).not.toThrow();
  });
});
