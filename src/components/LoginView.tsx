
import React, { useState } from 'react';
import { Mail, Lock, Check, AlertCircle, Loader2 } from 'lucide-react';
import loginBackground from '../assets/images/login_background.png';
import { FormField } from './FormField';
import { PearlTravelLogo } from './PearlTravelLogo';

import { FormErrors, LoginFormState, UserProfile } from '../types';
import {
  ApiRequestError,
  ApiUnavailableError,
  isBootstrapAdminEmail,
  loginWithApi,
} from '../utils/apiClient';
import { authenticateLocalAccount } from '../utils/authStorage';

interface LoginViewProps {
  onSwitchToSignup: () => void;
  onOpenForgotModal: (email: string) => void;
  onSuccess: (user: UserProfile, rememberMe: boolean) => void;
  initialEmail?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSwitchToSignup,
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
        formData.rememberMe
      );
    } catch (error) {
      const canUseLocalAuth =
        (error instanceof ApiUnavailableError ||
          (error instanceof ApiRequestError && error.statusCode === 401));
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
          setErrors({
            general: 'Unable to verify credentials right now. Please try again.',
          });
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

  return (
    <div className="w-full flex flex-col">
      {/* Brand Header: Original Pearl Travel Logo */}
      <div className="flex justify-center mb-4">
        <PearlTravelLogo size="sm" variant="dark-card" />
      </div>

      {/* Heading, Tagline & Gold Divider */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-[28px] font-bold text-pearl-text tracking-tight font-heading leading-tight">
          Welcome Back
        </h1>
        <p className="text-xs sm:text-[13.5px] text-[#E2E8F0] mt-1.5 leading-relaxed text-balance">
          Your trusted travel companion for a smoother border crossing.
        </p>
        <div
          className="w-12 h-[2px] bg-[#EAB308] rounded-full mx-auto mt-3.5"
          aria-hidden="true"
        />
      </div>

      {/* General Auth Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="mb-4 px-3.5 py-3 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/65 text-xs font-medium text-[#FCA5A5] flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          id="login-email"
          label="Email Address"
          type="email"
          variant="dark"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email || errors.general) {
              setErrors({ ...errors, email: undefined, general: undefined });
            }
          }}
          placeholder="you@example.com"
          error={errors.email}
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          disabled={isSubmitting}
          required
        />

        <FormField
          id="login-password"
          label="Password"
          type="password"
          variant="dark"
          value={formData.password}
          onChange={(e) => {
            setFormData({ ...formData, password: e.target.value });
            if (errors.password || errors.general) {
              setErrors({ ...errors, password: undefined, general: undefined });
            }
          }}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={isSubmitting}
          required
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="login-remember-me"
            className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none"
          >
            <input
              type="checkbox"
              id="login-remember-me"
              checked={formData.rememberMe}
              onChange={(e) =>
                setFormData({ ...formData, rememberMe: e.target.checked })
              }
              disabled={isSubmitting}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className={`w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#EAB308] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0F172A] ${
                formData.rememberMe
                  ? 'bg-[#EAB308] border-[#EAB308] text-[#0F172A]'
                  : 'bg-transparent border-[#E2E8F0]/80 hover:border-[#FFFFFF]'
              }`}
            >
              {formData.rememberMe && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </span>
            <span className="text-sm text-[#F1F5F9]">Remember Me</span>
          </label>

          <button
            type="button"
            id="login-forgot-password-link"
            onClick={() => onOpenForgotModal(formData.email.trim())}
            disabled={isSubmitting}
            className="min-h-[44px] inline-flex items-center text-sm font-medium text-[#EAB308] hover:text-[#FACC15] hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded px-1 cursor-pointer disabled:opacity-50"
          >
            Forgot Password?
          </button>
        </div>

        {/* Primary Action Button (Pearl Gold) */}
        <button
          type="submit"
          id="login-submit-btn"
          disabled={isSubmitting}
          className="w-full h-12 rounded-full bg-[#EAB308] hover:bg-[#FACC15] active:bg-[#EAB308] text-[#0F172A] font-bold text-sm tracking-wider uppercase transition-colors shadow-[0_6px_20px_rgba(234,179,8,0.24)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SIGNING IN...</span>
            </>
          ) : (
            <span>SIGN IN</span>
          )}
        </button>
      </form>

      {/* Switch to Account Registration */}
      <div className="mt-5 text-center text-sm text-[#CBD5E1]">
        <span>Don&apos;t have an account? </span>
        <button
          type="button"
          id="btn-switch-to-signup"
          onClick={onSwitchToSignup}
          disabled={isSubmitting}
          className="min-h-[44px] inline-flex items-center font-semibold text-[#EAB308] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded px-0.5 disabled:opacity-50"
        >
          Create Account
        </button>
      </div>
    </div>
  );
};
