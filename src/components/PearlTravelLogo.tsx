import React from 'react';

interface PearlTravelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  /** kept for backwards compatibility; the logo always renders on a white tile for contrast */
  variant?: 'default' | 'dark-card' | 'transparent';
}

const SIZE: Record<NonNullable<PearlTravelLogoProps['size']>, string> = {
  sm: 'w-24 h-24',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
  xl: 'w-64 h-64',
};

/** Pearl Travel brand mark on a white rounded tile (matches the splash wireframe). */
export const PearlTravelLogo: React.FC<PearlTravelLogoProps> = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center select-none ${className}`}>
    <div className={`${SIZE[size]} rounded-2xl bg-white p-1 flex items-center justify-center border border-pearl-border shadow-[var(--pearl-shadow)]`}>
      <img
        src="/pearl-travel-logo.png"
        alt="Pearl Travel — Plan, Prepare, Cross"
        className="w-full h-full object-contain rounded-xl"
      />
    </div>
  </div>
);
