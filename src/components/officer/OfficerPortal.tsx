import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Clock,
  Flag,
  History as HistoryIcon,
  Home,
  LogOut,
  QrCode,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import type { DocumentStatus, QRSummaryData, UserProfile } from '../../types';
import { Button, Card, Pill, ScreenHeader, SectionLabel } from '../ui';
import { addScan, getScans, parseQrPayload, searchQr, type ScanRecord } from '../../utils/opsStore';

type Tab = 'home' | 'scan' | 'history' | 'profile';

interface Props {
  currentUser: UserProfile;
  onLogout: () => void;
}

const DOC_LABELS: { key: keyof QRSummaryData['checklistSummary']; label: string; hint: string }[] = [
  { key: 'passport', label: 'Passport', hint: 'Valid for 6+ months' },
  { key: 'yellowFever', label: 'Yellow Fever Certificate', hint: 'Mandatory health document' },
  { key: 'returnTicket', label: 'Return Ticket', hint: 'Proof of outbound itinerary' },
  { key: 'visa', label: 'Visa / Entry Permit', hint: 'Entry authorisation' },
  { key: 'accommodation', label: 'Accommodation / Invitation', hint: 'Booking or host letter' },
  { key: 'travelInsurance', label: 'Travel Insurance', hint: 'Optional cover' },
];

const statusPill = (s: DocumentStatus) =>
  s === 'complete' ? <Pill tone="success">Verified</Pill> : s === 'not_applicable' ? <Pill>N/A</Pill> : s === 'expired' ? <Pill tone="danger">Expired</Pill> : <Pill tone="warning">Pending</Pill>;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '??';

