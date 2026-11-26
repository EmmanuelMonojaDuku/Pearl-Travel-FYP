import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LEGAL } from '../content/legal';
import type { LegalSlug } from '../config/site';
import { Footer } from './Footer';

interface Props { slug: LegalSlug; onBack: () => void }

export const LegalPage: React.FC<Props> = ({ slug, onBack }) => {
  const doc = LEGAL[slug];
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const previous = document.title;
    document.title = `${doc.title} · Pearl Travel`;
    return () => { document.title = previous; };
  }, [doc.title]);

  return (
    <div className="min-h-screen flex flex-col bg-pearl-slate text-pearl-text">
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-8">
        <button type="button" onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-pearl-gold hover:text-pearl-gold-light cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-bold font-heading">{doc.title}</h1>
        <p className="text-xs text-pearl-placeholder mt-1">Last updated {doc.updated}</p>
        <p className="mt-4 text-sm text-pearl-text-secondary">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.heading} className="mt-6">
            <h2 className="text-lg font-bold font-heading">{s.heading}</h2>
            {s.paragraphs?.map((p) => <p key={p} className="mt-2 text-sm text-pearl-text-secondary leading-relaxed">{p}</p>)}
            {s.bullets && (
              <ul className="mt-2 space-y-1.5 list-disc pl-5 text-sm text-pearl-text-secondary leading-relaxed marker:text-pearl-gold">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}
      </main>
      <Footer
        quickLinks={[{ label: 'Back to the app', onClick: onBack }]}
      />
    </div>
  );
};
