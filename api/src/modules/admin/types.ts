import type { UserRole } from '../../shared/roles.js';

export type WorkflowStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export type ContentType = 'guidance' | 'faq' | 'notice';
export type ContentCategory = 'immigration' | 'health' | 'customs' | 'border_post' | 'transport';
export type RequirementCategory = 'entry' | 'exit' | 'visa' | 'health' | 'customs';
export type BorderPostStatus = 'active' | 'maintenance' | 'restricted';
export type JourneyStatus = 'planned' | 'ready' | 'in_transit' | 'crossed' | 'cancelled';
export type TravelMode = 'road' | 'air' | 'rail';
export type QrSummaryStatus = 'valid' | 'expired' | 'revoked';
export type QrVerificationOutcome = 'verified' | 'expired' | 'revoked' | 'invalid';
export type ServiceHealthState = 'healthy' | 'degraded' | 'unavailable' | 'not_monitored';
export type TrendPeriod = '7d' | '30d' | '90d' | 'custom';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ServiceStatusItem {
  key: 'database' | 'api' | 'authentication' | 'file_storage' | 'background_worker' | 'backups';
  label: string;
  status: ServiceHealthState;
  detail: string;
  latencyMs?: number;
  checkedAt: string;
}

export interface SystemHealthDto {
  overallStatus: 'healthy' | 'degraded' | 'unavailable';
  checkedAt: string;
  services: ServiceStatusItem[];
}

export interface TravelTrendPointDto {
  date: string;
  travellerRegistrations: number;
  journeysCreated: number;
  qrVerifications: number;
}

export interface NationalityReadinessDto {
  nationality: string;
  totalAssessments: number;
  readyCount: number;
  actionNeededCount: number;
  criticalCount: number;
  readyPercentage: number;
}

export interface RecentActivityDto {
  id: string;
  timestamp: string;
  activity: string;
  eventType: string;
  actorName: string | null;
  actorRole: string | null;
  module: string;
  status: 'success' | 'pending' | 'failed';
  metadata: Record<string, unknown>;
}

export interface AdminOverviewDto {
  generatedAt: string;
  scope: {
    role: UserRole;
    assignedBorderPostId: string | null;
    assignedBorderPostName: string | null;
  };
  kpis: {
    totalTravellers: number | null;
    newTravellersInPeriod: number | null;
    totalJourneys: number | null;
    activeJourneys: number | null;
    totalAssessments: number | null;
    readyAssessments: number | null;
    readinessCompletionPct: number | null;
    totalQrVerifications: number | null;
    successfulQrVerifications: number | null;
    failedOrExpiredQrVerifications: number | null;
    pendingContentReviews: number | null;
  };
  trends: TravelTrendPointDto[];
  readinessByNationality: NationalityReadinessDto[];
  recentActivity: RecentActivityDto[];
  systemHealth: SystemHealthDto;
}

export interface AdminTravellerSummaryDto {
  id: string;
  fullName: string;
  email: string;
  nationality: string | null;
  profileCompleted: boolean;
  emailVerified: boolean;
  isActive: boolean;
  journeysCount: number;
  latestReadinessScore: number | null;
  latestReadinessStatus: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminTravellerDetailDto extends AdminTravellerSummaryDto {
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  phoneNumber: string | null;
  countryCode: string | null;
  travelPurpose: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  journeys: AdminJourneyDto[];
  recentAssessments: Array<{
    id: string;
    score: number;
    readinessStatus: string;
    completedItems: number;
    totalItems: number;
    missingMandatoryCount: number;
    assessedAt: string;
  }>;
}

export interface AdminJourneyDto {
  id: string;
  userId: string;
  travellerName: string;
  travellerEmail: string;
  borderPostId: string | null;
  intendedBorderPoint: string;
  destinationCountry: string;
  travelPurpose: string;
  travelMode: TravelMode;
  travelDate: string;
  stayDurationDays: number | null;
  status: JourneyStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BorderPostDto {
  id: string;
  code: string;
  name: string;
  countryPair: string;
  region: string;
  postType: string;
  operatingHours: string;
  status: BorderPostStatus;
  isCaseStudy: boolean;
  coordinatesLat: number | null;
  coordinatesLng: number | null;
  notes: string | null;
  assignedOfficersCount: number;
  journeysCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfficerAssignmentDto {
  id: string;
  userId: string;
  officerName: string;
  officerEmail: string;
  borderPostId: string;
  borderPostName: string;
  isActive: boolean;
  assignedAt: string;
}

export interface AdminContentItemDto {
  id: string;
  slug: string;
  contentType: ContentType;
  category: ContentCategory;
  title: string;
  summary: string;
  body: string;
  officialAuthority: string;
  borderPostId: string | null;
  borderPostName: string | null;
  keywords: string[];
  workflowStatus: WorkflowStatus;
  rejectionReason: string | null;
  authorId: string;
  authorName: string;
  approverId: string | null;
  approverName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRequirementDto {
  id: string;
  code: string;
  category: RequirementCategory;
  title: string;
  summary: string;
  simpleExplanation: string;
  applicableCondition: string;
  officialSource: string;
  mandatory: boolean;
  ruleMetadata: Record<string, unknown>;
  borderPostId: string | null;
  borderPostName: string | null;
  workflowStatus: WorkflowStatus;
  rejectionReason: string | null;
  authorId: string;
  authorName: string;
  approverId: string | null;
  approverName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface QrSummaryRecordDto {
  id: string;
  referenceCode: string;
  travellerName: string;
  travellerNationality: string | null;
  borderPostId: string | null;
  borderPostName: string | null;
  requirementsVersion: number;
  readinessScore: number;
  readinessStatus: string;
  status: QrSummaryStatus;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
}

export interface QrVerificationRecordDto {
  id: string;
  qrSummaryId: string;
  referenceCode: string;
  travellerName: string;
  officerName: string | null;
  borderPostId: string | null;
  borderPostName: string | null;
  outcome: QrVerificationOutcome;
  notes: string | null;
  verifiedAt: string;
}

export interface ReadinessQrOverviewDto {
  stats: {
    totalAssessments: number;
    completedAssessments: number;
    incompleteAssessments: number;
    qrIssued: number;
    qrValid: number;
    qrExpired: number;
    qrRevoked: number;
    verificationsTotal: number;
    verificationsPassed: number;
    verificationsFailed: number;
  };
  summaries: PaginatedResult<QrSummaryRecordDto>;
  verifications: PaginatedResult<QrVerificationRecordDto>;
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  emailVerified: boolean;
  assignedBorderPostId: string | null;
  assignedBorderPostName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLogDto {
  id: string;
  userId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  eventType: string;
  module: string;
  ipAddress: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminSettingDto {
  key: string;
  category: 'application' | 'border_post' | 'content' | 'security' | 'operational';
  label: string;
  description: string;
  value: unknown;
  updatedByName: string | null;
  updatedAt: string;
}

export interface AdminReportsDto {
  range: {
    startDate: string;
    endDate: string;
  };
  registrationsByDay: Array<{ date: string; count: number }>;
  journeysByModeAndStatus: Array<{ travelMode: string; status: string; count: number }>;
  readinessDistribution: Array<{ status: string; count: number }>;
  outstandingRequirements: Array<{ itemTitle: string; missingCount: number }>;
  qrVerificationActivity: Array<{ outcome: string; count: number }>;
  contentApprovalActivity: Array<{ workflowStatus: string; count: number }>;
  borderPostActivity: Array<{ borderPostName: string; journeysCount: number; verificationsCount: number }>;
}
