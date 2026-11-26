import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { PearlTravelLogo } from './PearlTravelLogo';
import { FormField } from './FormField';
import { FormErrors } from '../types';
import { ApiUnavailableError, isBootstrapAdminEmail, registerWithApi } from '../utils/apiClient';
import { registerLocalAccount } from '../utils/authStorage';

interface SignupViewProps {
  onSwitchToLogin: (email?: string) => void;
  onSuccessToast?: (message: string) => void;
}

interface AccountRegistrationState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onSwitchToLogin,
  onSuccessToast,
}) => {
  const [formData, setFormData] = useState<AccountRegistrationState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters.';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must include at least one uppercase letter.';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must include at least one lowercase letter.';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must include at least one number.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      const registrationInput = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };
      let verificationDelivered = false;
      try {
        const result = await registerWithApi(registrationInput);
        verificationDelivered = result.verificationDelivered;
      } catch (error) {
        if (!(error instanceof ApiUnavailableError)) {
          throw error;
        }
        if (isBootstrapAdminEmail(formData.email)) {
          throw new Error('Administrator accounts must be created while the Pearl Travel API is running.');
        }
        const localResult = await registerLocalAccount(registrationInput);
        if ('error' in localResult) {
          throw new Error(localResult.error);
        }
        onSuccessToast?.('Account created in offline mode. Sign in when the API is available to use server features.');
        onSwitchToLogin(formData.email.trim());
        return;
      }

      onSuccessToast?.(
        verificationDelivered
          ? 'Account created. Verify your email before signing in.'
          : 'Account created, but verification email delivery is not configured. Configure email delivery before granting admin access.'
      );
      onSwitchToLogin(formData.email.trim());
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'Unable to create your account right now. Please try again.',
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
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#FFFFFF] tracking-tight font-heading leading-tight">
          Create Account
        </h1>
        <p className="text-xs sm:text-[13.5px] text-[#E2E8F0] mt-1.5 leading-relaxed text-balance">
          Register your Pearl Travel account. You will set up your traveller profile next.
        </p>
        <div
          className="w-12 h-[2px] bg-[#EAB308] rounded-full mx-auto mt-3.5"
          aria-hidden="true"
        />
      </div>

      {/* General Registration Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="mb-4 px-3.5 py-3 rounded-xl bg-[#DC2626]/15 border border-[#DC2626]/65 text-xs font-medium text-[#FCA5A5] flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#F87171]" />
          <span>{errors.general}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Row 1 — Personal Names (Two-column layout on desktop/tablet, stacked on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="signup-first-name"
            label="First Name"
            type="text"
            variant="dark"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName || errors.general) {
                setErrors({ ...errors, firstName: undefined, general: undefined });
              }
            }}
            placeholder="Enter your first name"
            error={errors.firstName}
            autoComplete="given-name"
            icon={<User className="w-4 h-4" />}
            disabled={isSubmitting}
            required
          />

          <FormField
            id="signup-last-name"
            label="Last Name"
            type="text"
            variant="dark"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName || errors.general) {
                setErrors({ ...errors, lastName: undefined, general: undefined });
              }
            }}
            placeholder="Enter your last name"
            error={errors.lastName}
            autoComplete="family-name"
            icon={<User className="w-4 h-4" />}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Row 2 — Email Address (Full-width) */}
        <FormField
          id="signup-email"
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

        {/* Row 3 — Password (Full-width) */}
        <FormField
          id="signup-password"
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
          placeholder="Create a password"
          error={errors.password}
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={isSubmitting}
          required
        />

        {/* Row 4 — Confirm Password (Full-width) */}
        <FormField
          id="signup-confirm-password"
          label="Confirm Password"
          type="password"
          variant="dark"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword || errors.general) {
              setErrors({
                ...errors,
                confirmPassword: undefined,
                general: undefined,
              });
            }
          }}
          placeholder="Confirm your password"
          error={errors.confirmPassword}
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          disabled={isSubmitting}
          required
        />

        {/* Primary Action Button (Pearl Gold) */}
        <button
          type="submit"
          id="signup-submit-btn"
          disabled={isSubmitting}
          className="w-full h-12 mt-2 rounded-full bg-[#EAB308] hover:bg-[#FACC15] active:bg-[#EAB308] text-[#0F172A] font-bold text-sm tracking-wider uppercase transition-colors shadow-[0_6px_20px_rgba(234,179,8,0.24)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>REGISTERING...</span>
            </>
          ) : (
            <span>REGISTER</span>
          )}
        </button>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-5 text-center text-sm text-[#CBD5E1]">
        <span>Already have an account? </span>
        <button
          type="button"
          id="btn-switch-to-login"
          onClick={() => onSwitchToLogin(formData.email.trim())}
          disabled={isSubmitting}
          className="min-h-[44px] inline-flex items-center font-semibold text-[#EAB308] hover:text-[#FACC15] hover:underline underline-offset-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] rounded px-0.5 disabled:opacity-50"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
