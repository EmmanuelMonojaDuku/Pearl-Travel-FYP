import React from 'react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { Button } from './ui';
import { Footer } from './Footer';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

/** Screen 1 — Splash: brand mark, tagline, Get Started / Login. */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onLogin }) => (
  <div className="min-h-screen w-full bg-pearl-slate text-pearl-text flex flex-col">
    <div className="flex-1 flex justify-center">
    <main className="w-full max-w-md px-6 py-10 flex flex-col items-center justify-between">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <PearlTravelLogo size="xl" />
        <h1 className="sr-only">Pearl Travel — Plan, Prepare, Cross</h1>
      </div>
      <div className="w-full space-y-3">
        <Button onClick={onGetStarted}>Get Started</Button>
        <Button variant="outline" onClick={onLogin}>Login</Button>
        <p className="pt-3 text-center text-xs text-pearl-placeholder">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onGetStarted} className="font-semibold text-pearl-accent cursor-pointer">
            Register
          </button>
        </p>
      </div>
    </main>
    </div>
    <Footer variant="compact" quickLinks={[]} />
  </div>
);
