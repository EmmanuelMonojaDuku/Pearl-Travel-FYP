import { PassengerProfile, TravelPurpose, UserProfile } from '../types';

const STORAGE_KEY_SESSION = 'pearl_travel_user_session_v1';
const STORAGE_KEY_ACCOUNTS = 'pearl_travel_accounts_v1';
const STORAGE_KEY_PROFILES_BY_EMAIL = 'pearl_travel_profiles_by_email_v1';
const STORAGE_KEY_LEGACY_PROFILE = 'pearl_travel_passenger_profile_v1';
const STORAGE_KEY_FLOW_STATUS = 'pearl_travel_flow_completed_v1';

interface StoredAccountRecord {
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

const VALID_PURPOSES: TravelPurpose[] = [
  'tourism',
  'business',
  'family',
  'studies',
  'transit',
  'employment',
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPasswordClient(password: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoded = new TextEncoder().encode(`pearl-travel-v1:${password}`);
      const digest = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below when subtle crypto is unavailable in non-secure contexts
  }

  let hash = 2166136261;
  const input = `pearl-travel-v1:${password}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a_${(hash >>> 0).toString(16)}`;
}

function readAccountsMap(): Record<string, StoredAccountRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAccountsMap(accounts: Record<string, StoredAccountRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to store account record', e);
  }
}

function readProfilesMap(): Record<string, PassengerProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILES_BY_EMAIL);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfilesMap(profiles: Record<string, PassengerProfile>): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES_BY_EMAIL, JSON.stringify(profiles));
    return true;
  } catch (e) {
    console.error('Failed to persist profile map', e);
    return false;
  }
}

export function isTravellerProfileComplete(
  profile?: Partial<PassengerProfile> | null,
  user?: Partial<UserProfile> | null
): boolean {
  const nationality = (profile?.nationality || user?.nationality || '').trim();
  const gender = profile?.gender || user?.gender;
  const countryCode = (profile?.countryCode || user?.countryCode || '').trim();
  const phone = (profile?.phoneNumber || user?.phoneNumber || '').trim();
  const travelPurpose = profile?.travelPurpose || user?.travelPurpose;
  const kinName = (profile?.emergencyContactName || user?.emergencyContactName || '').trim();
  const kinPhone = (profile?.emergencyContactPhone || user?.emergencyContactPhone || '').trim();
  const kinRelation = (
    profile?.emergencyContactRelation ||
    user?.emergencyContactRelation ||
    ''
  ).trim();

  const hasValidPurpose = Boolean(
    travelPurpose && VALID_PURPOSES.includes(travelPurpose as TravelPurpose)
  );

  return Boolean(
    nationality.length >= 2 &&
      gender &&
      countryCode.length >= 2 &&
      phone.replace(/\D/g, '').length >= 6 &&
      hasValidPurpose &&
      kinName.length >= 2 &&
      kinPhone.replace(/\D/g, '').length >= 6 &&
      kinRelation.length >= 2
  );
}

export function createInitialPassengerProfile(user: UserProfile): PassengerProfile {
  const nameParts = (user.name || '').trim().split(/\s+/);
  const firstName = (user.firstName || nameParts[0] || '').trim();
  const lastName = (user.lastName || nameParts.slice(1).join(' ') || '').trim();
  const fullName = `${firstName} ${lastName}`.trim() || user.name || 'Traveller';

  return {
    fullName,
    firstName,
    lastName,
    gender: user.gender,
    nationality: user.nationality || '',
    travelPurpose: (user.travelPurpose || '') as TravelPurpose,
    destination: 'Malaba One-Stop Border Post (OSBP)',
    travellerType: 'solo',
    phoneNumber: user.phoneNumber || '',
    countryCode: user.countryCode || '+256',
    email: user.email || '',
    avatarUrl: user.avatarUrl,
    travelDocumentType: 'Biometric Passport',
    emergencyContactName: user.emergencyContactName || '',
    emergencyContactPhone: user.emergencyContactPhone || '',
    emergencyContactRelation: user.emergencyContactRelation || '',
    passportNumber: '',
    passportExpiryDate: '',
    stayDurationDays: 14,
    hasYellowFeverVax: false,
    hasReturnTicket: false,
    hasAccommodationProof: false,
    hasTravelInsurance: false,
  };
}

