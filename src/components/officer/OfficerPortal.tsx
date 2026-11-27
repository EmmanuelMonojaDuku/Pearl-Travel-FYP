import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CheckCircle2, Clock, Flag, History as HistoryIcon, Home, ImageUp, LogOut, MinusCircle, QrCode, ShieldAlert, ShieldCheck, User, XCircle } from 'lucide-react';
import type { UserProfile } from '../../types';
import { ApiRequestError, ApiUnavailableError } from '../../utils/apiClient';
import { decidePass, verificationHistory, verifyPass, type VerificationRecord, type VerifyResult } from '../../utils/api';
import { AppBar, Button, Card, Pill, ScreenHeader, SectionLabel } from '../ui';
import { Footer } from '../Footer';

type Tab = 'home' | 'scan' | 'history' | 'profile';

interface Props {
  currentUser: UserProfile;
  onLogout: () => void;
}

const DOCS = ['Passport', 'Visa / entry permit', 'Yellow Fever certificate', 'Return ticket', 'Accommodation / invitation', 'Travel insurance (optional)'];
const CODE: Record<string, { label: string; tone: 'success' | 'danger' | 'warning' | 'neutral' }> = {
  c: { label: 'Verified', tone: 'success' },
  m: { label: 'Missing', tone: 'warning' },
  e: { label: 'Expired', tone: 'danger' },
  n: { label: 'N/A', tone: 'neutral' },
};
const OUTCOME_TEXT: Record<string, string> = {
  expired: 'This pass has expired. Ask the traveller to create a new one.',
  revoked: 'This pass was revoked or replaced by a newer one.',
  invalid: 'This code is not a genuine Pearl Travel pass. Do not rely on it.',
};

type DetectorCtor = new (o: { formats: string[] }) => { detect: (v: CanvasImageSource) => Promise<{ rawValue: string }[]> };

