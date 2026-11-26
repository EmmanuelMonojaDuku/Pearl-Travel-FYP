import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { motion } from 'motion/react';

interface OfflineStatusBannerProps {
  isOfflineMode?: boolean;
  isOffline?: boolean;
  onToggleOffline?: () => void;
  onToggleSimulate?: () => void;
  onSyncNow: () => void;
  lastSyncedTime: string;
  isSyncing: boolean;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({
  isOfflineMode: propOfflineMode,
  isOffline: propOffline,
  onToggleOffline: propToggleOffline,
  onToggleSimulate: propToggleSimulate,
  onSyncNow,
  lastSyncedTime,
  isSyncing,
}) => {
  const isOffline = propOfflineMode ?? propOffline ?? false;
  const handleToggle = propToggleOffline || propToggleSimulate || (() => {});
  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-3.5 sm:p-4 mb-5 border border-pearl-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            isOffline
              ? 'bg-pearl-gold/15 text-pearl-gold-light'
              : 'bg-pearl-success/15 text-pearl-success-light'
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-4 h-4" />
          ) : (
            <Wifi className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-pearl-text">
              {isOffline ? 'Offline Border Mode Active' : 'Live Connected Mode'}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isOffline ? 'text-pearl-gold-light' : 'text-pearl-success-light'
              }`}
            >
              • {isOffline ? 'Cached Locally' : 'Synchronized'}
            </span>
          </div>
          <p className="text-pearl-text-secondary text-[11px] mt-0.5 tabular-nums">
            {isOffline
              ? 'All requirements, checklist, and QR pass remain 100% accessible offline.'
              : `Automatic backup active • Last synchronized: ${lastSyncedTime}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          type="button"
          id="toggle-offline-simulation"
          onClick={handleToggle}
          className="px-3 py-1.5 rounded-lg font-semibold text-xs bg-pearl-surface hover:bg-pearl-input border border-pearl-border text-pearl-text transition-colors flex items-center gap-1.5 cursor-pointer"
          title={isOffline ? 'Switch back to online mode' : 'Simulate remote border with no internet'}
        >
          {isOffline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-pearl-success-light" />
              <span>Go Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-pearl-gold-light" />
              <span>Simulate Offline</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-sync-offline-cache"
          onClick={onSyncNow}
          disabled={isSyncing}
          className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-pearl-navy text-pearl-text hover:bg-pearl-dark transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-pearl-gold ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </div>
  );
};
