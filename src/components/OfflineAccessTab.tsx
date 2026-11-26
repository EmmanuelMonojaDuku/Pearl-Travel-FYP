import React from 'react';
import { CheckCircle2, WifiOff, XCircle, Wifi } from 'lucide-react';
import { Button, Card, Pill } from './ui';

interface Props {
  isOfflineMode: boolean;
  isSyncing: boolean;
  lastSyncedTime: string;
  onRetry: () => void;
  onToggleOffline: () => void;
  onBack: () => void;
}

const AVAILABLE = ['Saved requirements', 'Saved checklist', 'Saved passenger profile', 'Saved border guidance', 'QR readiness summary'];
const UNAVAILABLE = ['Latest requirement updates', 'Live AI retrieval', 'Real-time verification'];

/** Offline Access screen (wireframe: "You are offline" + data summary + Go to Offline Mode / Retry). */
export const OfflineAccessTab: React.FC<Props> = ({ isOfflineMode, isSyncing, lastSyncedTime, onRetry, onToggleOffline, onBack }) => (
  <div className="max-w-md mx-auto">
    <div className="text-center mb-5">
      <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center border ${isOfflineMode ? 'bg-pearl-danger/10 border-pearl-danger/40 text-pearl-danger-light' : 'bg-pearl-success/10 border-pearl-success/40 text-pearl-success-light'}`}>
        {isOfflineMode ? <WifiOff className="w-7 h-7" /> : <Wifi className="w-7 h-7" />}
      </div>
      <h2 className="text-xl font-bold font-heading">{isOfflineMode ? 'You are offline' : 'You are online'}</h2>
      <p className="text-xs text-pearl-text-secondary mt-1">
        {isOfflineMode ? 'Some features are limited. You can still access your saved requirements, checklist and guides.' : 'Live sync is active. Your data is cached for use at the border.'}
      </p>
    </div>

    <Card className="space-y-4 mb-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-pearl-gold">Offline data summary</h3>
        <Pill tone={isOfflineMode ? 'danger' : 'success'}>{isOfflineMode ? 'No connection' : 'Connected'}</Pill>
      </div>
      <p className="text-[11px] text-pearl-placeholder">Last synchronized: {lastSyncedTime}</p>
      <div>
        <p className="text-[11px] font-bold text-pearl-success-light mb-1.5">Available offline</p>
        <ul className="space-y-1">{AVAILABLE.map((t) => <li key={t} className="flex items-center gap-2 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-pearl-success-light" />{t}</li>)}</ul>
      </div>
      <div>
        <p className="text-[11px] font-bold text-pearl-danger-light mb-1.5">Unavailable offline</p>
        <ul className="space-y-1">{UNAVAILABLE.map((t) => <li key={t} className="flex items-center gap-2 text-xs text-pearl-text-secondary"><XCircle className="w-3.5 h-3.5 text-pearl-danger-light" />{t}</li>)}</ul>
      </div>
      <p className="text-[10px] text-pearl-placeholder">Saved information may not reflect the latest official requirements.</p>
    </Card>

    <div className="space-y-3">
      <Button onClick={onBack}>Go to Offline Mode</Button>
      <Button variant="outline" onClick={onRetry} disabled={isSyncing}>{isSyncing ? 'Retrying…' : 'Retry Connection'}</Button>
      <button type="button" onClick={onToggleOffline} className="w-full text-center text-[11px] text-pearl-placeholder hover:text-pearl-text cursor-pointer">
        {isOfflineMode ? 'Simulate reconnecting' : 'Simulate offline mode (testing)'}
      </button>
    </div>
  </div>
);
