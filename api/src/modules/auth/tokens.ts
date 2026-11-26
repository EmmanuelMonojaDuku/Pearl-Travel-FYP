import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { AppConfig } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors.js';
import { isValidUserRole, type UserRole } from '../../shared/roles.js';
import type { AuthenticatedContextUser } from './types.js';

export interface GeneratedOpaqueToken {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export class TokenService {
  private readonly accessSecret: Uint8Array;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;
  private readonly verificationTtlSeconds: number;
  private readonly resetTtlSeconds: number;

  constructor(config: AppConfig) {
    this.accessSecret = new TextEncoder().encode(config.auth.jwtAccessSecret);
    this.issuer = config.auth.jwtIssuer;
    this.audience = config.auth.jwtAudience;
    this.accessTtlSeconds = config.auth.accessTokenTtlSeconds;
    this.refreshTtlSeconds = config.auth.refreshTokenTtlSeconds;
    this.verificationTtlSeconds = config.auth.emailVerificationTtlSeconds;
    this.resetTtlSeconds = config.auth.passwordResetTtlSeconds;
  }

  public async signAccessToken(params: {
    userId: string;
    email: string;
    roles: UserRole[];
  }): Promise<{ token: string; expiresInSeconds: number; jti: string }> {
    const jti = randomUUID();
    const token = await new SignJWT({
      email: params.email,
      roles: params.roles,
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(params.userId)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtlSeconds}s`)
      .sign(this.accessSecret);

    return {
      token,
      expiresInSeconds: this.accessTtlSeconds,
      jti,
    };
  }

  public async verifyAccessToken(token: string): Promise<AuthenticatedContextUser> {
    try {
      const { payload } = await jwtVerify(token, this.accessSecret, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['HS256'],
      });

      if (payload.tokenType !== 'access' || typeof payload.sub !== 'string') {
        throw new UnauthorizedError('Invalid access token.', 'INVALID_TOKEN');
      }

      if (typeof payload.email !== 'string' || !Array.isArray(payload.roles)) {
        throw new UnauthorizedError('Malformed access token claims.', 'INVALID_TOKEN');
      }

      const roles = payload.roles.filter(
        (role): role is UserRole => typeof role === 'string' && isValidUserRole(role)
      );

      return {
        userId: payload.sub,
        email: payload.email,
        roles,
        jti: typeof payload.jti === 'string' ? payload.jti : '',
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Access token is invalid or expired.', 'INVALID_OR_EXPIRED_TOKEN');
    }
  }

  public generateRefreshToken(): GeneratedOpaqueToken {
    return this.generateOpaqueToken('pt_rt_', this.refreshTtlSeconds);
  }

  public generateEmailVerificationToken(): GeneratedOpaqueToken {
    return this.generateOpaqueToken('pt_ev_', this.verificationTtlSeconds);
  }

  public generatePasswordResetToken(): GeneratedOpaqueToken {
    return this.generateOpaqueToken('pt_pr_', this.resetTtlSeconds);
  }

  public hashOpaqueToken(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }

  public getRefreshTtlSeconds(): number {
    return this.refreshTtlSeconds;
  }

  public getVerificationTtlMinutes(): number {
    return Math.round(this.verificationTtlSeconds / 60);
  }

  public getResetTtlMinutes(): number {
    return Math.round(this.resetTtlSeconds / 60);
  }

  private generateOpaqueToken(prefix: string, ttlSeconds: number): GeneratedOpaqueToken {
    const rawSecret = randomBytes(32).toString('base64url');
    const rawToken = `${prefix}${rawSecret}`;
    const tokenHash = this.hashOpaqueToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return { rawToken, tokenHash, expiresAt };
  }
}
