import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Bell,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  User,
  Settings,
  X,
} from 'lucide-react';
import { PassengerProfile, ChecklistItem } from '../../types';
import { PortalTab } from './navTypes';

interface DashboardHeaderProps {
  activeTab: PortalTab;
  profile: PassengerProfile;
  isOfflineMode: boolean;
  isSyncing: boolean;
  lastSyncedTime: string;
  missingItems: ChecklistItem[];
  missingMandatoryCount: number;
  isProfileComplete: boolean;
  onToggleMobileDrawer: () => void;
  onToggleOffline: () => void;
  onSyncNow: () => void;
  onSelectTab: (tab: PortalTab) => void;
  onOpenSettings: () => void;
}

const TAB_TITLES: Record<PortalTab, string> = {
  overview: 'Traveller Overview',
  profile: 'My Profile',
  journey: 'My Journey',
  guidance: 'Travel Requirements',
  checklist: 'Document Checklist',
  readiness: 'Readiness Assessment',
  'ai-guidance': 'Travel Assistant',
  'border-guide': 'Malaba OSBP Border Guide',
  multimedia: 'Multimedia Guidance (4K)',
  qr: 'QR Readiness Summary',
  audit: 'Review & Audit',
  'download-pdf': 'Export Readiness Report',
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  profile,
  isOfflineMode,
  isSyncing,
  lastSyncedTime,
  missingItems,
  missingMandatoryCount,
  isProfileComplete,
  onToggleMobileDrawer,
  onToggleOffline,
  onSyncNow,
  onSelectTab,
  onOpenSettings,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Derive genuine alerts from real readiness and sync state
  const alerts: {
    id: string;
    title: string;
    detail: string;
    severity: 'critical' | 'warning' | 'info';
    targetTab: PortalTab;
  }[] = [];

  if (!isProfileComplete) {
    alerts.push({
      id: 'alert-profile',
      title: 'Traveller Profile Incomplete',
      detail: 'Complete passport, contact, and emergency contact details.',
      severity: 'warning',
      targetTab: 'profile',
    });
  }

  if (missingMandatoryCount > 0) {
    alerts.push({
      id: 'alert-mandatory',
      title: `${missingMandatoryCount} Mandatory Document${missingMandatoryCount > 1 ? 's' : ''} Needed`,
      detail: missingItems
        .filter((i) => i.mandatory)
        .slice(0, 2)
        .map((i) => i.title)
        .join(', '),
      severity: 'critical',
      targetTab: 'checklist',
    });
  } else if (missingItems.length > 0) {
    alerts.push({
      id: 'alert-optional',
      title: `${missingItems.length} Recommended Item${missingItems.length > 1 ? 's' : ''} Pending`,
      detail: missingItems
        .slice(0, 2)
        .map((i) => i.title)
        .join(', '),
      severity: 'info',
      targetTab: 'checklist',
    });
  }

  if (isOfflineMode) {
    alerts.push({
      id: 'alert-offline',
      title: 'Offline Border Cache Active',
      detail: 'Requirements, checklist, and QR pass are available offline.',
      severity: 'info',
      targetTab: 'qr',
    });
  }

  const firstName = profile.firstName || profile.fullName.split(' ')[0] || 'Traveller';
  const initials = (profile.fullName || 'PT')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 w-full bg-pearl-navy border-b border-pearl-dark px-3 sm:px-6 flex items-center justify-between gap-2 text-pearl-text">
      {/* Left: Drawer Trigger + Page Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          aria-label="Open navigation menu"
          className="lg:hidden min-h-[44px] min-w-[44px] -ml-1.5 flex items-center justify-center rounded-xl text-pearl-text-secondary hover:text-pearl-text hover:bg-pearl-dark transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <p className="hidden sm:block text-[10px] font-semibold uppercase tracking-wider text-pearl-placeholder">
            Malaba OSBP Readiness Portal
          </p>
          <h1 className="font-heading text-sm sm:text-base font-bold text-pearl-text truncate">
            {TAB_TITLES[activeTab]}
          </h1>
        </div>
      </div>

      {/* Right: Sync / Online Status + Notifications + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Offline / Online Mode Switcher */}
        <button
          type="button"
          id="toggle-offline-simulation"
          onClick={onToggleOffline}
          title={isOfflineMode ? 'Switch back to Live Online mode' : 'Simulate Offline Border mode'}
          className={`min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isOfflineMode
              ? 'bg-pearl-gold/20 border-pearl-gold/50 text-pearl-gold-light'
              : 'bg-pearl-dark border-pearl-slate text-pearl-text-secondary hover:text-pearl-text'
          }`}
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-pearl-gold-light" />
              <span className="hidden sm:inline">Offline Cache</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-pearl-success-light" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* Last Sync & Sync Now */}
        <button
          type="button"
          id="btn-sync-offline-cache"
          onClick={onSyncNow}
          disabled={isSyncing}
          title={`Last synced: ${lastSyncedTime}. Click to sync now.`}
          className="hidden md:flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg bg-pearl-dark border border-pearl-slate text-xs font-medium text-pearl-text-secondary hover:text-pearl-text hover:border-pearl-border transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-pearl-gold ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="tabular-nums text-[11px]">
            {isSyncing ? 'Syncing...' : `Synced ${lastSyncedTime}`}
          </span>
        </button>

        {/* Notifications Button & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notifications and readiness alerts"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-xl bg-pearl-dark border border-pearl-slate text-pearl-text-secondary hover:text-pearl-text transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pearl-gold" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-pearl-surface border border-pearl-border rounded-2xl shadow-xl p-3.5 text-pearl-text z-50">
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-pearl-border">
                <span className="text-xs font-bold uppercase tracking-wider text-pearl-text">
                  Readiness Alerts ({alerts.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close alerts"
                  className="p-1 rounded-lg text-pearl-placeholder hover:text-pearl-text cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {alerts.length === 0 ? (
                <div className="py-4 text-center space-y-1">
                  <CheckCircle2 className="w-5 h-5 text-pearl-success-light mx-auto" />
                  <p className="text-xs font-semibold text-pearl-text">All requirements up to date</p>
                  <p className="text-[11px] text-pearl-placeholder">Last synchronized: {lastSyncedTime}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(alert.targetTab);
                        setShowNotifications(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-pearl-dark hover:bg-pearl-input border border-pearl-border transition-colors cursor-pointer flex items-start gap-2.5"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          alert.severity === 'critical'
                            ? 'text-pearl-danger-light'
                            : alert.severity === 'warning'
                            ? 'text-pearl-gold-light'
                            : 'text-pearl-text'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-pearl-text">{alert.title}</p>
                        <p className="text-[11px] text-pearl-text-secondary line-clamp-2 mt-0.5">
                          {alert.detail}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar & Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="min-h-[40px] pl-1.5 pr-2.5 py-1 rounded-xl bg-pearl-dark border border-pearl-slate hover:border-pearl-border flex items-center gap-2 transition-colors cursor-pointer"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover border border-pearl-gold"
              />
            ) : (
              <span className="w-7 h-7 rounded-lg bg-pearl-gold text-pearl-text font-bold text-xs flex items-center justify-center">
                {initials || 'PT'}
              </span>
            )}
            <span className="hidden sm:inline text-xs font-semibold text-pearl-text max-w-[110px] truncate">
              {firstName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-pearl-placeholder hidden sm:inline" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-pearl-surface border border-pearl-border rounded-2xl shadow-xl p-2 text-pearl-text z-50">
              <div className="px-3 py-2 border-b border-pearl-border mb-1">
                <p className="text-xs font-bold text-pearl-text truncate">{profile.fullName}</p>
                <p className="text-[11px] text-pearl-placeholder truncate">{profile.nationality}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('profile');
                  setShowProfileMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-pearl-text hover:bg-pearl-dark flex items-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-pearl-text-secondary" />
                <span>My Traveller Profile</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setShowProfileMenu(false);
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-pearl-text hover:bg-pearl-dark flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-pearl-text-secondary" />
                <span>Account Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