/** Officer app: Home (dashboard), Scan, History, Profile — matches the officer wireframes. */
export const OfficerPortal: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [tab, setTab] = useState<Tab>('home');
  const [scans, setScans] = useState<ScanRecord[]>(() => getScans());
  const [selected, setSelected] = useState<QRSummaryData | null>(null);

  const refresh = () => setScans(getScans());
  const decide = (qr: QRSummaryData, decision: 'approved' | 'flagged') => {
    addScan({
      referenceId: qr.referenceId,
      passengerName: qr.passengerName,
      nationality: qr.nationality,
      readinessScore: qr.readinessScore,
      decision,
      officerEmail: currentUser.email,
    });
    refresh();
    setSelected(null);
    setTab('history');
  };

  const nav: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: QrCode },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-pearl-slate text-pearl-text flex justify-center">
      <div className="w-full max-w-md flex flex-col min-h-screen">
        <main className="flex-1 px-5 pt-6 pb-24">
          {selected ? (
            <Verification qr={selected} onBack={() => setSelected(null)} onDecide={decide} />
          ) : tab === 'home' ? (
            <OfficerHome scans={scans} onScan={() => setTab('scan')} />
          ) : tab === 'scan' ? (
            <Scanner onResult={setSelected} />
          ) : tab === 'history' ? (
            <HistoryList scans={scans} />
          ) : (
            <Card className="space-y-4">
              <ScreenHeader title="Officer Profile" subtitle="Border Entry Clearance" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-pearl-gold text-pearl-navy font-bold flex items-center justify-center">{initials(currentUser.name)}</div>
                <div>
                  <p className="font-semibold">{currentUser.name}</p>
                  <p className="text-xs text-pearl-placeholder">{currentUser.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={onLogout}><LogOut className="w-4 h-4" /> Sign out</Button>
            </Card>
          )}
        </main>
        <nav aria-label="Officer navigation" className="fixed bottom-0 inset-x-0 z-40 flex justify-center bg-pearl-navy border-t border-pearl-border">
          <div className="w-full max-w-md grid grid-cols-4 h-16">
            {nav.map(({ id, label, icon: Icon }) => {
              const active = tab === id && !selected;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => { setSelected(null); setTab(id); }}
                  className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer ${active ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

const OfficerHome: React.FC<{ scans: ScanRecord[]; onScan: () => void }> = ({ scans, onScan }) => {
  const today = new Date().toDateString();
  const todays = scans.filter((s) => new Date(s.at).toDateString() === today);
  const stat = (label: string, n: number) => (
    <Card className="text-center py-3"><p className="text-2xl font-bold font-heading tabular-nums">{n}</p><p className="text-[10px] text-pearl-placeholder uppercase tracking-wide">{label}</p></Card>
  );
  return (
    <>
      <ScreenHeader title="Border Officer" subtitle="Malaba OSBP" right={<Pill tone="success">● Online</Pill>} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stat('Scanned today', todays.length)}
        {stat('Approved', todays.filter((s) => s.decision === 'approved').length)}
        {stat('Flagged', todays.filter((s) => s.decision === 'flagged').length)}
      </div>
      <Button onClick={onScan}><QrCode className="w-4 h-4" /> Scan Passenger QR</Button>
      <div className="mt-6">
        <SectionLabel>Recent scans</SectionLabel>
        <HistoryList scans={scans.slice(0, 4)} compact />
      </div>
    </>
  );
};

const Scanner: React.FC<{ onResult: (q: QRSummaryData) => void }> = ({ onResult }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'on' | 'unsupported' | 'denied'>('idle');
  const [manual, setManual] = useState('');
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState<QRSummaryData[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  useEffect(() => stop, []);

  const startCamera = async () => {
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCameraState('on');
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } });
      const detector = new Detector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const hit = codes.map((c) => parseQrPayload(c.rawValue)).find(Boolean);
          if (hit) { stop(); onResult(hit); return; }
        } catch { /* keep scanning */ }
        setTimeout(tick, 400);
      };
      void tick();
    } catch {
      setCameraState('denied');
    }
  };

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const direct = parseQrPayload(manual);
    if (direct && manual.trim().startsWith('{')) { onResult(direct); return; }
    const found = searchQr(manual);
    setMatches(found);
    if (found.length === 1) onResult(found[0]);
    else if (found.length === 0) setMessage('No passenger summary found. Ask the traveller to open their QR Pass on this device, or paste the QR payload text.');
  };

  return (
    <>
      <ScreenHeader title="Scan Passenger QR" subtitle="Quick verification" />
      <div className="relative aspect-square rounded-2xl border-2 border-pearl-gold bg-pearl-navy overflow-hidden flex items-center justify-center">
        {cameraState === 'on' ? (
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" aria-label="Camera preview" />
        ) : (
          <div className="text-center px-6">
            <QrCode className="w-14 h-14 mx-auto text-pearl-gold mb-3" />
            <Button full={false} className="mx-auto" onClick={() => void startCamera()}><Camera className="w-4 h-4" /> Start camera</Button>
            {cameraState === 'unsupported' && <p className="mt-3 text-xs text-pearl-placeholder">Live QR scanning isn&apos;t supported by this browser. Use manual search below.</p>}
            {cameraState === 'denied' && <p className="mt-3 text-xs text-pearl-danger-light">Camera permission was denied. Use manual search below.</p>}
          </div>
        )}
      </div>
      <form onSubmit={lookup} className="mt-5 space-y-3">
        <label htmlFor="manual-search" className="sr-only">Manual search</label>
        <input
          id="manual-search"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="Reference ID, passenger name, or pasted QR data"
          className="w-full h-12 rounded-xl bg-pearl-input border border-pearl-border px-4 text-sm placeholder:text-pearl-placeholder focus:outline-none focus:border-pearl-gold"
        />
        <Button variant="outline" type="submit"><Search className="w-4 h-4" /> Manual Search</Button>
      </form>
      {message && <p role="alert" className="mt-3 text-xs text-pearl-danger-light">{message}</p>}
      {matches.length > 1 && (
        <ul className="mt-4 space-y-2">
          {matches.map((m) => (
            <li key={m.referenceId}>
              <button type="button" onClick={() => onResult(m)} className="w-full text-left p-3 rounded-xl bg-pearl-dark border border-pearl-border hover:border-pearl-gold cursor-pointer">
                <p className="text-sm font-semibold">{m.passengerName}</p>
                <p className="text-[11px] text-pearl-placeholder">{m.referenceId} · {m.nationality}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const Verification: React.FC<{ qr: QRSummaryData; onBack: () => void; onDecide: (q: QRSummaryData, d: 'approved' | 'flagged') => void }> = ({ qr, onBack, onDecide }) => {
  const pending = useMemo(() => DOC_LABELS.filter((d) => qr.checklistSummary[d.key] !== 'complete' && qr.checklistSummary[d.key] !== 'not_applicable' && d.key !== 'travelInsurance').length, [qr]);
  const tone = qr.readinessScore >= 80 ? 'success' : qr.readinessScore >= 50 ? 'warning' : 'danger';
  return (
    <>
      <ScreenHeader title="Passenger Verification" subtitle="Border entry clearance audit" onBack={onBack} />
      <Card className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-pearl-gold text-pearl-navy font-bold flex items-center justify-center">{initials(qr.passengerName)}</div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{qr.passengerName}</p>
          <p className="text-[11px] text-pearl-placeholder truncate">{qr.nationality} · {qr.travelPurpose}</p>
        </div>
        <div className="text-right"><p className="text-[10px] uppercase text-pearl-placeholder">Readiness</p><Pill tone={tone}>{qr.readinessScore}% {qr.readinessStatus === 'Ready' ? 'Ready' : ''}</Pill></div>
      </Card>
      <SectionLabel>Document audits</SectionLabel>
      <ul className="space-y-2 mb-6">
        {DOC_LABELS.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pearl-dark border border-pearl-border">
            <div>
              <p className="text-sm font-semibold">{d.label}</p>
              <p className="text-[11px] text-pearl-placeholder">{d.hint}</p>
            </div>
            {statusPill(qr.checklistSummary[d.key])}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-pearl-placeholder mb-4">Ref {qr.referenceId} · generated {new Date(qr.timestamp).toLocaleString()}. {pending > 0 ? `${pending} required item(s) not verified.` : 'All required items verified.'}</p>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => onDecide(qr, 'approved')}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
        <Button variant="danger" onClick={() => onDecide(qr, 'flagged')}><Flag className="w-4 h-4" /> Flag</Button>
      </div>
    </>
  );
};

const HistoryList: React.FC<{ scans: ScanRecord[]; compact?: boolean }> = ({ scans, compact }) => (
  <>
    {!compact && <ScreenHeader title="Scan History" subtitle="Recent verifications" />}
    {scans.length === 0 ? (
      <p className="text-sm text-pearl-placeholder flex items-center gap-2"><Clock className="w-4 h-4" /> No scans yet.</p>
    ) : (
      <ul className="space-y-2">
        {scans.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pearl-dark border border-pearl-border">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{s.passengerName}</p>
              <p className="text-[11px] text-pearl-placeholder truncate">{s.nationality} · {new Date(s.at).toLocaleString()}</p>
            </div>
            {s.decision === 'approved' ? <Pill tone="success"><ShieldCheck className="w-3 h-3" /> Approved</Pill> : <Pill tone="danger"><XCircle className="w-3 h-3" /> Flagged</Pill>}
          </li>
        ))}
      </ul>
    )}
  </>
);
