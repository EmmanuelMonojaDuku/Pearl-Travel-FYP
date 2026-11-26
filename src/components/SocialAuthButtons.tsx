import React from 'react';
import { Apple } from 'lucide-react';
import { Button } from './ui';

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);

/** Google / Apple sign-in row. No OAuth provider is configured on the API yet, so the buttons report that honestly. */
export const SocialButtons: React.FC<{ onUnavailable: (message: string) => void }> = ({ onUnavailable }) => (
  <div className="mt-6">
    <div className="flex items-center gap-3 text-[11px] text-pearl-placeholder mb-4">
      <span className="flex-1 h-px bg-pearl-border" />
      Or continue with
      <span className="flex-1 h-px bg-pearl-border" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      {(['Google', 'Apple'] as const).map((name) => (
        <Button
          key={name}
          variant="outline"
          onClick={() => onUnavailable(`${name} sign-in is not configured for this deployment yet. Use email and password.`)}
        >
          {name === 'Google' ? <GoogleMark /> : <Apple className="w-4 h-4" />}
          {name}
        </Button>
      ))}
    </div>
  </div>
);
