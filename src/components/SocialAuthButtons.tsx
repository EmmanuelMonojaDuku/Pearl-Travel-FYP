import React, { useState } from 'react';
import { motion } from 'motion/react';

interface SocialAuthButtonsProps {
  onSelectProvider?: (provider: string) => void;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onSelectProvider }) => {
  const [clickedProvider, setClickedProvider] = useState<string | null>(null);

  const handleClick = (name: string) => {
    setClickedProvider(name);
    setTimeout(() => setClickedProvider(null), 350);
    onSelectProvider?.(name);
  };

  return (
    <div className="flex items-center justify-center gap-4 my-2">
      {/* Google */}
      <motion.button
        type="button"
        id="social-btn-google"
        onClick={() => handleClick('Google')}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center neu-btn-icon relative ${
          clickedProvider === 'Google' ? 'neu-btn-pressed' : ''
        }`}
        title="Continue with Google"
        aria-label="Continue with Google"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.1-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
          />
        </svg>
      </motion.button>

      {/* Apple */}
      <motion.button
        type="button"
        id="social-btn-apple"
        onClick={() => handleClick('Apple')}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center neu-btn-icon relative ${
          clickedProvider === 'Apple' ? 'neu-btn-pressed' : ''
        }`}
        title="Continue with Apple"
        aria-label="Continue with Apple"
      >
        <svg className="w-4 h-4 fill-gray-900" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.18.66-2.87 1.48-.61.71-1.15 1.88-1.01 2.98 1.08.08 2.23-.54 2.89-1.36z" />
        </svg>
      </motion.button>

      {/* Facebook */}
      <motion.button
        type="button"
        id="social-btn-facebook"
        onClick={() => handleClick('Facebook')}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-11 h-11 rounded-full flex items-center justify-center neu-btn-icon relative ${
          clickedProvider === 'Facebook' ? 'neu-btn-pressed' : ''
        }`}
        title="Continue with Facebook"
        aria-label="Continue with Facebook"
      >
        <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </motion.button>
    </div>
  );
};
