import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bell, Info, ShieldAlert } from 'lucide-react';
import type { ChecklistItem } from '../types';
import type { PortalTab } from './dashboard/navTypes';
import { buildAlerts, type PortalAlert } from '../utils/alerts';
import { Button, Card } from './ui';

const KEY = 'pearl_dismissed_alerts_v1';
const readDismissed = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
};

interface Props {
  isProfileComplete: boolean;
  missingItems: ChecklistItem[];
  missingMandatoryCount: number;
  isOfflineMode: boolean;
  onSelectTab: (tab: PortalTab) => void;
}

/** Notifications screen (wireframe: list with Clear All). */
export const NotificationsTab: React.FC<Props> = ({ onSelectTab, ...state }) => {
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);
  const alerts = useMemo(() => buildAlerts({ ...state, includeContentUpdates: true }), [state.isProfileComplete, state.missingItems, state.missingMandatoryCount, state.isOfflineMode]);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));

  const clear = () => {
    const next = alerts.map((a) => a.id);
    setDismissed(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };
  const icon = (a: PortalAlert) =>
    a.severity === 'critical' ? <ShieldAlert className="w-4 h-4 text-pearl-danger-light" /> : a.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-pearl-accent" /> : <Info className="w-4 h-4 text-pearl-info" />;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-heading">Notifications</h2>
        {visible.length > 0 && (
          <button type="button" onClick={clear} className="px-3 h-8 rounded-lg bg-pearl-gold text-pearl-navy text-[11px] font-bold cursor-pointer hover:bg-pearl-gold-light">Clear All</button>
        )}
      </div>
      {visible.length === 0 ? (
        <Card className="text-center py-10">
          <Bell className="w-8 h-8 mx-auto text-pearl-placeholder mb-2" />
          <p className="text-sm font-semibold">You&apos;re all caught up</p>
          <p className="text-xs text-pearl-placeholder mt-1">New alerts appear here when requirements or documents change.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {visible.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => onSelectTab(a.targetTab)} className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-pearl-dark border border-pearl-border hover:border-pearl-gold text-left cursor-pointer">
                <span className="w-9 h-9 rounded-lg bg-pearl-surface flex items-center justify-center shrink-0">{icon(a)}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{a.title}</span>
                  {a.detail && <span className="block text-[11px] text-pearl-placeholder mt-0.5">{a.detail}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
