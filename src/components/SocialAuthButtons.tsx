import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Field } from './ui';
import type { GoogleIdentity } from '../utils/authStorage';
import { isDemoMode, isGoogleConfigured, signInWithGoogle } from '../utils/googleAuth';

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.8-6.1z" />
    <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.4-5.7c-2 1.4-4.7 2.2-7.8 2.2-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

interface Props {
  onIdentity: (identity: GoogleIdentity) => void;
  onError: (message: string) => void;
}

/** "Continue with Google". Real Google OAuth when VITE_GOOGLE_CLIENT_ID is set; labelled demo chooser in demo mode. */
export const GoogleSignIn: React.FC<Props> = ({ onIdentity, onError }) => {
  const [busy, setBusy] = useState(false);
  const [chooser, setChooser] = useState(false);
  const [demo, setDemo] = useState({ name: '', email: '' });

  const start = async () => {
    if (isGoogleConfigured) {
      setBusy(true);
      try {
        onIdentity(await signInWithGoogle());
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Google sign-in failed.');
      } finally {
        setBusy(false);
      }
    } else if (isDemoMode) {
      setChooser(true);
    } else {
      onError('Google sign-in is not set up for this deployment. Add VITE_GOOGLE_CLIENT_ID (see README).');
    }
  };

  const submitDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(demo.email.trim()) || !demo.name.trim()) {
      onError('Enter a name and a valid email for the demo Google account.');
      return;
    }
    setChooser(false);
    onIdentity({ email: demo.email.trim(), name: demo.name.trim() });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 text-[11px] text-pearl-placeholder mb-4">
        <span className="flex-1 h-px bg-pearl-border" />
        Or
        <span className="flex-1 h-px bg-pearl-border" />
      </div>
      <Button variant="outline" onClick={() => void start()} disabled={busy}>
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      {chooser && (
        <div role="dialog" aria-modal="true" aria-label="Choose a Google account (demo)" className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center p-4">
          <form onSubmit={submitDemo} className="w-full max-w-sm bg-pearl-dark border border-pearl-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2"><GoogleMark /><h2 className="font-bold">Choose a Google account</h2></div>
            <p className="text-[11px] text-pearl-gold">Demo mode: no real Google call is made. Set VITE_GOOGLE_CLIENT_ID for real Google sign-in.</p>
            <Field label="Name" value={demo.name} onChange={(e) => setDemo((d) => ({ ...d, name: e.target.value }))} placeholder="Amina Kato" autoFocus />
            <Field label="Gmail address" type="email" value={demo.email} onChange={(e) => setDemo((d) => ({ ...d, email: e.target.value }))} placeholder="amina@gmail.com" />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setChooser(false)}>Cancel</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/** One-click role access for presentations (VITE_DEMO_MODE=true only). */
export const DemoAccess: React.FC<{ onPick: (role: 'traveller' | 'border_officer' | 'admin_staff') => void }> = ({ onPick }) => {
  if (!isDemoMode) return null;
  return (
    <div className="mt-6 p-3 rounded-xl border border-dashed border-pearl-gold/50">
      <p className="text-[11px] font-bold uppercase tracking-wider text-pearl-gold mb-2">Demo access</p>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" onClick={() => onPick('traveller')} className="!px-2 text-xs">Traveller</Button>
        <Button variant="outline" onClick={() => onPick('border_officer')} className="!px-2 text-xs">Officer</Button>
        <Button variant="outline" onClick={() => onPick('admin_staff')} className="!px-2 text-xs">Admin</Button>
      </div>
    </div>
  );
};
