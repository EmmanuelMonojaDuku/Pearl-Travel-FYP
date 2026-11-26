import type { UserProfile } from '../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

// Admin emails can be supplied via VITE_ADMIN_EMAILS.
// The fallback list includes the original admin address.
const BOOTSTRAP_ADMIN_EMAILS = new Set(
  (import.meta.env.VITE_ADMIN_EMAILS || 'emmanuelmonojaduku@gmail.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export class ApiUnavailableError extends Error {
  constructor() {
    super('The Pearl Travel API is not reachable.');
    this.name = 'ApiUnavailableError';
  }
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  gender: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  travelPurpose: UserProfile['travelPurpose'] | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  roles: NonNullable<UserProfile['roles']>;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: ApiErrorResponse['error'];
}

export interface AuthenticatedSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface AdminOverview {
  generatedAt: string;
  kpis: {
    totalTravellers: number;
    totalJourneys: number;
    activeJourneys: number;
    totalAssessments: number;
    pendingContentReviews: number;
    totalQrVerifications: number;
    validQrSummaries: number;
  };
  systemHealth: {
    api: 'healthy';
    database: 'healthy' | 'unconfigured' | 'unhealthy';
    databaseLatencyMs: number | null;
  };
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
  } catch {
    throw new ApiUnavailableError();
  }

  const payload = (await response.json()) as ApiEnvelope<T> & ApiErrorResponse;
  if (!response.ok || !payload.success) {
    throw new ApiRequestError(
      payload.error?.message || `Request failed with status ${response.status}.`,
      response.status,
      payload.error?.code
    );
  }
  return payload;
}

function mapApiUser(user: ApiUser): UserProfile {
  const genderOptions: NonNullable<UserProfile['gender']>[] = [
    'Male',
    'Female',
    'Non-Binary',
    'Prefer not to say',
  ];
  const gender = genderOptions.find((option) => option === user.gender);
  return {
    id: user.id,
    name: user.fullName,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    email: user.email,
    nationality: user.nationality ?? undefined,
    gender,
    phoneNumber: user.phoneNumber ?? undefined,
    countryCode: user.countryCode ?? undefined,
    travelPurpose: user.travelPurpose ?? undefined,
    emergencyContactName: user.emergencyContactName ?? undefined,
    emergencyContactPhone: user.emergencyContactPhone ?? undefined,
    emergencyContactRelation: user.emergencyContactRelation ?? undefined,
    roles: user.roles,
    profileCompleted: false,
  };
}

export function isBootstrapAdminEmail(email: string): boolean {
  return BOOTSTRAP_ADMIN_EMAILS.has(email.trim().toLowerCase());
}

export async function loginWithApi(input: {
  email: string;
  password: string;
}): Promise<AuthenticatedSession> {
  const result = await request<{
    user: ApiUser;
    tokens: { accessToken: string; refreshToken: string };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return {
    user: mapApiUser(result.data.user),
    accessToken: result.data.tokens.accessToken,
    refreshToken: result.data.tokens.refreshToken,
  };
}

export async function registerWithApi(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ verificationDelivered: boolean }> {
  const result = await request<{
    emailVerification: {
      required: boolean;
      delivery: { delivered: boolean };
    };
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      fullName: `${input.firstName} ${input.lastName}`.trim(),
    }),
  });

  return {
    verificationDelivered: result.data.emailVerification.delivery.delivered,
  };
}

export async function verifyEmailWithApi(token: string): Promise<void> {
  await request<{ message: string }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function fetchAdminOverview(accessToken: string): Promise<AdminOverview> {
  const result = await request<AdminOverview>('/admin/overview', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return result.data;
}

export async function logoutFromApi(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await request<{ message: string }>('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ refreshToken }),
  });
}
