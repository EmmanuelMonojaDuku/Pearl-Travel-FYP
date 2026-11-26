import type { UserRole } from '../../shared/roles.js';

export interface AuthUserRecord {
  id: string;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  gender: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  travelPurpose: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  legacySupabaseUserId: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
}

export interface SanitizedUserDto {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  gender: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  travelPurpose: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  tokenFamilyId: string;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  revocationReason: string | null;
  createdAt: Date;
}

export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  requestedIp: string | null;
  createdAt: Date;
}

export interface AuthenticatedContextUser {
  userId: string;
  email: string;
  roles: UserRole[];
  jti: string;
}

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export function sanitizeUser(user: AuthUserRecord): SanitizedUserDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    nationality: user.nationality,
    gender: user.gender,
    phoneNumber: user.phoneNumber,
    countryCode: user.countryCode,
    travelPurpose: user.travelPurpose,
    emergencyContactName: user.emergencyContactName,
    emergencyContactPhone: user.emergencyContactPhone,
    emergencyContactRelation: user.emergencyContactRelation,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    isActive: user.isActive,
    roles: [...user.roles],
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
