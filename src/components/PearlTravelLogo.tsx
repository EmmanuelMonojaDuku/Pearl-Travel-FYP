import React from 'react';

interface PearlTravelLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'dark-card' | 'transparent';
}

export const PearlTravelLogo: React.FC<PearlTravelLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'default',
}) => {
  const isDarkCard = variant === 'dark-card';
  const useDarkLogo = variant !== 'default';

  const widthClass = {
    sm: useDarkLogo ? 'w-28 sm:w-32' : 'w-32 sm:w-36',
    md: useDarkLogo ? 'w-36 sm:w-40' : 'w-40 sm:w-44',
    lg: useDarkLogo ? 'w-44 sm:w-48' : 'w-48 sm:w-52',
    xl: useDarkLogo ? 'w-52 sm:w-60' : 'w-56 sm:w-64',
  }[size];

  if (isDarkCard) {
    return (
      <div className={`flex items-center justify-center select-none ${className}`}>
        <div className="relative p-2.5 sm:p-3 rounded-2xl bg-[#1E293B]/40 border border-white/10 shadow-[0_4px_24px_rgba(2,6,23,0.35)] backdrop-blur-md flex items-center justify-center transition-all duration-300">
          <img
            src="/assets/aistudio/logo_dark.png"
            alt="Pearl Travel — Plan, Prepare, Cross"
            className={`${widthClass} h-auto block object-contain`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center select-none ${className}`}>
      <img
        src={useDarkLogo ? '/assets/aistudio/logo_dark.png' : '/assets/aistudio/logo._222a6fe1.webp'}
        alt="Pearl Travel — Plan, Prepare, Cross"
        className={`${widthClass} h-auto block object-contain`}
      />
    </div>
  );
};
