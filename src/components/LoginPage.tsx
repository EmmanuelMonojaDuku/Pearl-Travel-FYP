import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle, Loader2, LogIn, Globe, HelpCircle, ChevronDown } from 'lucide-react';
import malabaBg from '../assets/images/malaba_border_post_1795029549812.jpg';
import { FormErrors, LoginFormState, UserProfile } from '../types';
import {
  ApiRequestError,
  ApiUnavailableError,
  loginWithApi,
} from '../utils/apiClient';
import { authenticateLocalAccount } from '../utils/authStorage';

interface LoginPageProps {
  onSwitchToSignup: () => void;
  onOpenForgotModal: (email: string) => void;
  onSuccess: (user: UserProfile, rememberMe: boolean) => void;
  initialEmail?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
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
    <div className="relative min-h-screen w-full flex flex-col overflow-hidden bg-[#0F172A]">

      {/* ── Full-screen background photo ── */}
      <img
        src={malabaBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-40 saturate-50"
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,23,42,0.80) 0%, rgba(15,23,42,0.55) 50%, rgba(15,23,42,0.85) 100%)',
        }}
      />

      {/* ── Top Header Bar ── */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-3 flex items-center justify-between bg-[#0F172A]/90 backdrop-blur-sm border-b border-white/5">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/aistudio/logo_dark.png"
            alt="Pearl Travel — Plan, Prepare, Cross"
            className="h-9 sm:h-10 w-auto"
          />
        </div>

        {/* Centre: tagline */}
        <div className="hidden md:flex items-center">
          <div className="h-6 w-px bg-white/20 mx-4" />
          <span className="text-sm font-medium text-[#FACC15] tracking-wide">
            Passenger-centred • Offline-first • Malaba OSBP
          </span>
        </div>

        {/* Right: language & help */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="hidden sm:flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
            <Globe className="w-4 h-4" />
            <span>EN</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-sm text-white/90 hover:bg-white/10 transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Need Help?</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-10 flex-1 flex items-center w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-center gap-8 lg:gap-16">

          {/* Left side — Hero text (hidden on small screens, card takes over) */}
          <div className="hidden lg:flex flex-col flex-1 max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Travel Smart.
              <br />
              <span className="text-[#FACC15]">Cross with Confidence.</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 leading-relaxed max-w-md">
              Your journey starts with proper preparation.
            </p>
          </div>

          {/* Right side — Login Card */}
          <div className="w-full max-w-[440px] lg:max-w-[420px]">
            <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-6 sm:p-8">

              {/* Card Logo */}
              <div className="flex justify-center mb-3">
                <img
                  src="/assets/aistudio/logo._222a6fe1.webp"
                  alt="Pearl Travel — Plan, Prepare, Cross"
                  className="h-14 sm:h-16 w-auto"
                />
              </div>

              {/* Heading */}
              <div className="text-center mb-5">
                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Welcome Back</h2>
                <p className="text-sm text-[#64748B] mt-1">Sign in to continue with your travel journey</p>
                <div className="w-10 h-[2.5px] bg-[#FACC15] rounded-full mx-auto mt-3" />
              </div>

              {/* Error banner */}
              {errors.general && (
                <div
                  role="alert"
                  className="mb-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Email */}
                <div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#64748B]">
                      <Mail className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email || errors.general) setErrors({ ...errors, email: undefined, general: undefined });
                      }}
                      placeholder="Email Address"
                      autoComplete="email"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.email)}
                      className={`w-full h-12 rounded-lg bg-[#F8FAFC] border text-sm text-[#0F172A] placeholder:text-[#94A3B8] pl-11 pr-4 transition-colors focus:outline-none ${
                        errors.email
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#FACC15] focus:ring-2 focus:ring-[#FACC15]/25'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#64748B]">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password || errors.general) setErrors({ ...errors, password: undefined, general: undefined });
                      }}
                      placeholder="Password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.password)}
                      className={`w-full h-12 rounded-lg bg-[#F8FAFC] border text-sm text-[#0F172A] placeholder:text-[#94A3B8] pl-11 pr-12 transition-colors focus:outline-none ${
                        errors.password
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#FACC15] focus:ring-2 focus:ring-[#FACC15]/25'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      disabled={isSubmitting}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" /> {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember me / Forgot */}
                <div className="flex items-center justify-between">
                  <label htmlFor="login-remember" className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="login-remember"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      disabled={isSubmitting}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        formData.rememberMe
                          ? 'bg-[#0F172A] border-[#0F172A] text-white'
                          : 'bg-white border-[#CBD5E1] hover:border-[#94A3B8]'
                      }`}
                    >
                      {formData.rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="text-sm text-[#334155]">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => onOpenForgotModal(formData.email.trim())}
                    disabled={isSubmitting}
                    className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-[#0F172A] font-bold text-sm tracking-wide transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:ring-offset-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                  <span className="text-xs text-[#94A3B8]">or continue with</span>
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                </div>

                {/* Google sign-in (visual placeholder) */}
                <button
                  type="button"
                  disabled
                  className="w-full h-12 rounded-lg border-2 border-[#FACC15] bg-white text-[#0F172A] font-semibold text-sm flex items-center justify-center gap-2.5 cursor-not-allowed opacity-70"
                >
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </form>

              {/* Create account */}
              <div className="mt-5 text-center text-sm text-[#64748B]">
                <span>Don&apos;t have an account?&nbsp;</span>
                <button
                  type="button"
                  onClick={onSwitchToSignup}
                  disabled={isSubmitting}
                  className="font-semibold text-[#FACC15] hover:text-[#EAB308] hover:underline underline-offset-2 cursor-pointer disabled:opacity-50"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom corner ribbon (gold / red / navy) ── */}
      <svg
        viewBox="0 0 420 260"
        preserveAspectRatio="none"
        fill="none"
        className="absolute bottom-0 right-0 w-56 h-36 sm:w-[380px] sm:h-[230px] z-10 pointer-events-none"
        aria-hidden="true"
      >
        <path d="M110 260 C190 165 290 78 420 12 L420 68 C305 128 220 192 150 260 Z" fill="#FACC15" fillOpacity="0.94" />
        <path d="M142 260 C225 182 315 116 420 64 L420 260 Z" fill="#DC2626" fillOpacity="0.92" />
        <path d="M270 260 C325 215 375 182 420 156 L420 260 Z" fill="#0F172A" fillOpacity="0.95" />
      </svg>

      {/* ── Footer ── */}
      <footer className="relative z-20 w-full px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-2 bg-[#0F172A]/90 backdrop-blur-sm border-t border-white/5 text-xs text-white/50">
        <span>© 2026 Pearl Travel</span>
        <span className="hidden sm:inline">Passenger-centred • Offline-first • Malaba OSBP</span>
        <div className="flex items-center gap-4">
          <button className="hover:text-white/80 transition-colors cursor-pointer">Privacy</button>
          <span className="text-white/20">|</span>
          <button className="hover:text-white/80 transition-colors cursor-pointer">Help</button>
          <span className="text-white/20">|</span>
          <button className="hover:text-white/80 transition-colors cursor-pointer">About</button>
        </div>
      </footer>
    </div>
  );
};
