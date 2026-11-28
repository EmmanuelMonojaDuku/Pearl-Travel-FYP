/**
 * Pearl Travel rules evaluator — pure TypeScript, no imports, shared by the API, the web app and the mobile app.
 * Rule records are data (stored in the database, edited by administrators); this file only interprets them.
 */

export type NationalityGroup = 'citizen' | 'eac' | 'visa_exempt' | 'visa_required';
export type TravelPurposeKey = 'tourism' | 'business' | 'family' | 'studies' | 'transit' | 'employment';
export const KNOWN_PURPOSES: readonly TravelPurposeKey[] = ['tourism', 'business', 'family', 'studies', 'transit', 'employment'];

export interface NationalityGroupConfig {
  citizen: string[]; // normally ["Uganda"]
  eac: string[];
  visaExempt: string[];
}

export interface RuleWhen {
  nationalityGroups?: NationalityGroup[]; // omitted or empty = any
  purposes?: TravelPurposeKey[];
  travelModes?: string[];
  borderPoints?: string[]; // substring match, case-insensitive
  destinationKeywords?: string[]; // substring match, case-insensitive
  excludeNationalityGroups?: NationalityGroup[];
  excludePurposes?: TravelPurposeKey[];
  excludeDestinationKeywords?: string[];
  excludeTravellerTypes?: string[];
}

export interface RuleChecklistSeed {
  id: string;
  title: string;
  description: string;
  category: 'passport' | 'visa' | 'health' | 'travel' | 'supporting';
  guidanceNote?: string;
  issuingAuthority?: string;
  /** Optional wording that depends on the traveller's nationality group. */
  byGroup?: Partial<Record<NationalityGroup, { title?: string; description?: string; guidanceNote?: string; mandatory?: boolean }>>;
}

export interface RuleVerification {
  status: 'verified' | 'pending';
  verifiedAt?: string | null;
  note?: string;
}

export interface RuleRecord {
  code: string;
  category: 'entry' | 'exit' | 'visa' | 'health' | 'customs';
  title: string;
  summary: string;
  simpleExplanation: string;
  applicableCondition: string;
  officialSource: string;
  mandatory: boolean;
  order: number;
  version: number;
  when?: RuleWhen;
  checklist?: RuleChecklistSeed | null;
  verification: RuleVerification;
}

export interface EvaluationProfile {
  nationality?: string | null;
  purpose?: string | null;
  travelMode?: string | null;
  borderPoint?: string | null;
  destination?: string | null;
  travellerType?: string | null;
}

export interface EvaluatedRequirement {
  code: string;
  category: RuleRecord['category'];
  title: string;
  summary: string;
  simpleExplanation: string;
  applicableCondition: string;
  officialSource: string;
  mandatory: boolean;
  verification: RuleVerification;
  version: number;
}

export interface EvaluatedChecklistItem {
  id: string;
  code: string;
  title: string;
  description: string;
  category: RuleChecklistSeed['category'];
  mandatory: boolean;
  guidanceNote?: string;
  issuingAuthority?: string;
  verification: RuleVerification;
  /** Plain-language reasons this item is on this traveller's list, taken from the rule's conditions. */
  reasons: string[];
}

export type EvaluationWarning =
  | 'missing_nationality'
  | 'unsupported_purpose'
  | 'missing_purpose'
  | 'unverified_rules_applied';

