import { randomUUID } from 'node:crypto';
import type { QueryResult, QueryResultRow } from 'pg';
import { type AppConfig, loadConfig } from '../../src/config/env.js';
import type {
  DatabaseClient,
  DatabaseHealthStatus,
  QueryExecutor,
} from '../../src/database/types.js';
import type {
  AuthRepository,
  CreateTravellerUserParams,
  RotateRefreshTokenParams,
} from '../../src/modules/auth/repository.js';
import type {
  AuthUserRecord,
  EmailVerificationTokenRecord,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
} from '../../src/modules/auth/types.js';
import { ConflictError } from '../../src/shared/errors.js';
import type {
  EmailDeliveryResult,
  EmailService,
  PasswordResetEmailPayload,
  VerificationEmailPayload,
} from '../../src/shared/email/index.js';
import { USER_ROLES, type UserRole } from '../../src/shared/roles.js';

export function createTestConfig(overrides: Partial<NodeJS.ProcessEnv> = {}): AppConfig {
  return loadConfig({
    NODE_ENV: 'test',
    PORT: '4000',
    HOST: '127.0.0.1',
    CORS_ORIGINS: 'http://localhost:3000',
    APP_BASE_URL: 'http://localhost:3000',
    DATABASE_URL: '',
    JWT_ACCESS_SECRET: 'test-only-access-secret-minimum-32-characters-long-key',
    JWT_REFRESH_SECRET: 'test-only-refresh-secret-minimum-32-characters-long-key',
    JWT_ISSUER: 'pearl-travel-api-test',
    JWT_AUDIENCE: 'pearl-travel-clients-test',
    ACCESS_TOKEN_TTL_SECONDS: '900',
    REFRESH_TOKEN_TTL_SECONDS: '3600',
    EMAIL_VERIFICATION_TTL_SECONDS: '3600',
    PASSWORD_RESET_TTL_SECONDS: '1800',
    // Fast Argon2id parameters strictly for isolated automated test speed (still Argon2id)
    ARGON2_MEMORY_COST_KIB: '4096',
    ARGON2_TIME_COST: '2',
    ARGON2_PARALLELISM: '1',
    RATE_LIMIT_MAX: '1000',
    AUTH_RATE_LIMIT_MAX: '100',
    EMAIL_PROVIDER: 'disabled',
    ...overrides,
  });
}

export class FakeDatabaseClient implements DatabaseClient {
  public healthStatus: DatabaseHealthStatus;
  public queryRows: QueryResultRow[] = [];

  constructor(initialHealth?: DatabaseHealthStatus) {
    this.healthStatus = initialHealth ?? {
      status: 'healthy',
      configured: true,
      latencyMs: 2,
      database: 'pearl_travel_test',
      role: 'pearl_api_app',
      pool: { totalCount: 1, idleCount: 1, waitingCount: 0 },
    };
  }

  public isConfigured(): boolean {
    return this.healthStatus.configured;
  }

  public async query<T extends QueryResultRow = QueryResultRow>(): Promise<QueryResult<T>> {
    return {
      command: 'SELECT',
      rowCount: 0,
      oid: 0,
      fields: [],
      rows: this.queryRows as T[],
    };
  }

  public async transaction<T>(fn: (tx: QueryExecutor) => Promise<T>): Promise<T> {
    return fn(this);
  }

  public async checkHealth(): Promise<DatabaseHealthStatus> {
    return this.healthStatus;
  }

  public async close(): Promise<void> {
    return undefined;
  }
}

export class SpyEmailService implements EmailService {
  public readonly verificationEmails: VerificationEmailPayload[] = [];
  public readonly resetEmails: PasswordResetEmailPayload[] = [];
  public configured = true;

  public isConfigured(): boolean {
    return this.configured;
  }

  public getProviderName(): string {
    return this.configured ? 'test-spy' : 'disabled';
  }

  public async sendVerificationEmail(
    payload: VerificationEmailPayload
  ): Promise<EmailDeliveryResult> {
    this.verificationEmails.push(payload);
    return {
      delivered: this.configured,
      configured: this.configured,
      provider: this.getProviderName(),
      messageId: this.configured ? `msg_${randomUUID()}` : undefined,
      reason: this.configured ? undefined : 'Disabled in test',
    };
  }

