import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionProps {
  /** Button label shown when collapsed */
  label: string;
  /** Content displayed when expanded */
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ label, children }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);

  const contentId = `accordion-content-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="border-b border-pearl-border py-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between text-sm font-medium text-pearl-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold"
        onClick={toggle}
      >
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id={contentId}
        className={`mt-2 overflow-hidden transition-max-height duration-200 ${open ? 'max-h-screen' : 'max-h-0'}`}
        aria-hidden={!open}
      >
        <div className="text-pearl-text-secondary text-sm" >{children}</div>
      </div>
    </div>
  );
};
