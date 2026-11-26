import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe, Search, AlertCircle, X } from 'lucide-react';
import { ALL_NATIONALITY_OPTIONS } from '../data/countryOptions';

interface SearchableCountrySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SearchableCountrySelect: React.FC<SearchableCountrySelectProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NATIONALITY_OPTIONS;
    return ALL_NATIONALITY_OPTIONS.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.regionTag && opt.regionTag.toLowerCase().includes(q))
    );
  }, [query]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 10);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (!disabled) setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length === 0 ? 0 : (prev + 1) % filteredOptions.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredOptions.length === 0
          ? 0
          : (prev - 1 + filteredOptions.length) % filteredOptions.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredOptions[highlightedIndex];
      if (target) handleSelect(target.name);
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="block text-sm font-semibold text-pearl-text">
          {label}
          {required && <span className="text-pearl-danger-light ml-1" aria-hidden="true">*</span>}
        </label>
      </div>

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-invalid={Boolean(error)}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full h-11 rounded-xl bg-pearl-input border px-3.5 flex items-center justify-between gap-2 text-left text-sm transition-colors cursor-pointer focus:outline-none ${
          error
            ? 'border-pearl-danger focus:border-pearl-danger focus:ring-2 focus:ring-pearl-danger/20'
            : isOpen
            ? 'border-pearl-gold ring-2 ring-pearl-gold/35'
            : 'border-pearl-border hover:border-pearl-border focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35'
        } disabled:bg-pearl-input disabled:text-pearl-placeholder disabled:cursor-not-allowed`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Globe className="w-4 h-4 text-pearl-text-secondary shrink-0" />
          <span className={`truncate ${value ? 'text-pearl-text font-medium' : 'text-pearl-placeholder'}`}>
            {value || 'Select your nationality'}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-pearl-gold-light shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1.5 w-full rounded-xl bg-pearl-dark border border-pearl-border shadow-lg overflow-hidden">
          <div className="p-2 border-b border-pearl-border bg-pearl-dark">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-pearl-text-secondary absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                id={`${id}-search`}
                role="combobox"
                value={query}
                aria-controls={`${id}-listbox`}
                aria-expanded={isOpen}
                aria-activedescendant={
                  filteredOptions[highlightedIndex]
                    ? `${id}-option-${highlightedIndex}`
                    : undefined
                }
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search country or EAC partner state..."
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-pearl-navy border border-pearl-border text-sm text-pearl-text placeholder:text-pearl-placeholder focus:outline-none focus:border-pearl-gold focus:ring-2 focus:ring-pearl-gold/35"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear nationality search"
                  className="absolute right-2 text-pearl-text-secondary hover:text-pearl-text p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <ul
            id={`${id}-listbox`}
            role="listbox"
            aria-labelledby={id}
            className="max-h-60 overflow-y-auto py-1 divide-y divide-pearl-border"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3.5 py-4 text-center text-xs text-pearl-text-secondary">
                No countries matched "{query}".
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = value === opt.name;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    id={`${id}-option-${idx}`}
                    key={opt.name}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(opt.name)}
                    className={`px-3.5 py-2.5 text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-pearl-gold/15 text-pearl-text font-semibold'
                        : isHighlighted
                        ? 'bg-pearl-slate text-pearl-text'
                        : 'text-pearl-text hover:bg-pearl-slate'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{opt.name}</span>
                      {opt.regionTag && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-pearl-input text-pearl-text-secondary border border-pearl-border shrink-0">
                          {opt.regionTag}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-pearl-gold-light shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-pearl-danger-light"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-xs text-pearl-text-secondary leading-relaxed">{helperText}</p>
      ) : null}
    </div>
  );
};
