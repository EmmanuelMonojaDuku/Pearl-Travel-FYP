export type AuthMode = 'login' | 'signup';
export type UserRole = 'traveller' | 'admin_staff' | 'border_officer';

export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type GenderType = 'Male' | 'Female' | 'Non-Binary' | 'Prefer not to say';

export interface SignupFormState {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  nationality: string;
  gender: GenderType | '';
  contactNumber: string;
  countryCode: string;
  travelPurpose: TravelPurpose;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation?: string;
  avatarUrl?: string;
  agreeTerms: boolean;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  nationality?: string;
  gender?: string;
  contactNumber?: string;
  travelPurpose?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  general?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  countryCode?: string;
  nationality?: string;
  gender?: GenderType;
  travelPurpose?: TravelPurpose;
  avatarUrl?: string;
  loyaltyTier?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  profileCompleted?: boolean;
  roles?: UserRole[];
  accessToken?: string;
  refreshToken?: string;
}

export type TravelPurpose =
  | 'tourism'
  | 'business'
  | 'family'
  | 'studies'
  | 'transit'
  | 'employment';

export type TravellerType =
  | 'solo'
  | 'family'
  | 'business'
  | 'tourist'
  | 'resident'
  | 'student';

export type DocumentStatus = 'complete' | 'missing' | 'expired';

export type TravelDocumentType =
  | 'Biometric Passport'
  | 'EAC National ID Card'
  | 'Standard Passport'
  | 'Diplomatic / Official Passport'
  | 'Emergency Certificate / Travel Document';

export type TravelMode = 'road' | 'air' | 'rail';

export interface JourneyDetails {
  travelPurpose: TravelPurpose;
  destinationCountry: string;
  intendedBorderPoint: string;
  travelDate: string;
  travelMode: TravelMode;
  stayDurationDays?: number;
  notes?: string;
}

export interface PassengerProfile {
  fullName: string;
  firstName?: string;
  lastName?: string;
  gender?: GenderType;
  nationality: string;
  travelPurpose: TravelPurpose;
  destination: string;
  travellerType: TravellerType;
  phoneNumber?: string;
  countryCode?: string;
  email?: string;
  avatarUrl?: string;
  travelDocumentType?: TravelDocumentType;
  journey?: JourneyDetails;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  passportNumber: string;
  passportExpiryDate: string;
  stayDurationDays: number;
  hasYellowFeverVax: boolean;
  hasReturnTicket: boolean;
  hasAccommodationProof: boolean;
  hasTravelInsurance: boolean;
  notes?: string;
}

export interface KnowledgeArticle {
  id: string;
  category: 'immigration' | 'health' | 'customs' | 'border_post' | 'transport';
  title: string;
  summary: string;
  detailedContent: string;
  officialAuthority: string;
  approvedByAdmin: boolean;
  lastReviewedDate: string;
  keywords: string[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundedSource?: string;
  category?: string;
  verifiedBadge?: boolean;
}

export interface ChecklistItem {
  id: string;
  category: 'passport' | 'visa' | 'health' | 'travel' | 'supporting';
  title: string;
  description: string;
  status: DocumentStatus;
  mandatory: boolean;
  docNumber?: string;
  expiryDate?: string;
  guidanceNote?: string;
  issuingAuthority?: string;
}

export interface TravelRequirement {
  id: string;
  category: 'entry' | 'exit' | 'visa' | 'health' | 'customs';
  title: string;
  summary: string;
  simpleExplanation: string;
  applicableCondition: string;
  mandatory: boolean;
  officialSource?: string;
}

export interface QRSummaryData {
  version: string;
  referenceId: string;
  passengerName: string;
  nationality: string;
  destination: string;
  travelPurpose: string;
  travellerType: string;
  readinessScore: number;
  readinessStatus: 'Ready' | 'Action Needed' | 'Critical Requirements Missing';
  checklistSummary: {
    passport: DocumentStatus;
    visa: DocumentStatus;
    yellowFever: DocumentStatus;
    returnTicket: DocumentStatus;
    accommodation: DocumentStatus;
    travelInsurance: DocumentStatus;
  };
  timestamp: string;
  cachedOffline: boolean;
  disclaimer: string;
}

