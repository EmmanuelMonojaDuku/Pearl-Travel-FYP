import type { LegalSlug } from '../config/site';
import { SITE } from '../config/site';

export interface LegalSection { heading: string; paragraphs?: string[]; bullets?: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[] }

const UPDATED = '26 November 2026';
const CONTACT = `Questions? Contact ${SITE.supportEmail}.`;

export const LEGAL: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Privacy Policy',
    updated: UPDATED,
    intro: 'This policy explains what information Pearl Travel handles, where it is kept, and the choices you have.',
    sections: [
      {
        heading: 'Information we handle',
        bullets: [
          'Account details: your name, email address, phone number and a password (stored only as a one-way hash, never in readable form).',
          'Sign in with Google: your Google name, email address and profile picture. We never see your Google password.',
          'Traveller profile: nationality, gender, passport number and expiry, travel purpose and emergency contact details that you enter.',
          'Journey and checklist data: your chosen border post, travel date and mode, and the status you give each document.',
          'Readiness QR summary: your name, nationality, travel purpose, readiness score and document statuses. It does not include your passport number.',
        ],
      },
      {
        heading: 'Where your information is kept',
        paragraphs: [
          'By default your profile, checklist and settings are stored in your own browser (local storage) on your device. Clearing your browser data removes them.',
          'When the Pearl Travel server is connected, your account record is stored in a database managed for Pearl Travel, and passwords are hashed with Argon2id.',
        ],
      },
      {
        heading: 'Who else may receive information',
        bullets: [
          'Google, when you choose Continue with Google, and because fonts are loaded from Google Fonts (your IP address is visible to Google).',
          'Your browser or device vendor, if you use voice input or read-aloud. Some browsers send audio to their own speech services.',
          'An email delivery provider, only if the server is configured to send account emails.',
          'Anyone who scans your QR code can read the summary it contains. Share it only with border officers or people you trust.',
        ],
        paragraphs: ['We do not sell your information, show advertising, or use third-party analytics.'],
      },
      {
        heading: 'Your choices',
        bullets: [
          'Edit your profile at any time from the Profile screen.',
          'Delete locally stored data by clearing this site\'s data in your browser.',
          `Ask us to delete or export a server account by emailing ${SITE.supportEmail}.`,
        ],
      },
      { heading: 'Children', paragraphs: ['Pearl Travel is intended for adults. A parent or guardian should manage the profile of a child travelling with them.'] },
      { heading: 'Changes and contact', paragraphs: ['We will update the date above when this policy changes.', CONTACT] },
    ],
  },
  terms: {
    title: 'Terms of Use',
    updated: UPDATED,
    intro: 'By using Pearl Travel you agree to these terms.',
    sections: [
      {
        heading: 'What Pearl Travel is',
        paragraphs: ['Pearl Travel is a preparation tool that explains border requirements, tracks your documents and estimates your readiness. It is not a government service and does not issue visas, permits or approvals.'],
      },
      {
        heading: 'Your responsibilities',
        bullets: [
          'Give accurate information and keep your account secure.',
          'Always confirm requirements with official sources before you travel.',
          'Do not misuse the service, attempt to access other people\'s data, or present your QR summary as an official document.',
        ],
      },
      {
        heading: 'Content and availability',
        paragraphs: ['Guidance can change without notice. We work to keep content current but do not guarantee that it is complete or error-free, and some features may be unavailable at times.'],
      },
      {
        heading: 'Limitation of liability',
        paragraphs: ['To the extent allowed by law, Pearl Travel is not liable for denied entry, delays, costs or losses that result from relying on the app instead of official requirements.'],
      },
      { heading: 'Law and contact', paragraphs: ['These terms are governed by the laws of the Republic of Uganda.', CONTACT] },
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    updated: UPDATED,
    intro: 'Please read this before relying on anything in the app.',
    sections: [
      {
        heading: 'Not an official source',
        paragraphs: ['Pearl Travel is independent. It is not operated by, or affiliated with, the Directorate of Citizenship and Immigration Control (DCIC), the Uganda Revenue Authority, the Ministry of Health or any other government body.'],
      },
      {
        heading: 'Readiness score and QR summary',
        paragraphs: ['The readiness score and QR summary are preparation aids created from information you entered. They are not an immigration approval, clearance decision or proof that your documents are valid. Border officers make the final decision.'],
      },
      {
        heading: 'Assistant answers',
        paragraphs: ['The travel assistant answers from a limited, reviewed set of guidance and from your own checklist. If it has no verified answer it will say so. Always confirm important details on the official sources listed in the footer.'],
      },
      { heading: 'Contact', paragraphs: [CONTACT] },
    ],
  },
};
