import React from 'react';
import { ExternalLink, Mail, MapPin } from 'lucide-react';
import { SITE } from '../config/site';

export interface FooterLink { label: string; href?: string; onClick?: () => void }

interface FooterProps {
  /** Page-specific shortcuts (in-app navigation). */
  quickLinks: FooterLink[];
  /** "full" has every section; "compact" is a single slim row for app-style screens. */
  variant?: 'full' | 'compact';
  className?: string;
}

const linkClass =
  'inline-block py-0.5 text-[13px] text-pearl-text-secondary hover:text-pearl-gold transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold rounded-sm';

const Heading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold mb-1">{children}</h2>
);

const QuickLink: React.FC<{ link: FooterLink }> = ({ link }) =>
  link.onClick ? (
    <button type="button" onClick={link.onClick} className={`${linkClass} cursor-pointer text-left`}>{link.label}</button>
  ) : (
    <a href={link.href} onClick={() => window.scrollTo({ top: 0 })} className={linkClass}>{link.label}</a>
  );

/** Reusable global footer. Content comes from src/config/site.ts. */
export const Footer: React.FC<FooterProps> = ({ quickLinks, variant = 'full', className = '' }) => {
  const year = new Date().getFullYear();

  if (variant === 'compact') {
    return (
      <footer className={`border-t border-pearl-border bg-pearl-navy px-5 py-4 text-center ${className}`}>
        <nav aria-label="Legal and privacy" className="flex flex-wrap items-center justify-center gap-x-4">
          {SITE.legal.map((l) => (
            <a key={l.href} href={l.href} className={linkClass}>{l.label}</a>
          ))}
          <a href={`mailto:${SITE.supportEmail}`} className={linkClass} aria-label={`Email support at ${SITE.supportEmail}`}>Contact</a>
        </nav>
        <p className="text-[11px] text-pearl-placeholder mt-1">© {year} {SITE.name}. All rights reserved.</p>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-pearl-border bg-pearl-navy text-pearl-text ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 pt-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr_1.2fr] gap-x-6 gap-y-4">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-3">
              <img src="/pearl-travel-logo.png" alt="" width={44} height={44} className="w-11 h-11 rounded-xl bg-white p-0.5 object-contain" />
              <div>
                <p className="font-heading font-extrabold text-base leading-tight">{SITE.name}</p>
                <p className="text-[11px] font-semibold text-pearl-gold">{SITE.tagline}</p>
              </div>
            </div>
            <p className="hidden lg:block mt-2 text-[13px] text-pearl-text-secondary max-w-xs">{SITE.blurb}</p>
          </div>

          <nav aria-labelledby="footer-quick">
            <Heading id="footer-quick">Quick Links</Heading>
            <ul>{quickLinks.map((l) => <li key={l.label}><QuickLink link={l} /></li>)}</ul>
          </nav>

          <nav aria-labelledby="footer-resources">
            <Heading id="footer-resources">Travel Resources</Heading>
            <ul>
              {SITE.resources.map((r) => (
                <li key={r.href}>
                  <a href={r.href} target="_blank" rel="noopener noreferrer" aria-label={`${r.label} (opens in a new tab)`} className={linkClass}>
                    {r.label} <ExternalLink className="inline w-3 h-3 -mt-0.5 opacity-70" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal" className="col-span-2 md:col-span-1">
            <Heading id="footer-legal">Legal &amp; Privacy</Heading>
            <ul className="flex flex-wrap gap-x-4 md:block">{SITE.legal.map((l) => <li key={l.href}><a href={l.href} onClick={() => window.scrollTo({ top: 0 })} className={linkClass}>{l.label}</a></li>)}</ul>
          </nav>

          <div className="col-span-2 md:col-span-1">
            <Heading id="footer-contact">Contact</Heading>
            <ul className="space-y-1.5 text-[13px] text-pearl-text-secondary" aria-labelledby="footer-contact">
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 mt-1 shrink-0 text-pearl-gold" aria-hidden="true" />
                <a href={`mailto:${SITE.supportEmail}`} aria-label={`Email support at ${SITE.supportEmail}`} className="hover:text-pearl-gold hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold rounded-sm">{SITE.supportEmail}</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-1 shrink-0 text-pearl-gold" aria-hidden="true" />
                <span>{SITE.region}</span>
              </li>
            </ul>
            {SITE.social.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-3" aria-label="Social media">
                {SITE.social.map((s) => (
                  <li key={s.href}><a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${SITE.name} on ${s.label} (opens in a new tab)`} className={linkClass}>{s.label}</a></li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-pearl-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] text-pearl-placeholder">
          <p>© {year} {SITE.name}. All rights reserved.</p>
          <p>Guidance only. Not an official immigration service. Always confirm with official sources.</p>
        </div>
      </div>
    </footer>
  );
};
