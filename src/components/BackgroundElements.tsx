import React from 'react';
import malabaBorderPostImg from '../assets/images/malaba_border_post_1795029549812.jpg';

interface BackgroundElementsProps {
  variant?: 'login' | 'signup';
}

export const BackgroundElements: React.FC<BackgroundElementsProps> = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-pearl-navy"
    >
      {/* Subtle dimmed travel/border-post background layer */}
      <img
        src={malabaBorderPostImg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center opacity-36 saturate-50 contrast-115 scale-[1.02]"
      />

      {/* Deep Navy tonal variation & contrast scrim */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7, 13, 26, 0.88) 0%, rgba(15, 23, 42, 0.72) 52%, rgba(7, 13, 26, 0.90) 100%)',
        }}
      />

      {/* Subtle upper-left aircraft silhouette & faint contrail */}
      <svg
        viewBox="0 0 260 120"
        fill="none"
        className="absolute top-3 left-0 sm:top-7 sm:left-4 w-44 sm:w-64 h-auto opacity-50"
      >
        <defs>
          <linearGradient id="pt-contrail" x1="0" y1="95" x2="132" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--pearl-placeholder)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--pearl-placeholder)" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path
          d="M0 98 Q65 78 134 55"
          stroke="url(#pt-contrail)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <g transform="translate(115, 16) rotate(-18)">
          <path
            d="M48 26 L78 21 C82 20.5 85 22.5 82 24.5 L53 31 L42 54 L36 55 L42 33 L21 36 L14 45 L10 46 L14 35 L9 32 L12 29 L19 30 L38 26 L26 8 L32 7 L48 26 Z"
            fill="var(--pearl-navy)"
            fillOpacity="0.72"
          />
        </g>
      </svg>

      {/* Bottom-right Pearl Gold & Flag Red curved corner ribbon accents */}
      <svg
        viewBox="0 0 420 260"
        preserveAspectRatio="none"
        fill="none"
        className="absolute bottom-0 right-0 w-56 h-36 sm:w-[400px] sm:h-[250px]"
      >
        {/* Outer Pearl Gold curved sweep */}
        <path
          d="M110 260 C190 165 290 78 420 12 L420 68 C305 128 220 192 150 260 Z"
          fill="var(--pearl-gold)"
          fillOpacity="0.94"
        />
        {/* Inner Flag Red curved sweep */}
        <path
          d="M142 260 C225 182 315 116 420 64 L420 260 Z"
          fill="var(--pearl-danger)"
          fillOpacity="0.92"
        />
        {/* Deep Navy corner wedge */}
        <path
          d="M270 260 C325 215 375 182 420 156 L420 260 Z"
          fill="var(--pearl-navy)"
          fillOpacity="0.95"
        />
      </svg>
    </div>
  );
};