function decodeFrame(source: HTMLVideoElement | HTMLImageElement, canvas: HTMLCanvasElement): string | null {
  const w = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const h = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  if (!w || !h) return null;
  const scale = Math.min(1, 800 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

const errorText = (e: unknown) =>
  e instanceof ApiUnavailableError
    ? 'The server cannot be reached. Verification needs a connection.'
    : e instanceof ApiRequestError && e.code === 'NO_BORDER_ASSIGNMENT'
      ? 'No border post is assigned to your account. Ask an administrator to assign one.'
      : e instanceof ApiRequestError && e.statusCode === 403
        ? 'Your account is not allowed to verify passes.'
        : e instanceof ApiRequestError && e.statusCode === 401
          ? 'Your session has ended. Sign in again.'
          : e instanceof Error ? e.message : 'Verification failed.';

/** Border officer app. All records live on the server; this screen keeps nothing in the browser. */
export const OfficerPortal: React.FC<Props> = ({ currentUser, onLogout }) => {
  const [tab, setTab] = useState<Tab>('home');
  const [history, setHistory] = useState<VerificationRecord[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    try { setHistory(await verificationHistory()); } catch (e) { setError(errorText(e)); }
  }, []);
  useEffect(() => { void loadHistory(); }, [loadHistory]);

  const verify = useCallback(async (token: string) => {
    setError('');
    try {
      setResult(await verifyPass(token.trim()));
      void loadHistory();
    } catch (e) {
      setError(errorText(e));
    }
  }, [loadHistory]);

  const decide = async (decision: 'approved' | 'flagged') => {
    if (!result?.verificationId) return;
    try {
      await decidePass(result.verificationId, decision);
      setResult(null);
      await loadHistory();
      setTab('history');
    } catch (e) {
      setError(errorText(e));
    }
  };

  const nav: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: QrCode },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-pearl-slate text-pearl-text flex flex-col">
      <AppBar role="Border Officer" name={currentUser.name} />
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md flex flex-col">
          <main className="flex-1 px-5 pt-6 pb-24">
            {error && <p role="alert" className="mb-3 p-3 rounded-xl bg-pearl-danger/10 border border-pearl-danger/40 text-xs text-pearl-danger-light">{error}</p>}
            {result ? (
              <Verification result={result} onBack={() => setResult(null)} onDecide={decide} />
            ) : tab === 'home' ? (
              <OfficerHome history={history} onScan={() => setTab('scan')} />
            ) : tab === 'scan' ? (
              <Scanner onToken={verify} />
            ) : tab === 'history' ? (
              <HistoryList history={history} />
            ) : (
              <Card className="space-y-4">
                <ScreenHeader title="Officer Profile" subtitle="Border Entry Clearance" />
                <p className="text-sm font-semibold">{currentUser.name}</p>
                <p className="text-xs text-pearl-placeholder -mt-3">{currentUser.email}</p>
                <Button variant="outline" onClick={onLogout}><LogOut className="w-4 h-4" /> Sign out</Button>
              </Card>
            )}
          </main>
          <Footer variant="compact" quickLinks={[]} className="mb-16" />
          <nav aria-label="Officer navigation" className="fixed bottom-0 inset-x-0 z-40 flex justify-center bg-pearl-navy border-t border-pearl-border">
            <div className="w-full max-w-md grid grid-cols-4 h-16">
              {nav.map(({ id, label, icon: Icon }) => {
                const active = tab === id && !result;
                return (
                  <button key={id} type="button" aria-current={active ? 'page' : undefined} onClick={() => { setResult(null); setError(''); setTab(id); }}
                    className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold cursor-pointer ${active ? 'text-pearl-gold' : 'text-pearl-placeholder hover:text-pearl-text'}`}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

const OfficerHome: React.FC<{ history: VerificationRecord[]; onScan: () => void }> = ({ history, onScan }) => {
  const today = new Date().toDateString();
  const todays = history.filter((h) => new Date(h.verifiedAt).toDateString() === today);
  const stat = (label: string, n: number) => (
    <Card className="text-center py-3"><p className="text-2xl font-bold font-heading tabular-nums">{n}</p><p className="text-[10px] text-pearl-placeholder uppercase tracking-wide">{label}</p></Card>
  );
  return (
    <>
      <ScreenHeader title="Border Officer" subtitle="Verification desk" right={<Pill tone="success">● Online</Pill>} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stat('Scanned today', todays.length)}
        {stat('Approved', todays.filter((h) => h.decision === 'approved').length)}
        {stat('Flagged', todays.filter((h) => h.decision === 'flagged').length)}
      </div>
      <Button onClick={onScan}><QrCode className="w-4 h-4" /> Scan Passenger QR</Button>
      <div className="mt-6">
        <SectionLabel>Recent scans</SectionLabel>
        <HistoryList history={history.slice(0, 4)} compact />
      </div>
    </>
  );
};

const Scanner: React.FC<{ onToken: (token: string) => void }> = ({ onToken }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'on'>('idle');
  const [cameraError, setCameraError] = useState('');
  const [message, setMessage] = useState('');
  const [manual, setManual] = useState('');

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraState('idle');
  };
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const accept = (text: string): boolean => {
    if (text.trim().startsWith('PT1.')) { onToken(text.trim()); return true; }
    return false;
  };

  const startCamera = async () => {
    setCameraError('');
    setMessage('');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('The camera only works on a secure page (https:// or http://localhost). Use "Upload QR image" or paste the pass code below.');
      return;
    }
    setCameraState('starting');
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'OverconstrainedError' || e.name === 'NotFoundError')) stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        else throw e;
      }
      streamRef.current = stream;
      setCameraState('on');
    } catch (e) {
      setCameraState('idle');
      const name = e instanceof DOMException ? e.name : '';
      setCameraError(name === 'NotAllowedError' || name === 'SecurityError' ? 'Camera permission was blocked. Allow camera access in the address bar, then try again.' : name === 'NotFoundError' ? 'No camera was found on this device. Use "Upload QR image" or paste the pass code.' : name === 'NotReadableError' ? 'The camera is being used by another app or tab. Close it and try again.' : 'Could not start the camera. Use "Upload QR image" or paste the pass code.');
    }
  };

  useEffect(() => {
    if (cameraState !== 'on') return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    canvasRef.current ??= document.createElement('canvas');
    const Detector = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
    const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
    let cancelled = false;
    let lastUnknown = '';
    const tick = async () => {
      if (cancelled) return;
      if (video.readyState >= 2) {
        try {
          let text: string | null = null;
          if (detector) text = (await detector.detect(video))[0]?.rawValue ?? null;
          if (!text) text = decodeFrame(video, canvasRef.current!);
          if (text) {
            if (accept(text)) { stop(); return; }
            if (text !== lastUnknown) { lastUnknown = text; setMessage('That QR code is not a Pearl Travel pass. Keep scanning.'); }
          }
        } catch { /* keep scanning */ }
      }
      setTimeout(tick, 200);
    };
    void tick();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraState]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const text = decodeFrame(img, document.createElement('canvas'));
      URL.revokeObjectURL(url);
      if (!text) setMessage('No QR code could be read from that image. Try a clearer, closer photo.');
      else if (!accept(text)) setMessage('That QR code is not a Pearl Travel pass.');
    };
    img.onerror = () => { URL.revokeObjectURL(url); setMessage('That file could not be opened as an image.'); };
    img.src = url;
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!accept(manual)) setMessage('That is not a Pearl Travel pass code. It starts with PT1.');
  };

  return (
    <>
      <ScreenHeader title="Scan Passenger QR" subtitle="Quick verification" />
      <div className="relative aspect-square rounded-2xl border-2 border-pearl-gold bg-pearl-navy overflow-hidden flex items-center justify-center">
        {cameraState === 'on' ? (
          <>
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover" aria-label="Camera preview" />
            <div aria-hidden="true" className="absolute inset-[18%] border-2 border-pearl-gold/80 rounded-2xl pointer-events-none" />
            <button type="button" onClick={stop} className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 h-9 rounded-full bg-pearl-navy/80 border border-pearl-border text-xs font-bold cursor-pointer">Stop camera</button>
          </>
        ) : (
          <div className="text-center px-6">
            <QrCode className="w-14 h-14 mx-auto text-pearl-gold mb-3" />
            <Button full={false} className="mx-auto" disabled={cameraState === 'starting'} onClick={() => void startCamera()}>
              <Camera className="w-4 h-4" /> {cameraState === 'starting' ? 'Opening camera…' : 'Start camera'}
            </Button>
            {cameraError && <p role="alert" className="mt-3 text-xs text-pearl-danger-light">{cameraError}</p>}
          </div>
        )}
      </div>
      {cameraState === 'on' && <p className="mt-2 text-center text-[11px] text-pearl-placeholder">Point the camera at the passenger&apos;s QR code. It scans automatically.</p>}

      <label className="mt-4 block">
        <span className="sr-only">Upload QR image</span>
        <input type="file" accept="image/*" onChange={onFile} className="sr-only" id="qr-file" />
        <span className="w-full min-h-[44px] rounded-xl border border-pearl-border text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-pearl-surface">
          <ImageUp className="w-4 h-4" /> Upload QR image
        </span>
      </label>

      <form onSubmit={submitManual} className="mt-4 space-y-3">
        <label htmlFor="manual-code" className="sr-only">Pass code</label>
        <textarea id="manual-code" rows={2} value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or paste the pass code (starts with PT1.)"
          className="w-full rounded-xl bg-pearl-input border border-pearl-border p-3 text-sm font-mono placeholder:text-pearl-placeholder focus:outline-none focus:border-pearl-gold" />
        <Button variant="outline" type="submit">Verify pass code</Button>
      </form>
      {message && <p role="alert" className="mt-3 text-xs text-pearl-danger-light">{message}</p>}
    </>
  );
};

const Verification: React.FC<{ result: VerifyResult; onBack: () => void; onDecide: (d: 'approved' | 'flagged') => void }> = ({ result, onBack, onDecide }) => {
  const ok = result.outcome === 'verified';
  const tone = (result.score ?? 0) >= 80 ? 'success' : (result.score ?? 0) >= 50 ? 'warning' : 'danger';
  return (
    <>
      <ScreenHeader title="Pass Verification" subtitle="Readiness summary only" onBack={onBack} />
      <div role="status" className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 ${ok ? 'bg-pearl-success/10 border-pearl-success/40' : 'bg-pearl-danger/10 border-pearl-danger/40'}`}>
        {ok ? <ShieldCheck className="w-5 h-5 text-pearl-success-light shrink-0" /> : <ShieldAlert className="w-5 h-5 text-pearl-danger-light shrink-0" />}
        <div>
          <p className="text-sm font-bold">{ok ? 'Genuine pass, signature verified' : result.outcome === 'invalid' ? 'Not a valid pass' : result.outcome === 'expired' ? 'Pass expired' : 'Pass revoked'}</p>
          {!ok && <p className="text-xs text-pearl-text-secondary mt-0.5">{OUTCOME_TEXT[result.outcome]}</p>}
        </div>
      </div>
      {result.referenceCode && (
        <>
          <Card className="flex items-center justify-between mb-4">
            <div><p className="text-[10px] uppercase text-pearl-placeholder">Reference</p><p className="font-mono text-sm font-bold">{result.referenceCode}</p></div>
            <div className="text-right"><p className="text-[10px] uppercase text-pearl-placeholder">Readiness</p><Pill tone={tone}>{result.score}% · {result.status}</Pill></div>
          </Card>
          <SectionLabel>Declared documents</SectionLabel>
          <ul className="space-y-2 mb-4">
            {DOCS.map((label, i) => {
              const c = CODE[result.documentCodes?.[i] ?? 'n']!;
              return (
                <li key={label} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pearl-dark border border-pearl-border">
                  <p className="text-sm font-semibold">{label}</p>
                  <Pill tone={c.tone}>{c.label}</Pill>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="text-[11px] text-pearl-placeholder mb-4">{result.advisory} The traveller&apos;s identity is not part of this code: check their passport in the usual way.</p>
      {ok ? (
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => onDecide('approved')}><CheckCircle2 className="w-4 h-4" /> Approve</Button>
          <Button variant="danger" onClick={() => onDecide('flagged')}><Flag className="w-4 h-4" /> Flag</Button>
        </div>
      ) : (
        <Button variant="outline" onClick={onBack}>Back to scanner</Button>
      )}
    </>
  );
};

const HistoryList: React.FC<{ history: VerificationRecord[]; compact?: boolean }> = ({ history, compact }) => (
  <>
    {!compact && <ScreenHeader title="Scan History" subtitle="Your verifications" />}
    {history.length === 0 ? (
      <p className="text-sm text-pearl-placeholder flex items-center gap-2"><Clock className="w-4 h-4" /> No scans yet.</p>
    ) : (
      <ul className="space-y-2">
        {history.map((h) => (
          <li key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-pearl-dark border border-pearl-border">
            <div className="min-w-0">
              <p className="text-sm font-mono font-semibold truncate">{h.referenceCode}</p>
              <p className="text-[11px] text-pearl-placeholder truncate">{new Date(h.verifiedAt).toLocaleString()}{h.borderPost ? ` · ${h.borderPost}` : ''}</p>
            </div>
            {h.decision === 'approved' ? <Pill tone="success"><ShieldCheck className="w-3 h-3" /> Approved</Pill>
              : h.decision === 'flagged' ? <Pill tone="danger"><XCircle className="w-3 h-3" /> Flagged</Pill>
              : h.outcome === 'verified' ? <Pill tone="warning"><MinusCircle className="w-3 h-3" /> No decision</Pill>
              : <Pill tone="danger">{h.outcome}</Pill>}
          </li>
        ))}
      </ul>
    )}
  </>
);
