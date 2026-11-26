import React from 'react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { Button } from './ui';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

/** Screen 1 — Splash: brand mark, tagline, Get Started / Login. */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => (
  <div className="min-h-screen w-full bg-pearl-slate text-pearl-text flex justify-center">
    <main className="w-full max-w-md px-6 py-10 flex flex-col items-center justify-between min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <PearlTravelLogo size="xl" />
        <h1 className="mt-8 text-3xl font-bold font-heading">Pearl Travel</h1>
        <p className="mt-2 text-sm text-pearl-text-secondary">Plan · Prepare · Cross</p>
        <p className="mt-1 text-xs text-pearl-placeholder">Your smart border companion</p>
      </div>
      <div className="w-full space-y-3">
        <Button onClick={onGetStarted}>Get Started</Button>
        <Button variant="outline" onClick={onLogin}>Login</Button>
        <p className="pt-3 text-center text-xs text-pearl-placeholder">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onGetStarted} className="font-semibold text-pearl-gold cursor-pointer">
            Register
          </button>
        </p>
      </div>
    </main>
  </div>
);