export function loadPassengerProfileForUser(user?: UserProfile | null): PassengerProfile | null {
  if (!user?.email) return null;
  const emailKey = normalizeEmail(user.email);
  const profiles = readProfilesMap();
  const stored = profiles[emailKey];
  if (stored) {
    return {
      ...createInitialPassengerProfile(user),
      ...stored,
      firstName: stored.firstName || user.firstName,
      lastName: stored.lastName || user.lastName,
      fullName: stored.fullName || user.name,
      email: stored.email || user.email,
    };
  }
  return createInitialPassengerProfile(user);
}

export function savePassengerProfileForUser(
  email: string,
  profile: PassengerProfile
): boolean {
  const emailKey = normalizeEmail(email);
  if (!emailKey) return false;
  const profiles = readProfilesMap();
  profiles[emailKey] = profile;
  if (!writeProfilesMap(profiles)) return false;
  try {
    localStorage.setItem(STORAGE_KEY_LEGACY_PROFILE, JSON.stringify(profile));
    localStorage.setItem(
      STORAGE_KEY_FLOW_STATUS,
      isTravellerProfileComplete(profile) ? 'true' : 'false'
    );
  } catch (e) {
    console.warn('Profile saved, but compatibility storage could not be updated', e);
  }
  return true;
}

export async function registerLocalAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<{ ok: true; user: UserProfile } | { ok: false; error: string }> {
  const emailKey = normalizeEmail(input.email);
  const accounts = readAccountsMap();

  if (accounts[emailKey]) {
    return {
      ok: false,
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  const passwordHash = await hashPasswordClient(input.password);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  accounts[emailKey] = {
    email: emailKey,
    firstName,
    lastName,
    name: fullName,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  writeAccountsMap(accounts);

  const user: UserProfile = {
    name: fullName,
    firstName,
    lastName,
    email: emailKey,
    profileCompleted: false,
  };

  const initialProfile = createInitialPassengerProfile(user);
  savePassengerProfileForUser(emailKey, initialProfile);

  return { ok: true, user };
}

export async function authenticateLocalAccount(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: UserProfile } | { ok: false; error: string }> {
  const emailKey = normalizeEmail(input.email);
  const accounts = readAccountsMap();
  const account = accounts[emailKey];

  if (!account) {
    return {
      ok: false,
      error: 'No Pearl Travel account found for this email address. Please create an account first.',
    };
  }

  const candidateHash = await hashPasswordClient(input.password);
  if (candidateHash !== account.passwordHash) {
    return {
      ok: false,
      error: 'Invalid email address or password. Please check your credentials and try again.',
    };
  }

  const profiles = readProfilesMap();
  const savedProfile = profiles[emailKey];
  const profileCompleted = isTravellerProfileComplete(savedProfile);

  const user: UserProfile = {
    name: savedProfile?.fullName || account.name,
    firstName: savedProfile?.firstName || account.firstName,
    lastName: savedProfile?.lastName || account.lastName,
    email: account.email,
    nationality: savedProfile?.nationality,
    gender: savedProfile?.gender,
    countryCode: savedProfile?.countryCode,
    phoneNumber: savedProfile?.phoneNumber,
    travelPurpose: savedProfile?.travelPurpose,
    avatarUrl: savedProfile?.avatarUrl,
    emergencyContactName: savedProfile?.emergencyContactName,
    emergencyContactPhone: savedProfile?.emergencyContactPhone,
    emergencyContactRelation: savedProfile?.emergencyContactRelation,
    profileCompleted,
  };

  return { ok: true, user };
}

export function loadPersistedSession(): { user: UserProfile; rememberMe: boolean } | null {
  try {
    const sessionRaw = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionRaw) {
      return { user: JSON.parse(sessionRaw), rememberMe: false };
    }
    const localRaw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (localRaw) {
      return { user: JSON.parse(localRaw), rememberMe: true };
    }
  } catch (e) {
    console.error('Failed to read persisted session', e);
  }
  return null;
}

export function persistSession(user: UserProfile, rememberMe: boolean): void {
  try {
    const serialized = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY_SESSION, serialized);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
    } else {
      sessionStorage.setItem(STORAGE_KEY_SESSION, serialized);
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  } catch (e) {
    console.error('Failed to save session', e);
  }
}

export function clearPersistedSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    sessionStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}
