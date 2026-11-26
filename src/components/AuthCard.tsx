import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginView as NewLoginView } from './LoginViewNew';
import { SignupView } from './SignupView';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { AuthMode, UserProfile } from '../types';

interface AuthCardProps {
  mode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  onSuccessToast?: (msg: string) => void;
  onLoginSuccess: (user: UserProfile, rememberMe: boolean) => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  mode: controlledMode,
  onModeChange,
  onSuccessToast,
  onLoginSuccess,
}) => {
  const [uncontrolledMode, setUncontrolledMode] = useState<AuthMode>('login');
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = (nextMode: AuthMode) => {
    setUncontrolledMode(nextMode);
    onModeChange?.(nextMode);
  };

  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState('');

  const handleLoginSuccess = (user: UserProfile, rememberMe: boolean) => {
    onLoginSuccess(user, rememberMe);
  };

  const isLogin = mode === 'login';

  return (
    <div
      className={`w-full mx-auto px-4 ${
        isLogin ? 'max-w-[468px] py-6 sm:py-8' : 'max-w-[490px] py-6 sm:py-8'
      }`}
    >
      <div className="w-full transition-colors bg-pearl-dark/82 backdrop-blur-md border border-pearl-border/60 rounded-2xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(2,6,23,0.65)]">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="auth-login"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <NewLoginView
                onSwitchToSignup={() => setMode('signup')}
                onOpenForgotModal={(email) => {
                  setPrefillEmail(email);
                  setForgotModalOpen(true);
                }}
                onSuccess={handleLoginSuccess}
                initialEmail={prefillEmail}
              />
            </motion.div>
          ) : (
            <motion.div
              key="auth-signup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SignupView
                onSwitchToLogin={(email) => {
                  if (email) setPrefillEmail(email);
                  setMode('login');
                }}
                onSuccessToast={onSuccessToast}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        defaultEmail={prefillEmail}
      />
    </div>
  );
};
