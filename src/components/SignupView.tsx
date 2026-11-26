import React, { useState } from 'react';
import { User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { Button, Field } from './ui';
import { SocialButtons } from './SocialAuthButtons';
import { FormErrors } from '../types';
import { ApiUnavailableError, isBootstrapAdminEmail, registerWithApi } from '../utils/apiClient';
import { registerLocalAccount, rememberSignupPhone } from '../utils/authStorage';

interface SignupViewProps {
  onSwitchToLogin: (email?: string) => void;
  onBack?: () => void;
  onSuccessToast?: (message: string) => void;
}

/** Screen 2 — Create Account: full name, email, phone, password. */
export const SignupView: React.FC<SignupViewProps> = ({ onSwitchToLogin, onBack, onSuccessToast }) => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<FormErrors & { fullName?: string; phone?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined, general: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    const parts = form.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) e.fullName = 'Enter your first and last name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (form.phone.replace(/\D/g, '').length < 7) e.phone = 'Enter a valid phone number, e.g. +254 712 345 678.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters long.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Include at least one uppercase letter.';
    else if (!/[a-z]/.test(form.password)) e.password = 'Include at least one lowercase letter.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Include at least one number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (isSubmitting || !validate()) return;
    setIsSubmitting(true);
    const [firstName, ...rest] = form.fullName.trim().split(/\s+/);
    const input = { firstName, lastName: rest.join(' '), email: form.email, password: form.password };
    try {
      rememberSignupPhone(form.email, form.phone);
      let delivered = false;
      try {
        delivered = (await registerWithApi(input)).verificationDelivered;
      } catch (error) {
        if (!(error instanceof ApiUnavailableError)) throw error;
        if (isBootstrapAdminEmail(form.email)) {
          throw new Error('Administrator accounts must be created while the Pearl Travel API is running.');
        }
        const local = await registerLocalAccount(input);
        if ('error' in local) throw new Error(local.error);
        onSuccessToast?.('Account created in offline mode. Sign in when the API is available to use server features.');
        onSwitchToLogin(form.email.trim());
        return;
      }
      onSuccessToast?.(
        delivered
          ? 'Account created. Verify your email before signing in.'
          : 'Account created, but verification email delivery is not configured.'
      );
      onSwitchToLogin(form.email.trim());
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Unable to create your account right now.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-pearl-slate text-pearl-text flex justify-center">
      <main className="w-full max-w-md px-6 py-8">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back to welcome" className="w-9 h-9 rounded-xl bg-pearl-surface border border-pearl-border flex items-center justify-center hover:bg-pearl-input cursor-pointer mb-4">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <PearlTravelLogo size="sm" className="mb-5" />
        <h1 className="text-2xl font-bold font-heading">Create Account</h1>
        <p className="text-sm text-pearl-text-secondary mt-1 mb-6">Get started with Pearl Travel</p>

        {errors.general && (
          <div role="alert" className="mb-4 px-3.5 py-3 rounded-xl bg-pearl-danger/15 border border-pearl-danger/50 text-xs font-medium text-pearl-danger-light flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Full Name" placeholder="e.g., John Kamau" autoComplete="name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} icon={<User className="w-4 h-4" />} disabled={isSubmitting} />
          <Field label="Email Address" type="email" placeholder="your.email@example.com" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} icon={<Mail className="w-4 h-4" />} disabled={isSubmitting} />
          <Field label="Phone Number" type="tel" placeholder="+254 712 345 678" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} icon={<Phone className="w-4 h-4" />} disabled={isSubmitting} />
          <Field
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
            disabled={isSubmitting}
            trailing={
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="p-1 text-pearl-placeholder hover:text-pearl-text cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Register
          </Button>
        </form>

        <SocialButtons onUnavailable={(m) => setErrors({ general: m })} />

        <p className="mt-6 text-center text-sm text-pearl-text-secondary">
          Already have an account?{' '}
          <button type="button" onClick={() => onSwitchToLogin()} className="font-semibold text-pearl-gold hover:text-pearl-gold-light cursor-pointer">
            Login
          </button>
        </p>
      </main>
    </div>
  );
};
