import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, User } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  userName?: string;
  onAvatarChange: (newUrl: string | undefined) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatarUrl,
  userName = 'Traveller',
  onAvatarChange,
  size = 'md',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dimensionClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl',
  }[size];

  const handleFile = (file: File) => {
    setErrorMsg(null);

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be under 5 MB.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAvatarChange(reader.result);
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMsg('Unable to read the selected image file.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const initials = (userName || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Choose a traveller photo"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative ${dimensionClasses} rounded-full border-2 p-0.5 cursor-pointer group transition-colors flex items-center justify-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
          dragOver ? 'border-pearl-gold bg-pearl-gold/10' : 'border-pearl-border bg-pearl-input'
        }`}
        aria-label={currentAvatarUrl ? 'Change traveller photo' : 'Upload traveller photo'}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-pearl-input flex items-center justify-center relative">
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-pearl-text-secondary bg-pearl-input">
              {initials || <User className="w-6 h-6 text-pearl-text-secondary" />}
            </div>
          )}

          <div className="absolute inset-0 bg-pearl-navy/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-pearl-text text-[10px] font-semibold gap-0.5">
            <Camera className="w-4 h-4 text-pearl-gold-light" />
            <span>Change</span>
          </div>

          {isProcessing && (
            <div className="absolute inset-0 bg-pearl-navy/60 flex items-center justify-center">
              <span className="animate-spin text-pearl-text text-xs">●</span>
            </div>
          )}
        </div>
      </button>

      <div className="flex flex-col items-center sm:items-start gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3.5 rounded-xl border border-pearl-border bg-pearl-input hover:bg-pearl-input text-xs font-semibold text-pearl-text flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-pearl-text" />
            <span>{currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => onAvatarChange(undefined)}
              className="h-9 px-3 rounded-xl border border-pearl-border bg-pearl-input hover:bg-pearl-danger/15 hover:border-pearl-danger/30 text-xs font-medium text-pearl-danger-light flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        <p className="text-xs text-pearl-text-secondary text-center sm:text-left">
          PNG, JPG, or WebP up to 5 MB. You can skip this or add a photo anytime.
        </p>

        {errorMsg && (
          <p role="alert" className="text-xs font-medium text-pearl-danger-light">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  );
};
