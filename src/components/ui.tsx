import React from 'react';
import { ChevronLeft } from 'lucide-react';

/* Shared building blocks so every screen uses the same look (wireframe: black + yellow). */

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  full?: boolean;
};

export const Button: React.FC<BtnProps> = ({ variant = 'primary', full = true, className = '', ...rest }) => {
  const base =
    'min-h-[44px] px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-focus focus-visible:ring-offset-2 focus-visible:ring-offset-pearl-slate';
  const styles = {
    primary: 'bg-pearl-gold hover:bg-pearl-gold-light active:brightness-95 text-pearl-navy shadow-sm',
    outline: 'bg-pearl-dark border border-pearl-border hover:bg-pearl-surface hover:border-pearl-navy text-pearl-text',
    danger: 'bg-pearl-dark border border-pearl-danger/50 hover:bg-pearl-danger/10 text-pearl-danger-light',
    ghost: 'bg-transparent hover:bg-pearl-surface text-pearl-text-secondary',
  }[variant];
  return <button type="button" {...rest} className={`${base} ${styles} ${full ? 'w-full' : ''} ${className}`} />;
};

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...rest }) => (
  <div {...rest} className={`bg-pearl-dark border border-pearl-border rounded-2xl p-4 shadow-[var(--pearl-shadow)] ${className}`} />
);

export type PillTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';
export const Pill: React.FC<{ tone?: PillTone; children: React.ReactNode; className?: string }> = ({
  tone = 'neutral',
  children,
  className = '',
}) => {
  const t = {
    success: 'bg-pearl-success/15 text-pearl-success-light border-pearl-success/40',
    danger: 'bg-pearl-danger/15 text-pearl-danger-light border-pearl-danger/40',
    warning: 'bg-pearl-gold/15 text-pearl-accent border-pearl-gold/40',
    info: 'bg-pearl-info/15 text-pearl-info border-pearl-info/40',
    neutral: 'bg-pearl-surface text-pearl-text-secondary border-pearl-border',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${t} ${className}`}>
      {children}
    </span>
  );
};

export const ScreenHeader: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}> = ({ title, subtitle, onBack, right }) => (
  <header className="flex items-center gap-3 mb-5">
    {onBack && (
      <button
        type="button"
        aria-label="Go back"
        onClick={onBack}
        className="w-9 h-9 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center text-pearl-text hover:bg-pearl-input cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    )}
    <div className="min-w-0 flex-1">
      <h1 className="text-lg font-bold font-heading text-pearl-text truncate">{title}</h1>
      {subtitle && <p className="text-[11px] text-pearl-placeholder truncate">{subtitle}</p>}
    </div>
    {right}
  </header>
);

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-[11px] font-bold uppercase tracking-wider text-pearl-accent mb-2">{children}</h2>
);

/** Progress ring used by checklist (x/y) and readiness (%). */
export const Ring: React.FC<{ value: number; label: string; sub?: string; size?: number; tone?: 'gold' | 'success' | 'danger' }> = ({
  value,
  label,
  sub,
  size = 96,
  tone = 'gold',
}) => {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const color = { gold: 'var(--pearl-gold)', success: 'var(--pearl-success)', danger: 'var(--pearl-danger)' }[tone];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label} ${sub ?? ''}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pearl-surface)" strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(value, 0), 100) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold font-heading text-pearl-text tabular-nums leading-none">{label}</span>
        {sub && <span className="text-[9px] font-bold uppercase tracking-wider text-pearl-placeholder mt-0.5">{sub}</span>}
      </div>
    </div>
  );
};

export const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; icon?: React.ReactNode; trailing?: React.ReactNode }> = ({
  label,
  error,
  icon,
  trailing,
  className = '',
  id,
  ...rest
}) => {
  const fid = id || `f-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div>
      <label htmlFor={fid} className="block text-[11px] font-semibold text-pearl-text-secondary mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pearl-placeholder">{icon}</span>}
        <input
          id={fid}
          aria-invalid={Boolean(error)}
          {...rest}
          className={`w-full h-12 rounded-xl bg-pearl-input border text-sm text-pearl-text placeholder:text-pearl-placeholder ${icon ? 'pl-11' : 'pl-4'} ${trailing ? 'pr-11' : 'pr-4'} focus:outline-none focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/25 ${error ? 'border-pearl-danger' : 'border-pearl-border'} ${className}`}
        />
        {trailing && <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-pearl-danger-light">{error}</p>}
    </div>
  );
};

/** Navy application bar shared by the officer and admin apps (the traveller app has its own header). */
export const AppBar: React.FC<{ role: string; name: string }> = ({ role, name }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'PT';
  return (
    <header className="sticky top-0 z-30 w-full bg-pearl-navy border-b border-pearl-border">
      <div className="mx-auto w-full max-w-2xl px-5 h-16 flex items-center gap-3">
        <img src="/pearl-travel-logo.png" alt="" width={44} height={44} className="w-11 h-11 rounded-lg bg-white p-0.5 object-contain" />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-extrabold text-sm leading-tight text-pearl-text">Pearl Travel</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pearl-accent">{role}</p>
        </div>
        <span title={name} className="w-9 h-9 rounded-full bg-pearl-gold text-pearl-navy text-xs font-bold flex items-center justify-center">{initials}</span>
      </div>
    </header>
  );
};
