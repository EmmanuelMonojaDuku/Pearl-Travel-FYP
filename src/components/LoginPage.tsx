import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { Button, Field } from './ui';
import { Footer } from './Footer';
import { DemoAccess, GoogleSignIn } from './SocialAuthButtons';
import { FormErrors, LoginFormState, UserProfile } from '../types';
import {
  ApiRequestError,
  ApiUnavailableError,
  loginWithApi,
} from '../utils/apiClient';
import { authenticateLocalAccount, getDemoUser, signInWithGoogleIdentity } from '../utils/authStorage';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onBack?: () => void;
  onOpenForgotModal: (email: string) => void;
  onSuccess: (user: UserProfile, rememberMe: boolean) => void;
  initialEmail?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToSignup,
  onBack,
  onOpenForgotModal,
  onSuccess,
  initialEmail = '',
}) => {
  const [formData, setFormData] = useState<LoginFormState>({
    email: initialEmail,
    password: '',
    rememberMe: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Validation ── */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Please enter your password.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Submit ── */
  /** Demo access signs in to real seeded server accounts, so roles are always decided by the server. */
  const handleDemo = async (role: 'traveller' | 'border_officer' | 'admin_staff') => {
    const email = `${role === 'traveller' ? 'traveller' : role === 'border_officer' ? 'officer' : 'admin'}.demo@pearltravel.ug`;
    setErrors({});
    try {
      const session = await loginWithApi({ email, password: import.meta.env.VITE_DEMO_PASSWORD || 'PearlDemo#2026' });
      onSuccess({ ...session.user, accessToken: session.accessToken, refreshToken: session.refreshToken }, false);
    } catch (error) {
      if (role === 'traveller' && error instanceof ApiUnavailableError) {
        onSuccess(getDemoUser('traveller'), false); // offline demo of the traveller side only; no privileged roles
        return;
      }
      setErrors({ general: error instanceof ApiUnavailableError ? 'The server is not running. Start it with "npm run dev:full" to use officer and admin demos.' : 'Demo accounts are not set up on the server. Run "npm run seed:demo" in the api folder.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const session = await loginWithApi({
        email: formData.email,
        password: formData.password,
      });
      onSuccess(
        {
          ...session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        },
        formData.rememberMe,
      );
    } catch (error) {
      const canUseLocalAuth =
        error instanceof ApiUnavailableError ||
        (error instanceof ApiRequestError && error.statusCode === 401);

      if (canUseLocalAuth) {
        try {
          const localResult = await authenticateLocalAccount({
            email: formData.email,
            password: formData.password,
          });
          if (!('error' in localResult)) {
            onSuccess(localResult.user, formData.rememberMe);
            return;
          }
          setErrors({ general: localResult.error });
          setIsSubmitting(false);
          return;
        } catch {
          setErrors({ general: 'Unable to verify credentials right now. Please try again.' });
          setIsSubmitting(false);
          return;
        }
      }

      setErrors({
        general:
          error instanceof ApiUnavailableError
            ? 'Administrator sign-in requires the Pearl Travel API. Start the API server and try again.'
            : error instanceof Error
              ? error.message
              : 'Unable to verify credentials right now. Please try again.',
      });
      setIsSubmitting(false);
    }
  };

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <div className="min-h-screen w-full bg-pearl-slate text-pearl-text flex flex-col">
      <div className="flex-1 flex justify-center">
      <main className="w-full max-w-md px-6 py-8 flex flex-col">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to welcome"
            className="w-9 h-9 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center text-pearl-text hover:bg-pearl-input cursor-pointer mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <PearlTravelLogo size="md" className="mb-6" />
        <h1 className="text-2xl font-bold font-heading text-center">Welcome Back</h1>
        <p className="text-sm text-pearl-text-secondary text-center mt-1 mb-6">
          Sign in to continue
        </p>

        {errors.general && (
          <div role="alert" className="mb-4 px-3.5 py-3 rounded-xl bg-pearl-danger/15 border border-pearl-danger/50 text-xs font-medium text-pearl-danger-light flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={formData.email}
            disabled={isSubmitting}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
          />
          <Field
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Password"
            value={formData.password}
            disabled={isSubmitting}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="text-pearl-placeholder hover:text-pearl-text cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-pearl-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => setFormData((p) => ({ ...p, rememberMe: e.target.checked }))}
                className="accent-[var(--pearl-gold)] w-4 h-4"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => onOpenForgotModal(formData.email)}
              className="font-semibold text-pearl-accent hover:text-pearl-accent cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Login
          </Button>
        </form>

        <GoogleSignIn
          onIdentity={(id) => onSuccess(signInWithGoogleIdentity(id), formData.rememberMe)}
          onError={(m) => setErrors({ general: m })}
        />
        <DemoAccess onPick={(role) => void handleDemo(role)} />

        <p className="mt-6 text-center text-sm text-pearl-text-secondary">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={onSwitchToSignup} className="font-semibold text-pearl-accent hover:text-pearl-accent cursor-pointer">
            Register
          </button>
        </p>
      </main>
      </div>
      <Footer quickLinks={[{ label: 'Create an account', onClick: onSwitchToSignup }, ...(onBack ? [{ label: 'Welcome screen', onClick: onBack }] : [])]} />
    </div>
  );
};
