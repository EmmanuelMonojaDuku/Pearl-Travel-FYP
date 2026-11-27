import { randomUUID } from 'node:crypto';
import type { DatabaseClient, QueryExecutor } from '../../database/types.js';
import { ConflictError } from '../../shared/errors.js';
import { isValidUserRole, USER_ROLES, type UserRole } from '../../shared/roles.js';
import type {
  AuthUserRecord,
  EmailVerificationTokenRecord,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
} from './types.js';

export interface CreateTravellerUserParams {
  email: string;
  emailNormalized: string;
  passwordHash: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  nationality?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  countryCode?: string | null;
  travelPurpose?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  verificationTokenHash: string;
  verificationExpiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateRefreshTokenParams {
  userId: string;
  tokenHash: string;
  tokenFamilyId?: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RotateRefreshTokenParams {
  oldTokenId: string;
  userId: string;
  newTokenHash: string;
  tokenFamilyId: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthRepository {
  createTravellerWithVerification(params: CreateTravellerUserParams): Promise<AuthUserRecord>;
  assignUserRole(userId: string, role: UserRole): Promise<void>;
  findUserByEmail(emailNormalized: string): Promise<AuthUserRecord | null>;
  findUserById(userId: string): Promise<AuthUserRecord | null>;
  recordLoginSuccess(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  rotateRefreshToken(params: RotateRefreshTokenParams): Promise<RefreshTokenRecord>;
  revokeRefreshTokenByHash(tokenHash: string, reason: string): Promise<boolean>;
  revokeRefreshTokenFamily(tokenFamilyId: string, reason: string): Promise<void>;
  revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void>;
  findEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationTokenRecord | null>;
  markEmailVerified(params: { tokenId: string; userId: string }): Promise<void>;
  markUserEmailVerified(userId: string): Promise<void>;
  replaceEmailVerificationToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  createPasswordResetToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string | null;
  }): Promise<void>;
  completePasswordReset(params: {
    tokenId: string;
    userId: string;
    newPasswordHash: string;
  }): Promise<void>;
  logAuditEvent(params: {
    userId: string | null;
    eventType: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

interface UserRow {
  id: string;
  email: string;
  email_normalized: string;
  password_hash: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  nationality: string | null;
  gender: string | null;
  phone_number: string | null;
  country_code: string | null;
  travel_purpose: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  email_verified: boolean;
  email_verified_at: Date | null;
  is_active: boolean;
  legacy_supabase_user_id: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  roles: string[] | null;
}

interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  token_family_id: string;
  replaced_by_token_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  revocation_reason: string | null;
  created_at: Date;
}

interface VerificationTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  requested_ip: string | null;
  created_at: Date;
}

function mapUserRow(row: UserRow): AuthUserRecord {
  const roles = (row.roles ?? []).filter((r): r is UserRole => isValidUserRole(r));
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    firstName: row.first_name,
    lastName: row.last_name,
    nationality: row.nationality,
    gender: row.gender,
    phoneNumber: row.phone_number,
    countryCode: row.country_code,
    travelPurpose: row.travel_purpose,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelation: row.emergency_contact_relation,
    emailVerified: row.email_verified,
    emailVerifiedAt: row.email_verified_at ? new Date(row.email_verified_at) : null,
    isActive: row.is_active,
    legacySupabaseUserId: row.legacy_supabase_user_id,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    roles: roles.length > 0 ? roles : [USER_ROLES.TRAVELLER],
  };
}

function mapRefreshTokenRow(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    tokenFamilyId: row.token_family_id,
    replacedByTokenId: row.replaced_by_token_id,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    revocationReason: row.revocation_reason,
    createdAt: new Date(row.created_at),
  };
}

export class PostgresAuthRepository implements AuthRepository {
  constructor(private readonly db: DatabaseClient) {}

