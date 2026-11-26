import React from 'react';
import { motion } from 'motion/react';
import { Plane, Compass, MapPin, Sparkles, LogOut, CheckCircle } from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { UserProfile } from '../types';

interface TravelerWelcomeProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenReadinessPortal?: () => void;
}

export const TravelerWelcome: React.FC<TravelerWelcomeProps> = ({
  user,
  onLogout,
  onOpenReadinessPortal,
}) => {
  const destinations = [
    { name: 'Bwindi Impenetrable Forest', type: 'Gorilla Trekking', color: 'from-emerald-500 to-teal-700' },
    { name: 'Murchison Falls National Park', type: 'River Nile Safari', color: 'from-amber-500 to-orange-700' },
    { name: 'Queen Elizabeth National Park', type: 'Tree-Climbing Lions', color: 'from-rose-500 to-red-700' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-[480px] neu-card rounded-[32px] p-6 sm:p-8 bg-pearl-dark flex flex-col items-center text-center relative z-10"
    >
      {/* Top Logo - Bigger, bolder */}
      <div className="mb-4">
        <PearlTravelLogo size="md" variant="transparent" />
      </div>

      <div className="w-12 h-12 rounded-full bg-pearl-success/15 text-pearl-success-light flex items-center justify-center neu-card-sm mb-2">
        <CheckCircle className="w-7 h-7 text-pearl-success-light" />
      </div>

      <h2 className="text-2xl font-black text-pearl-text font-heading">
        Welcome to Uganda!
      </h2>
      <p className="text-sm font-semibold text-pearl-danger-light mt-0.5">
        The Pearl of Africa Awaits
      </p>

      <div className="w-full bg-pearl-surface neu-inset rounded-2xl p-4 my-4 text-left">
        <div className="flex items-center justify-between pb-3 border-b border-pearl-border/70">
          <div>
            <p className="text-xs text-pearl-placeholder font-medium">Logged in Traveler</p>
            <p className="text-sm font-bold text-pearl-text">{user.name}</p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-pearl-gold/30 text-pearl-gold-light border border-pearl-gold">
            Explorer Pass
          </span>
        </div>
        <p className="text-xs text-pearl-placeholder mt-2 flex items-center gap-1.5">
          <Plane className="w-3.5 h-3.5 text-pearl-gold" />
          <span>Active destination: Entebbe International (EBB)</span>
        </p>
      </div>

      {/* Primary Action: Go to Travel Readiness Suite */}
      {onOpenReadinessPortal && (
        <button
          type="button"
          id="btn-open-readiness-portal"
          onClick={onOpenReadinessPortal}
          className="w-full py-3.5 px-6 rounded-full font-bold text-xs tracking-wider uppercase pearl-gradient-btn flex items-center justify-center gap-2 group cursor-pointer shadow-md mb-4"
        >
          <span className="relative z-10 text-pearl-text group-hover:text-pearl-text transition-colors flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pearl-gold group-hover:text-pearl-text" />
            <span>Open Travel Readiness & QR Suite</span>
          </span>
        </button>
      )}

      {/* Featured Safaris */}
      <div className="w-full text-left mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-pearl-placeholder mb-2 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-pearl-danger-light" />
          <span>Recommended Pearl Safaris</span>
        </p>
        <div className="space-y-2">
          {destinations.map((dest, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-pearl-dark neu-card-sm border border-pearl-border"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-pearl-danger-light" />
                <div>
                  <p className="text-xs font-bold text-pearl-text">{dest.name}</p>
                  <p className="text-[10px] text-pearl-placeholder">{dest.type}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-pearl-gold-light bg-pearl-surface px-2 py-0.5 rounded-full">
                Explore
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout button */}
      <button
        type="button"
        id="btn-traveler-logout"
        onClick={onLogout}
        className="w-full py-2.5 px-6 rounded-full font-bold text-xs tracking-wider uppercase neu-btn text-pearl-text-secondary hover:text-pearl-danger-light flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Log Out</span>
      </button>
    </motion.div>
  );
};
