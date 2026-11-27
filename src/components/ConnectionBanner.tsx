import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/** Tells the user, on every screen, when the device is offline and what that means. */
export const ConnectionBanner: React.FC = () => {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (online) return null;
  return (
    <div role="status" className="fixed top-0 inset-x-0 z-[60] bg-pearl-gold text-pearl-navy text-xs font-semibold px-4 py-1.5 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      Offline. Saved guidance and your checklist still work. Sign-in, QR creation, the assistant and officer tools need a connection. Changes sync when you are back online.
    </div>
  );
};