  public async sendPasswordResetEmail(
    payload: PasswordResetEmailPayload
  ): Promise<EmailDeliveryResult> {
    this.resetEmails.push(payload);
    return {
      delivered: this.configured,
      configured: this.configured,
      provider: this.getProviderName(),
      messageId: this.configured ? `msg_${randomUUID()}` : undefined,
      reason: this.configured ? undefined : 'Disabled in test',
    };
  }
}

export class InMemoryAuthRepository implements AuthRepository {
  public readonly users = new Map<string, AuthUserRecord>();
  public readonly refreshTokens = new Map<string, RefreshTokenRecord>();
  public readonly verificationTokens = new Map<string, EmailVerificationTokenRecord>();
  public readonly resetTokens = new Map<string, PasswordResetTokenRecord>();
  public readonly auditLogs: Array<{ userId: string | null; eventType: string }> = [];

  public async createTravellerWithVerification(
    params: CreateTravellerUserParams
  ): Promise<AuthUserRecord> {
    for (const existing of this.users.values()) {
      if (existing.emailNormalized === params.emailNormalized) {
        throw new ConflictError('An account with this email address already exists.', 'EMAIL_EXISTS');
      }
    }

    const now = new Date();
    const user: AuthUserRecord = {
      id: randomUUID(),
      email: params.email,
      emailNormalized: params.emailNormalized,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      firstName: params.firstName ?? null,
      lastName: params.lastName ?? null,
      nationality: params.nationality ?? null,
      gender: params.gender ?? null,
      phoneNumber: params.phoneNumber ?? null,
      countryCode: params.countryCode ?? null,
      travelPurpose: params.travelPurpose ?? null,
      emergencyContactName: params.emergencyContactName ?? null,
      emergencyContactPhone: params.emergencyContactPhone ?? null,
      emergencyContactRelation: params.emergencyContactRelation ?? null,
      emailVerified: false,
      emailVerifiedAt: null,
      isActive: true,
      legacySupabaseUserId: null,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
      roles: [USER_ROLES.TRAVELLER],
    };

    this.users.set(user.id, user);

    const verificationToken: EmailVerificationTokenRecord = {
      id: randomUUID(),
      userId: user.id,
      tokenHash: params.verificationTokenHash,
      expiresAt: params.verificationExpiresAt,
      usedAt: null,
      createdAt: now,
    };
    this.verificationTokens.set(verificationToken.id, verificationToken);
    this.auditLogs.push({ userId: user.id, eventType: 'user_registered' });

    return { ...user, roles: [...user.roles] };
  }

  public setUserRoles(userId: string, roles: UserRole[]): void {
    const user = this.users.get(userId);
    if (user) {
      user.roles = [...roles];
    }
  }

  public async assignUserRole(userId: string, role: UserRole): Promise<void> {
    const user = this.users.get(userId);
    if (user && !user.roles.includes(role)) {
      user.roles.push(role);
    }
    this.auditLogs.push({ userId, eventType: 'user_role_assigned' });
  }

  public setUserActive(userId: string, active: boolean): void {
    const user = this.users.get(userId);
    if (user) {
      user.isActive = active;
    }
  }

  public async findUserByEmail(emailNormalized: string): Promise<AuthUserRecord | null> {
    for (const user of this.users.values()) {
      if (user.emailNormalized === emailNormalized) {
        return { ...user, roles: [...user.roles] };
      }
    }
    return null;
  }

