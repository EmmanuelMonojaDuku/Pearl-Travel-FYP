import type { GoogleIdentity } from './authStorage';

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

export const isGoogleConfigured = CLIENT_ID.length > 0;
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

interface TokenResponse { access_token?: string; error?: string }
interface TokenClient { requestAccessToken: (o?: { prompt?: string }) => void }
declare global {
  interface Window {
    google?: { accounts: { oauth2: { initTokenClient: (c: { client_id: string; scope: string; callback: (r: TokenResponse) => void; error_callback?: (e: { type?: string }) => void }) => TokenClient } } };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Could not reach Google. Check your internet connection and try again.')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Opens Google's consent popup and resolves with the signed-in Google account. */
export async function signInWithGoogle(): Promise<GoogleIdentity> {
  if (!isGoogleConfigured) throw new Error('Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).');
  await loadScript();
  const token = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'openid email profile',
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error(r.error || 'Google sign-in was cancelled.'))),
      error_callback: (e) => reject(new Error(e.type === 'popup_closed' ? 'Google sign-in was cancelled.' : 'Google sign-in failed. Please try again.')),
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Google did not return your profile. Please try again.');
  const info = await res.json();
  if (!info.email) throw new Error('Your Google account has no email address.');
  return { email: info.email, name: info.name || info.email, givenName: info.given_name, familyName: info.family_name, picture: info.picture };
}
