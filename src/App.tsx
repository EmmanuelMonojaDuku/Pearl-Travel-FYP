import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SignupView } from './components/SignupView';
import { OfficerPortal } from './components/officer/OfficerPortal';
import { LegalPage } from './components/LegalPage';
import { getLegalSlugFromHash, type LegalSlug } from './config/site';
import { LoginPage } from './components/LoginPage';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TravelerReadinessPortal } from './components/TravelerReadinessPortal';
import { Check } from 'lucide-react';
import { AuthMode, UserProfile } from './types';
import {
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
} from './utils/authStorage';
import { ConnectionBanner } from './components/ConnectionBanner';
import { ApiRequestError, fetchServerRoles, logoutFromApi, refreshWithApi, verifyEmailWithApi } from './utils/apiClient';

export default function App() {
  const initialSession = loadPersistedSession();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    initialSession?.user || null
  );
  const initialMode: AuthMode =
    typeof window !== 'undefined' &&
    (window.location.search.includes('mode=signup') ||
      window.location.hash.includes('signup'))
      ? 'signup'
      : initialSession
        ? 'login'
        : 'welcome';
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [rememberSession, setRememberSession] = useState<boolean>(
    initialSession?.rememberMe ?? true
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /* Legal pages live at #/legal/<slug> and are reachable from every footer. */
  const [legalSlug, setLegalSlug] = useState<LegalSlug | null>(() => getLegalSlugFromHash(window.location.hash));
  const lastAppHash = React.useRef('');
  useEffect(() => {
    const sync = () => {
      const slug = getLegalSlugFromHash(window.location.hash);
      if (!slug) lastAppHash.current = window.location.hash;
      setLegalSlug(slug);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const closeLegal = () => {
    window.location.hash = lastAppHash.current;
    if (!lastAppHash.current) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setLegalSlug(null);
  };

  /* Forgot-password modal state (used by the new LoginPage) */
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotPrefillEmail, setForgotPrefillEmail] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token || !window.location.pathname.endsWith('/verify-email')) return;

    void verifyEmailWithApi(token)
      .then(() => {
        window.history.replaceState({}, '', '/');
        setAuthMode('login');
        showToast('Email verified. Sign in to continue.');
      })
      .catch((error: unknown) => {
        window.history.replaceState({}, '', '/');
        showToast(
          error instanceof Error ? `Email verification failed: ${error.message}` : 'Email verification failed.'
        );
      });
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleLoginSuccess = (user: UserProfile, rememberMe: boolean) => {
    setCurrentUser(user);
    setRememberSession(rememberMe);
    persistSession(user, rememberMe);
    if (user.profileCompleted) {
      showToast(`Welcome back, ${user.name}!`);
    }
  };

  const handleLogout = () => {
    if (currentUser?.accessToken && currentUser.refreshToken) {
      void logoutFromApi(currentUser.accessToken, currentUser.refreshToken).catch((error: unknown) => {
        console.error('Could not revoke the server session during sign out:', error);
      });
    }
    setCurrentUser(null);
    setAuthMode('login');
    clearPersistedSession();
    showToast('Signed out of Pearl Travel.');
  };

  const handleUpdateCurrentUser = (updated: UserProfile) => {
    const merged = {
      ...currentUser,
      ...updated,
      roles: currentUser?.roles,
      accessToken: currentUser?.accessToken,
      refreshToken: currentUser?.refreshToken,
    };
    setCurrentUser(merged);
    persistSession(merged, rememberSession);
  };

  /* Roles are decided by the server. A stored session is re-checked on start; privileged roles
     without a server token are dropped, and the server enforces every privileged request anyway. */
  useEffect(() => {
    const u = currentUser;
    if (!u) return;
    const privileged = u.roles?.some((r) => r !== 'traveller');
    if (!u.accessToken) {
      if (privileged) {
        const demoted = { ...u, roles: ['traveller' as const] };
        setCurrentUser(demoted);
        persistSession(demoted, rememberSession);
      }
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        let token = u.accessToken!;
        let refreshToken = u.refreshToken;
        let roles;
        try {
          roles = await fetchServerRoles(token);
        } catch (e) {
          if (!(e instanceof ApiRequestError) || e.statusCode !== 401 || !u.refreshToken) throw e;
          const r = await refreshWithApi(u.refreshToken);
          token = r.accessToken; refreshToken = r.refreshToken; roles = r.roles;
        }
        if (cancelled) return;
        if (JSON.stringify(roles) !== JSON.stringify(u.roles) || token !== u.accessToken) {
          const next = { ...u, roles, accessToken: token, refreshToken };
          setCurrentUser(next);
          persistSession(next, rememberSession);
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiRequestError && (e.statusCode === 401 || e.statusCode === 403)) {
          clearPersistedSession();
          setCurrentUser(null);
          setAuthMode('login');
        }
        // Server unreachable: keep the cached view. Privileged data still needs the server.
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.accessToken]);

  const [prefillEmail, setPrefillEmail] = useState('');
  const role = currentUser?.roles?.includes('admin_staff')
    ? 'admin'
    : currentUser?.roles?.includes('border_officer')
      ? 'officer'
      : 'traveller';

  const toast = (
    <AnimatePresence>
      {toastMessage && (
        <motion.aside
          role="status"
          aria-label="Notification"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 left-4 sm:left-auto sm:right-6 z-[70] sm:max-w-sm px-4 py-3 rounded-xl bg-pearl-navy border border-pearl-border shadow-lg flex items-center gap-3 text-sm font-medium text-pearl-text"
        >
          <div className="w-6 h-6 rounded-full bg-pearl-success/15 border border-pearl-success/40 text-pearl-success-light flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span className="leading-snug">{toastMessage}</span>
        </motion.aside>
      )}
    </AnimatePresence>
  );

  let screen: React.ReactNode;
  if (currentUser) {
    screen =
      role === 'admin' ? (
        <AdminDashboard key={currentUser.email} currentUser={currentUser} onLogout={handleLogout} />
      ) : role === 'officer' ? (
        <OfficerPortal key={currentUser.email} currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <TravelerReadinessPortal
          key={currentUser.email}
          currentUser={currentUser}
          onLogout={handleLogout}
          onShowToast={showToast}
          onUpdateCurrentUser={handleUpdateCurrentUser}
        />
      );
  } else if (authMode === 'welcome') {
    screen = <WelcomeScreen onGetStarted={() => setAuthMode('signup')} onLogin={() => setAuthMode('login')} />;
  } else if (authMode === 'login') {
    screen = (
      <>
        <LoginPage
          initialEmail={prefillEmail}
          onBack={() => setAuthMode('welcome')}
          onSwitchToSignup={() => setAuthMode('signup')}
          onOpenForgotModal={(email) => {
            setForgotPrefillEmail(email);
            setForgotModalOpen(true);
          }}
          onSuccess={handleLoginSuccess}
        />
        <ForgotPasswordModal isOpen={forgotModalOpen} onClose={() => setForgotModalOpen(false)} defaultEmail={forgotPrefillEmail} />
      </>
    );
  } else {
    screen = (
      <SignupView
        onBack={() => setAuthMode('welcome')}
        onSuccessToast={showToast}
        onAuthenticated={handleLoginSuccess}
        onSwitchToLogin={(email) => {
          if (email) setPrefillEmail(email);
          setAuthMode('login');
        }}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-pearl-slate text-pearl-text selection:bg-pearl-gold selection:text-pearl-navy">
      <ConnectionBanner />
      {toast}
      {legalSlug ? <LegalPage slug={legalSlug} onBack={closeLegal} /> : screen}
    </div>
  );
}
