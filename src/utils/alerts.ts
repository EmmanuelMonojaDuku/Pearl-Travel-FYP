import type { ChecklistItem } from '../types';
import type { PortalTab } from '../components/dashboard/navTypes';
import { getContent } from './opsStore';

export interface PortalAlert {
  id: string;
  title: string;
  detail: string;
  severity: 'critical' | 'warning' | 'info';
  targetTab: PortalTab;
}

/** Alerts derived from real readiness, sync state and content published by administrators. */
export function buildAlerts(input: {
  isProfileComplete: boolean;
  missingItems: ChecklistItem[];
  missingMandatoryCount: number;
  isOfflineMode: boolean;
  includeContentUpdates?: boolean;
}): PortalAlert[] {
  const { isProfileComplete, missingItems, missingMandatoryCount, isOfflineMode, includeContentUpdates } = input;
  const alerts: PortalAlert[] = [];

  if (!isProfileComplete) {
    alerts.push({ id: 'alert-profile', title: 'Traveller Profile Incomplete', detail: 'Complete passport, contact, and emergency contact details.', severity: 'warning', targetTab: 'profile' });
  }
  if (missingMandatoryCount > 0) {
    alerts.push({
      id: 'alert-mandatory',
      title: `${missingMandatoryCount} Mandatory Document${missingMandatoryCount > 1 ? 's' : ''} Needed`,
      detail: missingItems.filter((i) => i.mandatory).slice(0, 2).map((i) => i.title).join(', '),
      severity: 'critical',
      targetTab: 'checklist',
    });
  } else if (missingItems.length > 0) {
    alerts.push({
      id: 'alert-optional',
      title: `${missingItems.length} Recommended Item${missingItems.length > 1 ? 's' : ''} Pending`,
      detail: missingItems.slice(0, 2).map((i) => i.title).join(', '),
      severity: 'info',
      targetTab: 'checklist',
    });
  }
  if (isOfflineMode) {
    alerts.push({ id: 'alert-offline', title: 'Offline Border Cache Active', detail: 'Requirements, checklist, and QR pass are available offline.', severity: 'info', targetTab: 'offline' });
  }
  if (includeContentUpdates) {
    getContent()
      .filter((c) => c.status === 'published')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
      .forEach((c) =>
        alerts.push({
          id: `content-${c.id}`,
          title: c.module === 'faqs' ? 'New FAQ Available' : c.module === 'requirements' ? 'Requirement Update' : 'Guidance Updated',
          detail: c.title,
          severity: 'info',
          targetTab: c.module === 'faqs' ? 'ai-guidance' : c.module === 'requirements' ? 'guidance' : 'border-guide',
        })
      );
  }
  return alerts;
}
