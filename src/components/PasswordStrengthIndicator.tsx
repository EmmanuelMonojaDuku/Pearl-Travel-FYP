import React from 'react';
import { motion } from 'motion/react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface PasswordCriteria {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showConfirmMatch?: boolean;
}

export const checkPasswordStrength = (password: string) => {
  const criteria: PasswordCriteria[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'At least 1 number (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special symbol (!@#$...)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label = 'Very Weak';
  let color = 'bg-pearl-danger/15';
  let textColor = 'text-pearl-danger-light';
  let ringColor = 'border-pearl-danger';

  if (!password) {
    score = 0;
    label = 'Enter password';
    color = 'bg-pearl-surface';
    textColor = 'text-pearl-placeholder';
    ringColor = 'border-pearl-border';
  } else if (metCount <= 1) {
    score = 1;
    label = 'Weak';
    color = 'bg-pearl-danger/15';
    textColor = 'text-pearl-danger-light';
    ringColor = 'border-pearl-danger';
  } else if (metCount === 2 || metCount === 3) {
    score = 2;
    label = 'Fair';
    color = 'bg-pearl-gold';
    textColor = 'text-pearl-gold-light';
    ringColor = 'border-pearl-gold';
  } else if (metCount === 4) {
    score = 3;
    label = 'Good';
    color = 'bg-pearl-gold';
    textColor = 'text-pearl-gold-light';
    ringColor = 'border-pearl-gold';
  } else if (metCount === 5) {
    score = 4;
    label = 'Strong';
    color = 'bg-pearl-success';
    textColor = 'text-pearl-success-light';
    ringColor = 'border-pearl-success';
  }

  return { criteria, metCount, score, label, color, textColor, ringColor };
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword,
  showConfirmMatch = true,
}) => {
  const { criteria, score, label, color, textColor } = checkPasswordStrength(password);

  if (!password && !confirmPassword) {
    return null;
  }

  const isMatching =
    Boolean(password) &&
    Boolean(confirmPassword) &&
    password === confirmPassword;
  const isMismatch =
    Boolean(confirmPassword) &&
    password !== confirmPassword;

  return (
    <div className="w-full px-3.5 py-3 rounded-xl bg-pearl-input border border-pearl-border text-xs">
      {/* Top row: Strength label and progress bar */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {score >= 3 ? (
            <ShieldCheck className="w-3.5 h-3.5 text-pearl-success-light" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-pearl-gold" />
          )}
          <span className="font-semibold text-pearl-text-secondary text-xs">
            Password Strength:
          </span>
        </div>
        <span className={`font-bold text-xs tracking-wide uppercase ${textColor}`}>
          {label}
        </span>
      </div>

      {/* 4 Segmented Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full rounded-full bg-pearl-surface p-0.5 mb-2.5 overflow-hidden">
        {[1, 2, 3, 4].map((step) => {
          const isActive = score >= step;
          return (
            <motion.div
              key={step}
              initial={false}
              animate={{
                scaleX: isActive ? 1 : 0.9,
              }}
              className={`h-full rounded-full transition-all duration-300 ${
                isActive ? color : 'bg-transparent'
              }`}
            />
          );
        })}
      </div>

      {/* Real-time Validation Criteria Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
        {criteria.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1.5 py-0.5 transition-colors ${
              item.met ? 'text-pearl-success-light font-semibold' : 'text-pearl-text-secondary'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                item.met
                  ? 'bg-pearl-gold text-pearl-text'
                  : 'bg-pearl-surface text-pearl-text-secondary'
              }`}
            >
              {item.met ? (
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-pearl-slate" />
              )}
            </div>
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Real-time Match Indicator */}
      {showConfirmMatch && confirmPassword !== undefined && confirmPassword.length > 0 && (
        <div
          className={`mt-2 pt-2 border-t border-pearl-border flex items-center gap-1.5 text-xs font-semibold ${
            isMatching ? 'text-pearl-success-light' : 'text-pearl-danger-light'
          }`}
        >
          {isMatching ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Passwords match</span>
            </>
          ) : (
            <>
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Passwords do not match yet</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
