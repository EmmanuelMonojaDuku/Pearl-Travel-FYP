import React from 'react';

interface PearlTravelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  /** kept for backwards compatibility; the logo always renders on a white tile for contrast */
  variant?: 'default' | 'dark-card' | 'transparent';
}

const SIZE: Record<NonNullable<PearlTravelLogoProps['size']>, string> = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
  xl: 'w-44 h-44',
};

/** Pearl Travel brand mark on a white rounded tile (matches the splash wireframe). */
export const PearlTravelLogo: React.FC<PearlTravelLogoProps> = ({ size = 'md', className = '' }) => (
  <div className={`flex items-center justify-center select-none ${className}`}>
    <div className={`${SIZE[size]} rounded-2xl bg-white p-1 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.5)]`}>
      <img
        src="/pearl-travel-logo.jpg"
        alt="Pearl Travel — Plan, Prepare, Cross"
        className="w-full h-full object-contain rounded-xl"
      />
    </div>
  </div>
);
