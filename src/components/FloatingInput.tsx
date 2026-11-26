import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FloatingInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  icon?: React.ReactNode;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  autoComplete,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasValue = value.length > 0;
  const isLabelFloated = isFocused || hasValue;

  return (
    <div className="relative w-full mb-4">
      {/* Outer wrapper with inset shadow */}
      <div
        className={`relative flex items-center rounded-2xl transition-all duration-300 ${
          isFocused ? 'neu-inset-focus bg-pearl-input' : 'neu-inset bg-pearl-input'
        } ${error ? 'ring-2 ring-pearl-danger/70' : ''}`}
      >
        {/* Optional Leading Icon */}
        {icon && (
          <div className="pl-4 pr-1 text-pearl-placeholder flex items-center justify-center pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input Container with relative label */}
        <div className="relative flex-1 py-3 px-4">
          <input
            id={id}
            type={effectiveType}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoComplete={autoComplete}
            required={required}
            className="w-full bg-transparent text-pearl-text text-sm font-medium pt-3.5 pb-0.5 outline-none placeholder-transparent transition-all"
            placeholder={label}
          />

          {/* Floating Label */}
          <label
            htmlFor={id}
            className={`absolute left-4 transition-all duration-200 pointer-events-none select-none font-medium ${
              isLabelFloated
                ? 'top-1.5 text-[10.5px] font-semibold tracking-wide uppercase ' +
                  (isFocused
                    ? 'text-pearl-danger-light'
                    : error
                    ? 'text-pearl-danger-light'
                    : 'text-pearl-placeholder')
                : 'top-3.5 text-sm text-pearl-placeholder'
            }`}
          >
            {label}
            {required && <span className="text-pearl-danger-light ml-0.5">*</span>}
          </label>
        </div>

        {/* Password visibility toggle */}
        {isPassword && (
          <button
            type="button"
            id={`${id}-toggle-visibility`}
            onClick={() => setShowPassword(!showPassword)}
            className="p-3 mr-1 text-pearl-placeholder hover:text-pearl-text-secondary transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 transition-transform active:scale-90" />
            ) : (
              <Eye className="w-4 h-4 transition-transform active:scale-90" />
            )}
          </button>
        )}

        {/* Dynamic yellow-to-red expandable accent bottom line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-b-2xl bg-gradient-to-r from-pearl-gold via-pearl-gold-light to-pearl-danger"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: isFocused ? 1 : 0,
            opacity: isFocused ? 1 : 0,
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ originX: 0.5 }}
        />
      </div>

      {/* Floating Validation Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 mt-1.5 px-2 text-xs font-semibold text-pearl-danger-light"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
