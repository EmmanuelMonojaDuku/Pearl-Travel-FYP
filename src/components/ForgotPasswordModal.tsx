import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { FormField } from './FormField';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(defaultEmail || '');
      setError('');
      setSubmitted(false);
      setLoading(false);
    }
  }, [isOpen, defaultEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 350);
  };

  const handleClose = () => {
    setSubmitted(false);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pearl-scrim/75 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-pearl-dark rounded-2xl p-6 sm:p-8 border border-pearl-border shadow-xl z-10"
          >
            <button
              type="button"
              id="close-forgot-modal"
              onClick={handleClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-lg border border-pearl-border bg-pearl-surface hover:bg-pearl-border flex items-center justify-center text-pearl-placeholder hover:text-pearl-text focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {!submitted ? (
              <div>
                <div className="w-11 h-11 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center text-pearl-text mb-4">
                  <Mail className="w-5 h-5 text-pearl-accent" />
                </div>

                <h3
                  id="forgot-password-title"
                  className="text-xl sm:text-2xl font-bold text-pearl-text mb-2 font-heading"
                >
                  Reset Your Password
                </h3>
                <p className="text-sm text-pearl-placeholder mb-5 leading-relaxed">
                  Enter the email address linked to your PearlTravel account. If an account matches, we&apos;ll send you instructions to reset your password.
                </p>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <FormField
                    id="forgot-email"
                    label="Email Address"
                    type="email"
                    variant="dark"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="you@example.com"
                    error={error}
                    icon={<Mail className="w-4 h-4" />}
                    disabled={loading}
                    required
                  />

                  <button
                    type="submit"
                    id="submit-forgot-password"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-pearl-gold hover:bg-pearl-gold active:bg-pearl-gold text-pearl-navy font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold focus-visible:ring-offset-2 focus-visible:ring-offset-pearl-navy"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Password Reset</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <h3
                  id="forgot-password-title"
                  className="text-xl sm:text-2xl font-bold text-pearl-text mb-2 font-heading"
                >
                  Recovery Request Recorded
                </h3>
                <p className="text-sm text-pearl-placeholder mb-6 leading-relaxed">
                  If an account exists for <strong className="text-pearl-text">{email}</strong>, we&apos;ve sent instructions to reset your password.
                </p>

                <button
                  type="button"
                  id="done-forgot-modal"
                  onClick={handleClose}
                  className="w-full h-11 rounded-xl border border-pearl-border bg-pearl-dark hover:bg-pearl-surface text-sm font-semibold text-pearl-text transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