export interface EvaluationResult {
  group: NationalityGroup;
  purpose: TravelPurposeKey | 'other';
  requirements: EvaluatedRequirement[];
  checklist: EvaluatedChecklistItem[];
  warnings: EvaluationWarning[];
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export function classifyNationality(nationality: string | null | undefined, groups: NationalityGroupConfig): NationalityGroup {
  const n = norm(nationality);
  if (!n) return 'visa_required';
  if (groups.citizen.some((c) => norm(c) === n)) return 'citizen';
  if (groups.eac.some((c) => norm(c) === n)) return 'eac';
  if (groups.visaExempt.some((c) => norm(c) === n)) return 'visa_exempt';
  return 'visa_required';
}

export function normalisePurpose(purpose: string | null | undefined): TravelPurposeKey | 'other' {
  const p = norm(purpose);
  return (KNOWN_PURPOSES as readonly string[]).includes(p) ? (p as TravelPurposeKey) : 'other';
}

function fill(text: string, ctx: { nationality: string; purpose: string; border: string }): string {
  return text.replace(/\{nationality\}/g, ctx.nationality).replace(/\{purpose\}/g, ctx.purpose).replace(/\{border\}/g, ctx.border);
}

function matches(when: RuleWhen | undefined, p: { group: NationalityGroup; purpose: TravelPurposeKey | 'other'; mode: string; border: string; dest: string; type: string }): boolean {
  if (!when) return true;
  if (when.nationalityGroups?.length && !when.nationalityGroups.includes(p.group)) return false;
  if (when.purposes?.length && (p.purpose === 'other' || !when.purposes.includes(p.purpose))) return false;
  if (when.travelModes?.length && !when.travelModes.map(norm).includes(p.mode)) return false;
  if (when.borderPoints?.length && !when.borderPoints.some((b) => p.border.includes(norm(b)))) return false;
  if (when.destinationKeywords?.length && !when.destinationKeywords.some((k) => p.dest.includes(norm(k)))) return false;
  if (when.excludeNationalityGroups?.includes(p.group)) return false;
  if (p.purpose !== 'other' && when.excludePurposes?.includes(p.purpose)) return false;
  if (when.excludeDestinationKeywords?.some((k) => p.dest.includes(norm(k)))) return false;
  if (when.excludeTravellerTypes?.length && when.excludeTravellerTypes.map(norm).includes(p.type)) return false;
  return true;
}

const GROUP_LABEL: Record<NationalityGroup, string> = { citizen: 'Ugandan citizen', eac: 'EAC citizen', visa_exempt: 'visa-exempt nationality', visa_required: 'e-Visa nationality' };
export const groupLabel = (g: NationalityGroup) => GROUP_LABEL[g];
const PURPOSE_LABEL: Record<TravelPurposeKey, string> = { tourism: 'tourism', business: 'business', family: 'family visit', studies: 'study', transit: 'transit', employment: 'work' };
export const purposeLabel = (p: TravelPurposeKey | 'other') => (p === 'other' ? 'your trip' : PURPOSE_LABEL[p]);

function reasonsFor(r: RuleRecord, group: NationalityGroup, purpose: TravelPurposeKey | 'other', p: EvaluationProfile, byGroup: boolean): string[] {
  const w = r.when ?? {};
  const out: string[] = [];
  if (w.nationalityGroups?.length || byGroup) out.push(`${p.nationality?.trim() || 'Your nationality'} (${GROUP_LABEL[group]})`);
  if (w.purposes?.length) out.push(`${purposeLabel(purpose)} travel`);
  if (w.travelModes?.length && p.travelMode) out.push(`travelling by ${p.travelMode}`);
  if (w.borderPoints?.length && p.borderPoint) out.push(`crossing at ${p.borderPoint}`);
  if (w.destinationKeywords?.length && p.destination) out.push('your destination');
  return out.length ? out : ['Needed by every traveller'];
}

export function evaluateRules(profile: EvaluationProfile, rules: RuleRecord[], groups: NationalityGroupConfig): EvaluationResult {
  const warnings: EvaluationWarning[] = [];
  if (!norm(profile.nationality)) warnings.push('missing_nationality');
  if (!norm(profile.purpose)) warnings.push('missing_purpose');
  const purpose = normalisePurpose(profile.purpose);
  if (purpose === 'other' && norm(profile.purpose)) warnings.push('unsupported_purpose');
  const group = classifyNationality(profile.nationality, groups);
  const ctx = { nationality: profile.nationality?.trim() || 'your nationality', purpose: norm(profile.purpose) || 'your trip', border: profile.borderPoint?.trim() || 'the border' };
  const probe = { group, purpose, mode: norm(profile.travelMode), border: norm(profile.borderPoint), dest: norm(profile.destination), type: norm(profile.travellerType) };

  const applicable = rules.filter((r) => matches(r.when, probe)).sort((a, b) => a.order - b.order);

  const requirements: EvaluatedRequirement[] = applicable.map((r) => ({
    code: r.code,
    category: r.category,
    title: fill(r.title, ctx),
    summary: fill(r.summary, ctx),
    simpleExplanation: fill(r.simpleExplanation, ctx),
    applicableCondition: fill(r.applicableCondition, ctx),
    officialSource: r.officialSource,
    mandatory: r.mandatory,
    verification: r.verification,
    version: r.version,
  }));

  const checklist: EvaluatedChecklistItem[] = applicable
    .filter((r) => r.checklist)
    .map((r) => {
      const c = r.checklist!;
      const g = c.byGroup?.[group];
      return {
        id: c.id,
        code: r.code,
        title: fill(g?.title ?? c.title, ctx),
        description: fill(g?.description ?? c.description, ctx),
        category: c.category,
        mandatory: g?.mandatory ?? r.mandatory,
        guidanceNote: g?.guidanceNote ?? c.guidanceNote,
        issuingAuthority: c.issuingAuthority,
        verification: r.verification,
        reasons: reasonsFor(r, group, purpose, profile, Boolean(g)),
      };
    });

  if (applicable.some((r) => r.verification.status !== 'verified')) warnings.push('unverified_rules_applied');
  return { group, purpose, requirements, checklist, warnings };
}

/** Readiness scoring shared by the app, the mobile app and the API. Mandatory items count double; N/A items are ignored. */
export type ItemStatus = 'complete' | 'missing' | 'expired' | 'not_applicable';
export interface ScoredItem { mandatory: boolean; status: ItemStatus }

export function scoreReadiness(items: ScoredItem[]): {
  score: number;
  totalCount: number;
  completedCount: number;
  notApplicableCount: number;
  missingMandatoryCount: number;
  statusLabel: 'Ready' | 'Action Needed' | 'Critical Requirements Missing';
} {
  let total = 0;
  let earned = 0;
  let completed = 0;
  let na = 0;
  let missingMandatory = 0;
  for (const it of items) {
    if (it.status === 'not_applicable') { na++; continue; }
    const w = it.mandatory ? 2 : 1;
    total += w;
    if (it.status === 'complete') { earned += w; completed++; }
    else if (it.mandatory) missingMandatory++;
  }
  const score = total > 0 ? Math.max(0, Math.min(100, Math.round((earned / total) * 100))) : 0;
  const statusLabel = items.length === 0 ? 'Critical Requirements Missing'
    : score === 100 && missingMandatory === 0 ? 'Ready'
    : missingMandatory > 0 || score < 70 ? 'Critical Requirements Missing' : 'Action Needed';
  return { score, totalCount: items.length - na, completedCount: completed, notApplicableCount: na, missingMandatoryCount: missingMandatory, statusLabel };
}
