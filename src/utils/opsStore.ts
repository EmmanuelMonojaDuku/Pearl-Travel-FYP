import type { QRSummaryData } from '../types';

/**
 * Browser-local store used by the officer and admin portals.
 * The API currently exposes only a read-only admin overview, so verification history,
 * content management and AI change review are persisted per-browser until the
 * matching API routes exist. Every reader/writer is wrapped so a blocked storage never crashes the UI.
 */

const KEY_QR = 'pearl_ops_qr_registry_v1';
const KEY_SCANS = 'pearl_ops_scan_history_v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/* ── QR registry (traveller publishes, officer looks up) ── */
export function publishQr(qr: QRSummaryData): void {
  const reg = read<Record<string, QRSummaryData>>(KEY_QR, {});
  reg[qr.referenceId] = qr;
  write(KEY_QR, reg);
}

export function parseQrPayload(text: string): QRSummaryData | null {
  const t = text.trim();
  try {
    const obj = JSON.parse(t);
    if (obj && typeof obj.referenceId === 'string' && obj.checklistSummary) return obj as QRSummaryData;
  } catch {
    /* not JSON — treat as a reference id below */
  }
  return searchQr(t)[0] ?? null;
}

export function searchQr(query: string): QRSummaryData[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(read<Record<string, QRSummaryData>>(KEY_QR, {})).filter(
    (r) => r.referenceId.toLowerCase().includes(q) || r.passengerName.toLowerCase().includes(q)
  );
}

/* ── Scan history ── */
export type ScanDecision = 'approved' | 'flagged';
export interface ScanRecord {
  id: string;
  referenceId: string;
  passengerName: string;
  nationality: string;
  readinessScore: number;
  decision: ScanDecision;
  officerEmail: string;
  at: string;
}

export function getScans(): ScanRecord[] {
  return read<ScanRecord[]>(KEY_SCANS, []);
}
export function addScan(rec: Omit<ScanRecord, 'id' | 'at'>): ScanRecord {
  const full: ScanRecord = { ...rec, id: `scan-${Date.now()}`, at: new Date().toISOString() };
  write(KEY_SCANS, [full, ...getScans()].slice(0, 200));
  return full;
}

/* ── Admin content modules ── */
export type ModuleId = 'requirements' | 'faqs' | 'guidance' | 'knowledge';
export type ContentStatus = 'draft' | 'pending' | 'published';
export interface ContentItem {
  id: string;
  module: ModuleId;
  title: string;
  body: string;
  status: ContentStatus;
  updatedAt: string;
}
export const MODULES: { id: ModuleId; label: string; blurb: string }[] = [
  { id: 'requirements', label: 'Requirements Management', blurb: 'Entry, visa, health and customs rules' },
  { id: 'faqs', label: 'FAQs Management', blurb: 'Answers travellers ask most' },
  { id: 'guidance', label: 'Guidance Management', blurb: 'Step-by-step border procedures' },
  { id: 'knowledge', label: 'Knowledge Base Management', blurb: 'Verified sources for the AI assistant' },
];

const KEY_CONTENT = 'pearl_admin_content_v1';
const now = () => new Date().toISOString();
const seedContent = (): ContentItem[] => {
  const mk = (module: ModuleId, title: string, body: string, status: ContentStatus = 'published'): ContentItem => ({
    id: `c-${module}-${title.toLowerCase().replace(/\W+/g, '-').slice(0, 24)}`,
    module, title, body, status, updatedAt: now(),
  });
  return [
    mk('requirements', 'Valid passport (6-month minimum)', 'Passport must be valid for at least 6 months past entry.'),
    mk('requirements', 'Uganda e-Visa', 'Apply online before departure; carry the approval letter.'),
    mk('requirements', 'Yellow fever certificate', 'Mandatory for all arrivals aged 1 year and above.'),
    mk('faqs', 'Do I need a visa at Malaba OSBP?', 'Most nationalities need an e-Visa; EAC citizens are exempt.'),
    mk('faqs', 'Is a yellow fever card required?', 'Yes. Carry the original physical card.'),
    mk('guidance', 'Malaba one-stop border post walkthrough', 'Arrive, document check, biometric capture, final clearance.'),
    mk('knowledge', 'DCIC Immigration regulations', 'Directorate of Citizenship and Immigration Control – official source.'),
    mk('knowledge', 'URA customs guidelines', 'Uganda Revenue Authority travellers guidance.', 'pending'),
  ];
};

export function getContent(): ContentItem[] {
  const stored = read<ContentItem[] | null>(KEY_CONTENT, null);
  if (stored) return stored;
  const seeded = seedContent();
  write(KEY_CONTENT, seeded);
  return seeded;
}
export function saveContent(items: ContentItem[]): void {
  write(KEY_CONTENT, items);
}
export function newContentId(): string {
  return `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* ── AI change suggestions ── */
export interface AiSuggestion {
  id: string;
  kind: 'ADD' | 'UPDATE';
  module: ModuleId;
  title: string;
  detail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
const KEY_AI = 'pearl_admin_ai_suggestions_v1';
const seedAi = (): AiSuggestion[] =>
  [
    ['UPDATE', 'requirements', 'Visa on Arrival', 'New requirements for selected nationalities including biometric pre-registration.'],
    ['ADD', 'faqs', 'Frequently Asked Questions', 'Detailed answers added regarding yellow fever vaccination exemptions.'],
    ['UPDATE', 'guidance', 'Guidance Content', 'Revised step-by-step border procedure maps at Malaba One-Stop Border Post.'],
    ['ADD', 'requirements', 'Return ticket evidence', 'Accept e-ticket PDF on phone as proof of onward travel.'],
    ['UPDATE', 'knowledge', 'URA customs allowances', 'Duty-free personal allowances revised for 2026.'],
  ].map(([kind, module, title, detail], i) => ({
    id: `ai-${i}`, kind: kind as AiSuggestion['kind'], module: module as ModuleId, title, detail, status: 'pending' as const, createdAt: now(),
  }));

export function getAiSuggestions(): AiSuggestion[] {
  const stored = read<AiSuggestion[] | null>(KEY_AI, null);
  if (stored) return stored;
  const seeded = seedAi();
  write(KEY_AI, seeded);
  return seeded;
}
export function saveAiSuggestions(items: AiSuggestion[]): void {
  write(KEY_AI, items);
}
