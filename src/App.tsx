import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundElements } from './components/BackgroundElements';
import { AuthCard } from './components/AuthCard';
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
import { logoutFromApi, verifyEmailWithApi } from './utils/apiClient';

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
      : 'login';
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [rememberSession, setRememberSession] = useState<boolean>(
    initialSession?.rememberMe ?? true
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  /* ── Determine which unauthenticated view to show ── */
  const isLogin = authMode === 'login';

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden selection:bg-pearl-gold-light selection:text-pearl-text ${
        currentUser
          ? 'bg-pearl-slate text-pearl-text'
          : isLogin
            ? '' /* LoginPage owns its own full-page layout */
            : 'flex flex-col justify-center items-center bg-pearl-navy text-pearl-text'
      }`}
    >
      {/* Background elements only for signup (login has its own background now) */}
      {!currentUser && !isLogin && <BackgroundElements variant={authMode} />}

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.aside
            aria-label="Notification"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 sm:right-6 z-[70] max-w-sm px-4 py-3 rounded-xl bg-pearl-input border border-pearl-border shadow-lg flex items-center gap-3 text-sm font-medium text-pearl-text"
          >
            <div className="w-6 h-6 rounded-full bg-pearl-success/15 border border-pearl-success/30 text-pearl-success-light flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span className="leading-snug">{toastMessage}</span>
          </motion.aside>
        )}
      </AnimatePresence>

      {currentUser ? (
        <main className="relative z-10 w-full min-h-screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={`view-portal-${currentUser.email}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full min-h-screen"
            >
              {currentUser.roles?.includes('admin_staff') ? (
                <AdminDashboard
                  key={currentUser.email}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                />
              ) : (
                <TravelerReadinessPortal
                  key={currentUser.email}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  onShowToast={showToast}
                  onUpdateCurrentUser={handleUpdateCurrentUser}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      ) : isLogin ? (
        /* ── New full-page Login ── */
        <>
          <LoginPage
            onSwitchToSignup={() => setAuthMode('signup')}
            onOpenForgotModal={(email) => {
              setForgotPrefillEmail(email);
              setForgotModalOpen(true);
            }}
            onSuccess={handleLoginSuccess}
          />
          <ForgotPasswordModal
            isOpen={forgotModalOpen}
            onClose={() => setForgotModalOpen(false)}
            defaultEmail={forgotPrefillEmail}
          />
        </>
      ) : (
        /* ── Signup (uses existing AuthCard + BackgroundElements) ── */
        <main
          aria-label="Pearl Travel Authentication"
          className="relative z-10 flex-1 flex flex-col items-center justify-center w-full my-auto py-4"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="view-auth-signup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="w-full flex justify-center"
            >
              <AuthCard
                mode={authMode}
                onModeChange={setAuthMode}
                onSuccessToast={showToast}
                onLoginSuccess={handleLoginSuccess}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      )}
    </div>
  );
}
