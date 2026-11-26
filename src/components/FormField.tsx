import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  optional = false,
  disabled = false,
  autoComplete,
  icon,
  variant = 'light',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const isDark = variant === 'dark';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label
          htmlFor={id}
          className={`block text-sm font-semibold ${
            isDark ? 'text-pearl-text' : 'text-pearl-text'
          }`}
        >
          {label}
          {required && (
            <span className="text-pearl-danger-light ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {optional && (
          <span
            className={`text-xs font-medium ${
              isDark ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'
            }`}
          >
            Optional
          </span>
        )}
      </div>

      <div className="relative">
        {icon && (
          <div
            className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 ${
              isDark ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'
            }`}
          >
            {icon}
          </div>
        )}

        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full ${
            isDark
              ? 'dark-auth-input h-12 rounded-xl bg-pearl-input text-pearl-text placeholder:text-pearl-placeholder disabled:bg-pearl-dark/60 disabled:text-pearl-placeholder'
              : 'h-11 rounded-lg bg-pearl-input text-pearl-text placeholder:text-pearl-placeholder disabled:bg-pearl-input disabled:text-pearl-placeholder'
          } border text-sm shadow-none transition-colors focus:outline-none ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${isPassword ? 'pr-12' : 'pr-3.5'} ${
            error
              ? 'border-pearl-danger focus:border-pearl-danger focus:ring-2 focus:ring-pearl-danger/25'
              : isDark
                ? 'border-pearl-border hover:border-pearl-placeholder focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/30'
                : 'border-pearl-border hover:border-pearl-placeholder focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/25'
          } disabled:cursor-not-allowed`}
        />

        {isPassword && (
          <button
            type="button"
            id={`${id}-toggle-visibility`}
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className={`absolute inset-y-0 right-0 flex items-center justify-center min-w-[44px] px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              isDark
                ? 'rounded-r-xl text-pearl-text-secondary hover:text-pearl-text focus-visible:text-pearl-text'
                : 'rounded-r-lg text-pearl-text-secondary hover:text-pearl-text focus-visible:text-pearl-text'
            }`}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className={`mt-1.5 flex items-start gap-1.5 text-xs font-medium ${
            isDark ? 'text-pearl-danger-light' : 'text-pearl-danger-light'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          className={`mt-1.5 text-xs leading-relaxed ${
            isDark ? 'text-pearl-text-secondary' : 'text-pearl-text-secondary'
          }`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
