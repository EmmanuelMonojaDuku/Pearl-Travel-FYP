import type { AppConfig } from '../../config/env.js';
import type { EmailDeliveryResult, EmailService } from '../../shared/email/index.js';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../../shared/errors.js';
import { USER_ROLES } from '../../shared/roles.js';
import type { PasswordService } from './password.js';
import type { AuthRepository } from './repository.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './schemas.js';
import type { TokenService } from './tokens.js';
import {
  sanitizeUser,
  type AuthTokenPair,
  type RequestMeta,
  type SanitizedUserDto,
} from './types.js';

export interface RegisterResult {
  user: SanitizedUserDto;
  emailVerification: {
    required: boolean;
    delivery: EmailDeliveryResult;
  };
}

export interface LoginResult {
  user: SanitizedUserDto;
  tokens: AuthTokenPair;
}

export class AuthService {
  constructor(
    private readonly config: AppConfig,
    private readonly repository: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService
  ) {}

  public async register(input: RegisterInput, meta: RequestMeta): Promise<RegisterResult> {
    const emailNormalized = input.email.trim().toLowerCase();
    const computedFullName =
      input.fullName?.trim() ||
      [input.firstName, input.lastName].filter(Boolean).join(' ').trim();

    if (!computedFullName) {
      throw new ValidationError('Full name is required.');
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const verification = this.tokenService.generateEmailVerificationToken();

    const user = await this.repository.createTravellerWithVerification({
      email: input.email.trim(),
      emailNormalized,
      passwordHash,
      fullName: computedFullName,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      nationality: input.nationality ?? null,
      gender: input.gender ?? null,
      phoneNumber: input.phoneNumber ?? null,
      countryCode: input.countryCode ?? null,
      travelPurpose: input.travelPurpose ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactPhone: input.emergencyContactPhone ?? null,
      emergencyContactRelation: input.emergencyContactRelation ?? null,
      verificationTokenHash: verification.tokenHash,
      verificationExpiresAt: verification.expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const verificationUrl = `${this.config.appBaseUrl}/verify-email?token=${encodeURIComponent(
      verification.rawToken
    )}`;

    const delivery = await this.emailService.sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationToken: verification.rawToken,
      verificationUrl,
      expiresInMinutes: this.tokenService.getVerificationTtlMinutes(),
    });

    return {
      user: sanitizeUser(user),
      emailVerification: {
        required: true,
        delivery,
      },
    };
  }

  public async login(input: LoginInput, meta: RequestMeta): Promise<LoginResult> {
    const emailNormalized = input.email.trim().toLowerCase();
    let user = await this.repository.findUserByEmail(emailNormalized);

    if (!user) {
      await this.repository.logAuditEvent({
        userId: null,
        eventType: 'login_failed_unknown_email',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.passwordHash,
      input.password
    );

    if (!isPasswordValid) {
      await this.repository.logAuditEvent({
        userId: user.id,
        eventType: 'login_failed_bad_password',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      await this.repository.logAuditEvent({
        userId: user.id,
        eventType: 'login_blocked_inactive',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      throw new ForbiddenError('This account has been deactivated.', 'ACCOUNT_INACTIVE');
    }

    if (this.config.adminEmails.includes(emailNormalized)) {
      if (!user.emailVerified) {
        throw new ForbiddenError(
          'Verify this email address before administrator access can be granted.',
          'EMAIL_VERIFICATION_REQUIRED'
        );
      }

      if (!user.roles.includes(USER_ROLES.ADMIN_STAFF)) {
        await this.repository.assignUserRole(user.id, USER_ROLES.ADMIN_STAFF);
        const updatedUser = await this.repository.findUserById(user.id);
        if (!updatedUser) {
          throw new UnauthorizedError(
            'The authenticated account could not be loaded.',
            'ACCOUNT_UNAVAILABLE'
          );
        }
        user = updatedUser;
      }
    }

    const access = await this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });
    const refresh = this.tokenService.generateRefreshToken();

    await this.repository.recordLoginSuccess({
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt: refresh.expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken: access.token,
        refreshToken: refresh.rawToken,
        tokenType: 'Bearer',
        expiresInSeconds: access.expiresInSeconds,
        refreshExpiresInSeconds: this.tokenService.getRefreshTtlSeconds(),
      },
    };
  }

  public async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.token);
    const record = await this.repository.findEmailVerificationTokenByHash(tokenHash);

    if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError(
        'Email verification token is invalid, already used, or expired.',
        'INVALID_VERIFICATION_TOKEN'
      );
    }

    await this.repository.markEmailVerified({
      tokenId: record.id,
      userId: record.userId,
    });

    return { message: 'Email address verified successfully.' };
  }

  public async resendVerification(
    input: ResendVerificationInput
  ): Promise<{ message: string; emailConfigured: boolean }> {
    const emailNormalized = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(emailNormalized);

    if (user && user.isActive && !user.emailVerified) {
      const verification = this.tokenService.generateEmailVerificationToken();
      await this.repository.replaceEmailVerificationToken({
        userId: user.id,
        tokenHash: verification.tokenHash,
        expiresAt: verification.expiresAt,
      });

      const verificationUrl = `${this.config.appBaseUrl}/verify-email?token=${encodeURIComponent(
        verification.rawToken
      )}`;

      await this.emailService.sendVerificationEmail({
        to: user.email,
        fullName: user.fullName,
        verificationToken: verification.rawToken,
        verificationUrl,
        expiresInMinutes: this.tokenService.getVerificationTtlMinutes(),
      });
    }

    return {
      message:
        'If an unverified account matches that email address, verification instructions have been prepared.',
      emailConfigured: this.emailService.isConfigured(),
    };
  }

  public async refresh(input: RefreshInput, meta: RequestMeta): Promise<LoginResult> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.refreshToken);
    const existing = await this.repository.findRefreshTokenByHash(tokenHash);

    if (!existing) {
      throw new UnauthorizedError('Invalid refresh token.', 'INVALID_REFRESH_TOKEN');
    }

    // Reuse detection: if a previously rotated or revoked token is presented again,
    // revoke the entire token family immediately to mitigate token theft.
    if (existing.revokedAt !== null) {
      await this.repository.revokeRefreshTokenFamily(existing.tokenFamilyId, 'reuse_detected');
      await this.repository.logAuditEvent({
        userId: existing.userId,
        eventType: 'refresh_token_reuse_detected',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { tokenFamilyId: existing.tokenFamilyId },
      });
      throw new UnauthorizedError(
        'Refresh token reuse detected. Session family has been revoked.',
        'REFRESH_TOKEN_REUSED'
      );
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.repository.revokeRefreshTokenByHash(tokenHash, 'expired');
      throw new UnauthorizedError('Refresh token has expired.', 'REFRESH_TOKEN_EXPIRED');
    }

    const user = await this.repository.findUserById(existing.userId);
    if (!user || !user.isActive) {
      await this.repository.revokeRefreshTokenFamily(existing.tokenFamilyId, 'account_unavailable');
      throw new UnauthorizedError('Account is unavailable or deactivated.', 'ACCOUNT_UNAVAILABLE');
    }

    const nextRefresh = this.tokenService.generateRefreshToken();
    await this.repository.rotateRefreshToken({
      oldTokenId: existing.id,
      userId: user.id,
      newTokenHash: nextRefresh.tokenHash,
      tokenFamilyId: existing.tokenFamilyId,
      expiresAt: nextRefresh.expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const nextAccess = await this.tokenService.signAccessToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      user: sanitizeUser(user),
      tokens: {
        accessToken: nextAccess.token,
        refreshToken: nextRefresh.rawToken,
        tokenType: 'Bearer',
        expiresInSeconds: nextAccess.expiresInSeconds,
        refreshExpiresInSeconds: this.tokenService.getRefreshTtlSeconds(),
      },
    };
  }

  public async logout(
    input: LogoutInput,
    meta: RequestMeta,
    authenticatedUserId?: string
  ): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.refreshToken);
    const existing = await this.repository.findRefreshTokenByHash(tokenHash);

