// Pearl Travel Official Design System Tokens
// Centralised colour palette, typography, and spacing

export const colors = {
  // Primary surfaces
  background: '#F8FAFC',      // Cool White - main app background
  sidebar: '#0F172A',         // Deep Navy - sidebar
  navySlate: '#1E293B',       // Navy Slate - secondary dark surface
  card: '#FFFFFF',            // White - card backgrounds
  border: '#E2E8F0',         // Light Slate - borders

  // Accents
  primaryAccent: '#FACC15',   // Pearl Yellow
  deepYellow: '#EAB308',      // Deep Yellow

  // Text
  textPrimary: '#0F172A',     // Dark Slate
  textSecondary: '#64748B',   // Slate Grey

  // Semantic
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Legacy dark-mode tokens (kept for auth screens)
  pearl: {
    navy: '#0F172A',
    dark: '#1E293B',
    slate: '#334155',
    surface: '#273449',
    input: '#243247',
    gold: '#EAB308',
    goldLight: '#FACC15',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    placeholder: '#94A3B8',
    border: '#475569',
    danger: '#DC2626',
    dangerLight: '#FCA5A5',
    success: '#15803D',
    successLight: '#86EFAC',
  },
} as const;

export const typography = {
  fontFamily: {
    heading: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  fontSize: {
    h1: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],
    h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
    h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
    base: ['0.875rem', { lineHeight: '1.25rem' }],
    sm: ['0.8125rem', { lineHeight: '1.125rem' }],
    xs: ['0.75rem', { lineHeight: '1rem' }],
  },
} as const;

export const spacing = {
  page: { x: '1.5rem', y: '1.5rem' },
  card: { x: '1.5rem', y: '1.25rem' },
  section: '2rem',
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
} as const;

export const shadows = {
  card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
} as const;
