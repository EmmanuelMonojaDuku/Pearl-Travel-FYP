export type PortalTab =
  | 'overview'
  | 'profile'
  | 'journey'
  | 'guidance'
  | 'checklist'
  | 'readiness'
  | 'ai-guidance'
  | 'border-guide'
  | 'multimedia'
  | 'qr'
  | 'audit'
  | 'download-pdf'
  | 'alerts'
  | 'offline';

const PORTAL_TAB_ROUTES: Record<PortalTab, string> = {
  overview: 'dashboard',
  profile: 'profile',
  journey: 'journey',
  guidance: 'requirements',
  checklist: 'checklist',
  readiness: 'readiness',
  'ai-guidance': 'assistant',
  'border-guide': 'border-guide',
  multimedia: 'multimedia',
  qr: 'qr',
  audit: 'audit',
  'download-pdf': 'report',
  alerts: 'alerts',
  offline: 'offline',
};

const PORTAL_TAB_BY_ROUTE: Record<string, PortalTab> = {
  dashboard: 'overview',
  profile: 'profile',
  journey: 'journey',
  requirements: 'guidance',
  checklist: 'checklist',
  readiness: 'readiness',
  assistant: 'ai-guidance',
  'border-guide': 'border-guide',
  multimedia: 'multimedia',
  qr: 'qr',
  audit: 'audit',
  report: 'download-pdf',
  alerts: 'alerts',
  offline: 'offline',
};

export function getPortalTabFromHash(hash: string): PortalTab | null {
  const route = hash.match(/^#\/traveller\/([^/?#]+)/)?.[1];
  return route ? PORTAL_TAB_BY_ROUTE[route] || null : null;
}

export function getPortalHash(tab: PortalTab): string {
  return `#/traveller/${PORTAL_TAB_ROUTES[tab]}`;
}