    if (input.allSessions && authenticatedUserId) {
      await this.repository.revokeAllUserRefreshTokens(authenticatedUserId, 'logout_all');
      await this.repository.logAuditEvent({
        userId: authenticatedUserId,
        eventType: 'logout_all_sessions',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    } else if (existing) {
      await this.repository.revokeRefreshTokenByHash(tokenHash, 'logout');
      await this.repository.logAuditEvent({
        userId: existing.userId,
        eventType: 'logout',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    }

    return { message: 'Logged out successfully.' };
  }

  public async forgotPassword(
    input: ForgotPasswordInput,
    meta: RequestMeta
  ): Promise<{ message: string; emailConfigured: boolean }> {
    const emailNormalized = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(emailNormalized);

    if (user && user.isActive) {
      const resetToken = this.tokenService.generatePasswordResetToken();
      await this.repository.createPasswordResetToken({
        userId: user.id,
        tokenHash: resetToken.tokenHash,
        expiresAt: resetToken.expiresAt,
        requestedIp: meta.ipAddress,
      });

      const resetUrl = `${this.config.appBaseUrl}/reset-password?token=${encodeURIComponent(
        resetToken.rawToken
      )}`;

      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetToken: resetToken.rawToken,
        resetUrl,
        expiresInMinutes: this.tokenService.getResetTtlMinutes(),
      });
    }

    // Constant non-enumerable response regardless of account existence
    return {
      message:
        'If an account with that email address exists, password recovery instructions have been prepared.',
      emailConfigured: this.emailService.isConfigured(),
    };
  }

  public async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.token);
    const resetRecord = await this.repository.findPasswordResetTokenByHash(tokenHash);

    if (
      !resetRecord ||
      resetRecord.usedAt !== null ||
      resetRecord.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedError(
        'Password reset token is invalid, already used, or expired.',
        'INVALID_RESET_TOKEN'
      );
    }

    const newPasswordHash = await this.passwordService.hashPassword(input.newPassword);
    await this.repository.completePasswordReset({
      tokenId: resetRecord.id,
      userId: resetRecord.userId,
      newPasswordHash,
    });

    return {
      message: 'Password has been reset successfully. Please sign in with your new password.',
    };
  }

  public async getMe(userId: string): Promise<SanitizedUserDto> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Authenticated account was not found or is inactive.', 'UNAUTHORIZED');
    }
    return sanitizeUser(user);
  }
}