  public async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const user = this.users.get(userId);
    return user ? { ...user, roles: [...user.roles] } : null;
  }

  public async recordLoginSuccess(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const user = this.users.get(params.userId);
    if (user) {
      user.lastLoginAt = new Date();
    }

    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId: params.userId,
      tokenHash: params.tokenHash,
      tokenFamilyId: randomUUID(),
      replacedByTokenId: null,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      expiresAt: params.expiresAt,
      revokedAt: null,
      revocationReason: null,
      createdAt: new Date(),
    };
    this.refreshTokens.set(record.id, record);
    this.auditLogs.push({ userId: params.userId, eventType: 'login_success' });
  }

  public async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    for (const token of this.refreshTokens.values()) {
      if (token.tokenHash === tokenHash) {
        return { ...token };
      }
    }
    return null;
  }

  public async rotateRefreshToken(params: RotateRefreshTokenParams): Promise<RefreshTokenRecord> {
    const next: RefreshTokenRecord = {
      id: randomUUID(),
      userId: params.userId,
      tokenHash: params.newTokenHash,
      tokenFamilyId: params.tokenFamilyId,
      replacedByTokenId: null,
      userAgent: params.userAgent ?? null,
      ipAddress: params.ipAddress ?? null,
      expiresAt: params.expiresAt,
      revokedAt: null,
      revocationReason: null,
      createdAt: new Date(),
    };
    this.refreshTokens.set(next.id, next);

    const old = this.refreshTokens.get(params.oldTokenId);
    if (old) {
      old.revokedAt = new Date();
      old.revocationReason = 'rotated';
      old.replacedByTokenId = next.id;
    }

    return { ...next };
  }

  public async revokeRefreshTokenByHash(tokenHash: string, reason: string): Promise<boolean> {
    for (const token of this.refreshTokens.values()) {
      if (token.tokenHash === tokenHash && token.revokedAt === null) {
        token.revokedAt = new Date();
        token.revocationReason = reason;
        return true;
      }
    }
    return false;
  }

  public async revokeRefreshTokenFamily(tokenFamilyId: string, reason: string): Promise<void> {
    for (const token of this.refreshTokens.values()) {
      if (token.tokenFamilyId === tokenFamilyId && token.revokedAt === null) {
        token.revokedAt = new Date();
        token.revocationReason = reason;
      }
    }
  }

  public async revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
    for (const token of this.refreshTokens.values()) {
      if (token.userId === userId && token.revokedAt === null) {
        token.revokedAt = new Date();
        token.revocationReason = reason;
      }
    }
  }

  public async findEmailVerificationTokenByHash(
    tokenHash: string
  ): Promise<EmailVerificationTokenRecord | null> {
    for (const token of this.verificationTokens.values()) {
      if (token.tokenHash === tokenHash) {
        return { ...token };
      }
    }
    return null;
  }

  public async markEmailVerified(params: { tokenId: string; userId: string }): Promise<void> {
    const token = this.verificationTokens.get(params.tokenId);
    if (token) {
      token.usedAt = new Date();
    }
    const user = this.users.get(params.userId);
    if (user) {
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
    }
  }

  public async replaceEmailVerificationToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    const now = new Date();
    for (const token of this.verificationTokens.values()) {
      if (token.userId === params.userId && token.usedAt === null) {
        token.usedAt = now;
      }
    }
    const next: EmailVerificationTokenRecord = {
      id: randomUUID(),
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      usedAt: null,
      createdAt: now,
    };
    this.verificationTokens.set(next.id, next);
  }

  public async findPasswordResetTokenByHash(
    tokenHash: string
  ): Promise<PasswordResetTokenRecord | null> {
    for (const token of this.resetTokens.values()) {
      if (token.tokenHash === tokenHash) {
        return { ...token };
      }
    }
    return null;
  }

  public async createPasswordResetToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string | null;
  }): Promise<void> {
    const now = new Date();
    for (const token of this.resetTokens.values()) {
      if (token.userId === params.userId && token.usedAt === null) {
        token.usedAt = now;
      }
    }
    const next: PasswordResetTokenRecord = {
      id: randomUUID(),
      userId: params.userId,
      tokenHash: params.tokenHash,
      expiresAt: params.expiresAt,
      usedAt: null,
      requestedIp: params.requestedIp ?? null,
      createdAt: now,
    };
    this.resetTokens.set(next.id, next);
  }

  public async completePasswordReset(params: {
    tokenId: string;
    userId: string;
    newPasswordHash: string;
  }): Promise<void> {
    const token = this.resetTokens.get(params.tokenId);
    if (token) {
      token.usedAt = new Date();
    }
    const user = this.users.get(params.userId);
    if (user) {
      user.passwordHash = params.newPasswordHash;
    }
    await this.revokeAllUserRefreshTokens(params.userId, 'password_reset');
  }

  public async logAuditEvent(params: {
    userId: string | null;
    eventType: string;
  }): Promise<void> {
    this.auditLogs.push({ userId: params.userId, eventType: params.eventType });
  }
}