  public async assignUserRole(userId: string, role: UserRole): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(
        `
        INSERT INTO public.pt_auth_user_roles (user_id, role_id)
        SELECT $1, id FROM public.pt_auth_roles WHERE code = $2
        ON CONFLICT (user_id, role_id) DO NOTHING
        `,
        [userId, role]
      );
      await this.insertAuditLog(tx, {
        userId,
        eventType: 'user_role_assigned',
        metadata: { role },
      });
    });
  }

  public async createTravellerWithVerification(
    params: CreateTravellerUserParams
  ): Promise<AuthUserRecord> {
    try {
      return await this.db.transaction(async (tx) => {
        const userResult = await tx.query<Omit<UserRow, 'roles'>>(
          `
          INSERT INTO public.pt_auth_users (
            email, email_normalized, password_hash, full_name,
            first_name, last_name, nationality, gender,
            phone_number, country_code, travel_purpose,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relation
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
          `,
          [
            params.email,
            params.emailNormalized,
            params.passwordHash,
            params.fullName,
            params.firstName ?? null,
            params.lastName ?? null,
            params.nationality ?? null,
            params.gender ?? null,
            params.phoneNumber ?? null,
            params.countryCode ?? null,
            params.travelPurpose ?? null,
            params.emergencyContactName ?? null,
            params.emergencyContactPhone ?? null,
            params.emergencyContactRelation ?? null,
          ]
        );

        const createdUser = userResult.rows[0];
        if (!createdUser) {
          throw new Error('User insertion did not return a record.');
        }

        await tx.query(
          `
          INSERT INTO public.pt_auth_user_roles (user_id, role_id)
          SELECT $1, id FROM public.pt_auth_roles WHERE code = $2
          `,
          [createdUser.id, USER_ROLES.TRAVELLER]
        );

        await tx.query(
          `
          INSERT INTO public.pt_auth_email_verification_tokens (user_id, token_hash, expires_at)
          VALUES ($1, $2, $3)
          `,
          [createdUser.id, params.verificationTokenHash, params.verificationExpiresAt]
        );

        await this.insertAuditLog(tx, {
          userId: createdUser.id,
          eventType: 'user_registered',
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          metadata: { role: USER_ROLES.TRAVELLER },
        });

        return mapUserRow({ ...createdUser, roles: [USER_ROLES.TRAVELLER] });
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === '23505'
      ) {
        throw new ConflictError('An account with this email address already exists.', 'EMAIL_EXISTS');
      }
      throw error;
    }
  }

  public async findUserByEmail(emailNormalized: string): Promise<AuthUserRecord | null> {
    const result = await this.db.query<UserRow>(
      `
      SELECT u.*,
        COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), ARRAY[]::varchar[]) AS roles
      FROM public.pt_auth_users u
      LEFT JOIN public.pt_auth_user_roles ur ON ur.user_id = u.id
      LEFT JOIN public.pt_auth_roles r ON r.id = ur.role_id
      WHERE u.email_normalized = $1
      GROUP BY u.id
      LIMIT 1
      `,
      [emailNormalized]
    );

    const row = result.rows[0];
    return row ? mapUserRow(row) : null;
  }

  public async findUserById(userId: string): Promise<AuthUserRecord | null> {
    const result = await this.db.query<UserRow>(
      `
      SELECT u.*,
        COALESCE(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), ARRAY[]::varchar[]) AS roles
      FROM public.pt_auth_users u
      LEFT JOIN public.pt_auth_user_roles ur ON ur.user_id = u.id
      LEFT JOIN public.pt_auth_roles r ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
      LIMIT 1
      `,
      [userId]
    );

    const row = result.rows[0];
    return row ? mapUserRow(row) : null;
  }

  public async recordLoginSuccess(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      const familyId = randomUUID();
      await tx.query('UPDATE public.pt_auth_users SET last_login_at = NOW() WHERE id = $1', [
        params.userId,
      ]);

      await tx.query(
        `
        INSERT INTO public.pt_auth_refresh_tokens (
          user_id, token_hash, token_family_id, expires_at, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          params.userId,
          params.tokenHash,
          familyId,
          params.expiresAt,
          params.ipAddress ?? null,
          params.userAgent ?? null,
        ]
      );

      await this.insertAuditLog(tx, {
        userId: params.userId,
        eventType: 'login_success',
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      });
    });
  }

  public async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const result = await this.db.query<RefreshTokenRow>(
      'SELECT * FROM public.pt_auth_refresh_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash]
    );
    const row = result.rows[0];
    return row ? mapRefreshTokenRow(row) : null;
  }

  public async rotateRefreshToken(params: RotateRefreshTokenParams): Promise<RefreshTokenRecord> {
    return this.db.transaction(async (tx) => {
      const inserted = await tx.query<RefreshTokenRow>(
        `
        INSERT INTO public.pt_auth_refresh_tokens (
          user_id, token_hash, token_family_id, expires_at, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          params.userId,
          params.newTokenHash,
          params.tokenFamilyId,
          params.expiresAt,
          params.ipAddress ?? null,
          params.userAgent ?? null,
        ]
      );

      const newRow = inserted.rows[0];
      if (!newRow) {
        throw new Error('Failed to insert rotated refresh token.');
      }

      await tx.query(
        `
        UPDATE public.pt_auth_refresh_tokens
        SET revoked_at = NOW(),
            revocation_reason = 'rotated',
            replaced_by_token_id = $2
        WHERE id = $1
        `,
        [params.oldTokenId, newRow.id]
      );

      return mapRefreshTokenRow(newRow);
    });
  }

  public async revokeRefreshTokenByHash(tokenHash: string, reason: string): Promise<boolean> {
    const result = await this.db.query(
      `
      UPDATE public.pt_auth_refresh_tokens
      SET revoked_at = NOW(), revocation_reason = $2
      WHERE token_hash = $1 AND revoked_at IS NULL
      `,
      [tokenHash, reason]
    );
    return (result.rowCount ?? 0) > 0;
  }

  public async revokeRefreshTokenFamily(tokenFamilyId: string, reason: string): Promise<void> {
    await this.db.query(
      `
      UPDATE public.pt_auth_refresh_tokens
      SET revoked_at = NOW(), revocation_reason = $2
      WHERE token_family_id = $1 AND revoked_at IS NULL
      `,
      [tokenFamilyId, reason]
    );
  }

  public async revokeAllUserRefreshTokens(userId: string, reason: string): Promise<void> {
    await this.db.query(
      `
      UPDATE public.pt_auth_refresh_tokens
      SET revoked_at = NOW(), revocation_reason = $2
      WHERE user_id = $1 AND revoked_at IS NULL
      `,
      [userId, reason]
    );
  }

  public async findEmailVerificationTokenByHash(
    tokenHash: string
  ): Promise<EmailVerificationTokenRecord | null> {
    const result = await this.db.query<VerificationTokenRow>(
      'SELECT * FROM public.pt_auth_email_verification_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash]
    );
    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : null,
      createdAt: new Date(row.created_at),
    };
  }

  public async markUserEmailVerified(userId: string): Promise<void> {
    await this.db.query(
      `
      UPDATE public.pt_auth_users
      SET email_verified = TRUE, email_verified_at = COALESCE(email_verified_at, NOW())
      WHERE id = $1
      `,
      [userId]
    );
  }

  public async markEmailVerified(params: { tokenId: string; userId: string }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(
        'UPDATE public.pt_auth_email_verification_tokens SET used_at = NOW() WHERE id = $1',
        [params.tokenId]
      );
      await tx.query(
        `
        UPDATE public.pt_auth_users
        SET email_verified = TRUE, email_verified_at = COALESCE(email_verified_at, NOW())
        WHERE id = $1
        `,
        [params.userId]
      );
      await this.insertAuditLog(tx, {
        userId: params.userId,
        eventType: 'email_verified',
      });
    });
  }

  public async replaceEmailVerificationToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(
        `
        UPDATE public.pt_auth_email_verification_tokens
        SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL
        `,
        [params.userId]
      );
      await tx.query(
        `
        INSERT INTO public.pt_auth_email_verification_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        `,
        [params.userId, params.tokenHash, params.expiresAt]
      );
    });
  }

  public async findPasswordResetTokenByHash(
    tokenHash: string
  ): Promise<PasswordResetTokenRecord | null> {
    const result = await this.db.query<PasswordResetTokenRow>(
      'SELECT * FROM public.pt_auth_password_reset_tokens WHERE token_hash = $1 LIMIT 1',
      [tokenHash]
    );
    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      usedAt: row.used_at ? new Date(row.used_at) : null,
      requestedIp: row.requested_ip,
      createdAt: new Date(row.created_at),
    };
  }

  public async createPasswordResetToken(params: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestedIp?: string | null;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(
        `
        UPDATE public.pt_auth_password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL
        `,
        [params.userId]
      );
      await tx.query(
        `
        INSERT INTO public.pt_auth_password_reset_tokens (user_id, token_hash, expires_at, requested_ip)
        VALUES ($1, $2, $3, $4)
        `,
        [params.userId, params.tokenHash, params.expiresAt, params.requestedIp ?? null]
      );
      await this.insertAuditLog(tx, {
        userId: params.userId,
        eventType: 'password_reset_requested',
        ipAddress: params.requestedIp ?? null,
      });
    });
  }

  public async completePasswordReset(params: {
    tokenId: string;
    userId: string;
    newPasswordHash: string;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.query(
        'UPDATE public.pt_auth_password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [params.tokenId]
      );
      await tx.query('UPDATE public.pt_auth_users SET password_hash = $2 WHERE id = $1', [
        params.userId,
        params.newPasswordHash,
      ]);
      await tx.query(
        `
        UPDATE public.pt_auth_refresh_tokens
        SET revoked_at = NOW(), revocation_reason = 'password_reset'
        WHERE user_id = $1 AND revoked_at IS NULL
        `,
        [params.userId]
      );
      await this.insertAuditLog(tx, {
        userId: params.userId,
        eventType: 'password_reset_completed',
      });
    });
  }

  public async logAuditEvent(params: {
    userId: string | null;
    eventType: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.insertAuditLog(this.db, params);
  }

  private async insertAuditLog(
    executor: QueryExecutor,
    params: {
      userId: string | null;
      eventType: string;
      ipAddress?: string | null;
      userAgent?: string | null;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    await executor.query(
      `
      INSERT INTO public.pt_auth_audit_logs (user_id, event_type, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        params.userId,
        params.eventType,
        params.ipAddress ?? null,
        params.userAgent ?? null,
        JSON.stringify(params.metadata ?? {}),
      ]
    );
  }
}
