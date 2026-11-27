import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Copy, Check, RefreshCw, ShieldAlert, XCircle, MinusCircle, Ban, WifiOff } from 'lucide-react';
import type { ChecklistItem, PassengerProfile } from '../types';
import { ApiRequestError, ApiUnavailableError } from '../utils/apiClient';
import { issuePass, revokePass, type IssuedPass } from '../utils/api';
import { kvDel, kvGet, kvSet } from '../offline/kv';
import { Button, Pill } from './ui';

const DOCS = ['Passport', 'Visa / entry', 'Yellow fever', 'Return ticket', 'Accommodation', 'Insurance'];
const STATUS_LABEL: Record<string, string> = { c: 'Complete', m: 'Missing', e: 'Expired', n: 'N/A' };

interface Props {
  profile: PassengerProfile;
  checklist: ChecklistItem[];
  readinessScore: number;
  isOfflineMode: boolean;
  userKey: string;
  hasServerSession: boolean;
}

interface StoredPass extends IssuedPass { issuedLocallyAt: string }

/** Reads only the display fields from the token. Authenticity is checked by the server when an officer scans it. */
function claimsOf(token: string): { exp: number; sc: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export const QRSummaryCard: React.FC<Props> = ({ profile, checklist, readinessScore, isOfflineMode, userKey, hasServerSession }) => {
  const cacheKey = `qr-pass:${userKey}`;
  const [pass, setPass] = useState<StoredPass | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { void kvGet<StoredPass>(cacheKey).then((p) => p && setPass(p)); }, [cacheKey]);

  const expired = useMemo(() => (pass ? new Date(pass.expiresAt).getTime() < Date.now() : false), [pass]);
  const outOfDate = Boolean(pass) && pass!.score !== readinessScore;

  const generate = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const fresh = await issuePass(
        {
          nationality: profile.nationality,
          purpose: profile.journey?.travelPurpose || profile.travelPurpose,
          travelMode: profile.journey?.travelMode,
          borderPoint: profile.journey?.intendedBorderPoint || profile.destination,
          destination: `${profile.journey?.destinationCountry ?? ''} ${profile.destination ?? ''}`.trim(),
          travellerType: profile.travellerType,
        },
        checklist.map((i) => ({ code: i.id, status: i.status }))
      );
      const stored = { ...fresh, issuedLocallyAt: new Date().toISOString() };
      await kvSet(cacheKey, stored);
      setPass(stored);
    } catch (e) {
      setError(
        e instanceof ApiUnavailableError
          ? 'The server cannot be reached. Connect to the internet to create a pass. A saved pass stays available below.'
          : e instanceof ApiRequestError && e.statusCode === 401
            ? 'Your session has ended. Sign in again to create a pass.'
            : e instanceof Error ? e.message : 'The pass could not be created.'
      );
    } finally {
      setBusy(false);
    }
  }, [profile, checklist, cacheKey]);

  const revoke = async () => {
    setBusy(true);
    setError('');
    try {
      await revokePass();
      await kvDel(cacheKey);
      setPass(null);
    } catch (e) {
      setError(e instanceof ApiUnavailableError ? 'Connect to the internet to revoke your pass.' : e instanceof Error ? e.message : 'Could not revoke the pass.');
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    if (!pass) return;
    void navigator.clipboard?.writeText(pass.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const showQr = pass && !expired;

  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-5 sm:p-7 border border-pearl-border">
      <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-pearl-border gap-3">
        <h2 className="text-xl font-bold text-pearl-text font-heading">QR Pass</h2>
        {pass && <Pill tone={expired ? 'danger' : 'success'}>{expired ? 'Expired' : 'Signed pass'}</Pill>}
      </div>

      {!hasServerSession && (
        <div role="status" className="mb-4 p-3 rounded-xl bg-pearl-surface border border-pearl-border text-xs text-pearl-text-secondary flex gap-2">
          <Ban className="w-4 h-4 shrink-0 mt-0.5 text-pearl-accent" />
          <span>A verifiable QR pass is created by the Pearl Travel server. Sign in with a server account (created while online) to generate one. No unsigned code is shown.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-5 flex flex-col items-center p-5 rounded-xl bg-pearl-surface border border-pearl-border">
          {showQr ? (
            <>
              <div className="p-3 bg-white rounded-xl border border-pearl-border">
                <QRCodeSVG value={pass.token} size={196} level="M" marginSize={2} className="w-44 h-44 sm:w-48 sm:h-48" />
              </div>
              <p className="text-[11px] font-mono text-pearl-text-secondary mt-3 font-semibold">{pass.referenceCode}</p>
              <p className="text-[11px] text-pearl-placeholder">Valid until {new Date(pass.expiresAt).toLocaleString()}</p>
              {isOfflineMode && <p className="mt-1 text-[11px] text-pearl-accent flex items-center gap-1"><WifiOff className="w-3 h-3" /> Saved pass, works offline</p>}
            </>
          ) : (
            <div className="py-10 text-center text-xs text-pearl-placeholder">
              {expired ? 'Your pass has expired. Create a new one.' : 'No pass yet.'}
            </div>
          )}
        </div>

        <div className="md:col-span-7 space-y-4">
          {pass && !expired && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-pearl-placeholder">Shown to the officer</span>
                <span className="text-xs font-bold text-pearl-accent">{pass.score}% · {pass.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DOCS.map((label, i) => {
                  const code = pass.documentCodes[i] ?? 'n';
                  return (
                    <div key={label} className="p-2.5 rounded-xl bg-pearl-surface border border-pearl-border">
                      <span className="text-[10px] font-bold text-pearl-placeholder block uppercase">{label}</span>
                      <span className="font-bold text-pearl-text flex items-center gap-1 mt-0.5 text-xs">
                        {code === 'c' ? <CheckCircle2 className="w-3.5 h-3.5 text-pearl-success-light" /> : code === 'n' ? <MinusCircle className="w-3.5 h-3.5 text-pearl-placeholder" /> : <XCircle className="w-3.5 h-3.5 text-pearl-danger-light" />}
                        {STATUS_LABEL[code]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-pearl-placeholder">The code holds only a random reference, your score and these six statuses. It has no name, passport number or contact details.</p>
              {outOfDate && <p role="status" className="text-[11px] text-pearl-accent">Your checklist has changed since this pass was created. Create a new pass to update it.</p>}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button full={false} onClick={() => void generate()} disabled={busy || isOfflineMode || !hasServerSession}>
              <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> {pass && !expired ? 'Create new pass' : 'Create pass'}
            </Button>
            {pass && !expired && (
              <>
                <Button full={false} variant="outline" onClick={copy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy pass code'}</Button>
                <Button full={false} variant="danger" onClick={() => void revoke()} disabled={busy || isOfflineMode}>Revoke</Button>
              </>
            )}
          </div>
          {isOfflineMode && <p className="text-[11px] text-pearl-placeholder">Creating or revoking a pass needs an internet connection.</p>}
          {error && <p role="alert" className="text-xs text-pearl-danger-light">{error}</p>}
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl bg-[#FFF8DB] border border-pearl-gold/40 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-pearl-navy shrink-0 mt-0.5" />
        <p className="text-[11px] text-pearl-navy font-medium">Advisory preparation summary only. It is not an identity check, an immigration approval or a travel permit. Officers still check your documents.</p>
      </div>
    </div>
  );
};
