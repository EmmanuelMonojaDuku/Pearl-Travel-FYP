import { PassengerProfile, TravelRequirement, ChecklistItem, DocumentStatus } from '../types';
import { evaluateRules, scoreReadiness, type EvaluationResult } from '../../shared/rulesEvaluator';
import { getRuleSnapshot } from './ruleStore';

export const POPULAR_NATIONALITIES = [
  'United States',
  'United Kingdom',
  'Uganda',
  'Kenya',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Democratic Republic of the Congo',
  'Germany',
  'Canada',
  'Australia',
  'India',
  'China',
  'South Africa',
  'Nigeria',
  'United Arab Emirates',
  'France',
  'Netherlands',
];

export const EAST_AFRICAN_COMMUNITY = [
  'Uganda',
  'Kenya',
  'Tanzania',
  'Rwanda',
  'Burundi',
  'South Sudan',
  'Democratic Republic of the Congo',
  'Somalia',
];

export const VISA_EXEMPT_COUNTRIES = [
  ...EAST_AFRICAN_COMMUNITY,
  'Antigua',
  'Bahamas',
  'Barbados',
  'Belize',
  'Fiji',
  'Gambia',
  'Grenada',
  'Jamaica',
  'Malawi',
  'Malta',
  'Mauritius',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Solomon Islands',
  'St. Vincent & Grenadines',
  'Tonga',
  'Vanuatu',
  'Zambia',
  'Zimbabwe',
];

export const POPULAR_DESTINATIONS = [
  'Entebbe & Kampala (City, Lake Victoria & Hub)',
  'Bwindi Impenetrable National Park (Mountain Gorillas)',
  'Murchison Falls National Park (Big 5 & River Nile)',
  'Queen Elizabeth National Park (Tree-climbing Lions & Kazinga Channel)',
  'Kibale National Park (Primate Capital & Chimpanzee Trekking)',
  'Jinja (Adventure Capital & Source of the Nile)',
  'Kidepo Valley National Park (Untamed Wilderness)',
  'Rwenzori Mountains (Mountains of the Moon)',
  'Lake Bunyonyi (Highland Relaxation)',
  'East Africa Multi-Country Circuit (Uganda + Rwanda + Kenya)',
];

/** Evaluates the active rule set for a traveller. The rules are data (see shared/defaultRules.json and the admin portal). */
export function evaluateForProfile(profile?: PassengerProfile | null): EvaluationResult {
  const snap = getRuleSnapshot();
  const journey = profile?.journey;
  return evaluateRules(
    {
      nationality: profile?.nationality,
      purpose: journey?.travelPurpose || profile?.travelPurpose,
      travelMode: journey?.travelMode,
      borderPoint: journey?.intendedBorderPoint || profile?.destination,
      destination: `${journey?.destinationCountry ?? ''} ${profile?.destination ?? ''}`.trim(),
      travellerType: profile?.travellerType,
    },
    snap.rules,
    snap.groups
  );
}

export function generateRequirementsForProfile(profile?: PassengerProfile | null): TravelRequirement[] {
  return evaluateForProfile(profile).requirements.map((r) => ({
    id: r.code,
    category: r.category,
    title: r.title,
    summary: r.summary,
    simpleExplanation: r.simpleExplanation,
    applicableCondition: r.applicableCondition,
    mandatory: r.mandatory,
    officialSource: r.officialSource,
    verification: { status: r.verification.status },
  }));
}

/** Starting status of each document, taken only from what the traveller has told the app. */
function initialStatus(id: string, profile: PassengerProfile | null | undefined, group: string): DocumentStatus {
  if (!profile) return 'missing';
  switch (id) {
    case 'doc-passport': return profile.passportNumber ? 'complete' : 'missing';
    case 'doc-visa': return group === 'visa_required' ? 'missing' : 'complete';
    case 'doc-yellow-fever': return profile.hasYellowFeverVax ? 'complete' : 'missing';
    case 'doc-return-ticket': return profile.hasReturnTicket ? 'complete' : 'missing';
    case 'doc-accommodation': return profile.hasAccommodationProof ? 'complete' : 'missing';
    case 'doc-travel-insurance': return profile.hasTravelInsurance ? 'complete' : 'missing';
    default: return 'missing';
  }
}

export function generateDefaultChecklist(profile?: PassengerProfile | null): ChecklistItem[] {
  const result = evaluateForProfile(profile);
  return result.checklist.map((c) => {
    const isPassport = c.id === 'doc-passport';
    const eacId = isPassport && profile?.travelDocumentType === 'EAC National ID Card';
    return {
      id: c.id,
      category: c.category,
      title: eacId ? 'EAC National Identity Card (Biometric)' : isPassport && profile?.travelDocumentType ? profile.travelDocumentType : c.title,
      description: eacId ? 'Recognised travel ID for citizens of Uganda, Kenya and Rwanda under the Northern Corridor pact.' : c.description,
      status: initialStatus(c.id, profile, result.group),
      mandatory: c.mandatory,
      docNumber: isPassport && profile?.passportNumber ? profile.passportNumber : undefined,
      expiryDate: isPassport && profile?.passportExpiryDate ? profile.passportExpiryDate : undefined,
      guidanceNote: c.guidanceNote,
      issuingAuthority: c.issuingAuthority,
      verification: { status: c.verification.status },
      reasons: c.reasons,
    };
  });
}

/**
 * Re-aligns a saved checklist with the current rules after the nationality, purpose or journey changes.
 * Items that still apply keep the traveller's status and details; new items are added; items that no longer apply are dropped.
 */
export function reconcileChecklist(existing: ChecklistItem[], fresh: ChecklistItem[]): ChecklistItem[] {
  const byId = new Map(existing.map((i) => [i.id, i]));
  return fresh.map((f) => {
    const kept = byId.get(f.id);
    return kept ? { ...f, status: kept.status, docNumber: kept.docNumber ?? f.docNumber, expiryDate: kept.expiryDate ?? f.expiryDate } : f;
  });
}

export function calculateReadinessScore(checklist: ChecklistItem[]): {
  score: number;
  totalCount: number;
  completedCount: number;
  notApplicableCount: number;
  missingMandatoryCount: number;
  missingItems: ChecklistItem[];
  statusLabel: 'Ready' | 'Action Needed' | 'Critical Requirements Missing';
} {
  const scored = scoreReadiness((checklist ?? []).map((i) => ({ mandatory: i.mandatory, status: i.status })));
  return {
    ...scored,
    missingItems: (checklist ?? []).filter((i) => i.status !== 'complete' && i.status !== 'not_applicable'),
  };
}
