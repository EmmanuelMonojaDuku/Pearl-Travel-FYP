/**
 * Single source of truth for brand, contact and link data used by the global footer and legal pages.
 * To add a social profile, append { label, href } to `social`; the footer section appears automatically.
 */
export const SITE = {
  name: 'Pearl Travel',
  tagline: 'Plan · Prepare · Cross',
  strapline: 'Your smart border companion',
  blurb: 'Border preparation for travellers to Uganda.',
  supportEmail: 'support@pearltravel.ug',
  region: 'Malaba, Uganda – Kenya border',
  /** Only add profiles that really exist. Empty = the Social section is not rendered. */
  social: [] as { label: string; href: string }[],
  /** Official public sources. */
  resources: [
    { label: 'Uganda eVisa Portal', href: 'https://visas.immigration.go.ug' },
    { label: 'Immigration (DCIC)', href: 'https://www.immigration.go.ug' },
    { label: 'Uganda Revenue Authority', href: 'https://www.ura.go.ug' },
    { label: 'Ministry of Health', href: 'https://www.health.go.ug' },
    { label: 'East African Community', href: 'https://www.eac.int' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#/legal/privacy' },
    { label: 'Terms of Use', href: '#/legal/terms' },
    { label: 'Disclaimer', href: '#/legal/disclaimer' },
  ],
} as const;

export type LegalSlug = 'privacy' | 'terms' | 'disclaimer';

export function getLegalSlugFromHash(hash: string): LegalSlug | null {
  const m = hash.match(/^#\/legal\/(privacy|terms|disclaimer)\/?$/);
  return (m?.[1] as LegalSlug) ?? null;
}
