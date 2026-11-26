import React from 'react';
import { motion } from 'motion/react';
import {
  User,
  Globe,
  Compass,
  MapPin,
  Calendar,
  ShieldAlert,
  Plane,
  Check,
  Building,
  HeartPulse,
  Phone,
  Mail,
  HeartHandshake,
  Settings,
  Camera,
  Trash2,
  X,
  Eye,
} from 'lucide-react';
import { PassengerProfile, TravelPurpose, TravellerType, GenderType } from '../types';
import { POPULAR_NATIONALITIES, POPULAR_DESTINATIONS } from '../data/travelRequirementsEngine';
import { AvatarUploader } from './AvatarUploader';
import { isTravellerProfileComplete } from '../utils/authStorage';

interface PassengerProfileCardProps {
  profile: PassengerProfile;
  onChange: (updated: PassengerProfile) => void;
  onResetToDemo: () => void;
  onOpenSettings?: () => void;
  onOpenReviewAudit?: () => void;
}

const COUNTRY_CODES = [
  { code: '+256', label: 'UG (+256)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+254', label: 'KE (+254)' },
  { code: '+250', label: 'RW (+250)' },
  { code: '+255', label: 'TZ (+255)' },
  { code: '+49', label: 'DE (+49)' },
  { code: '+33', label: 'FR (+33)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+27', label: 'ZA (+27)' },
];

const GENDER_CHOICES: GenderType[] = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];

export const PassengerProfileCard: React.FC<PassengerProfileCardProps> = ({
  profile,
  onChange,
  onResetToDemo,
  onOpenSettings,
  onOpenReviewAudit,
}) => {
  const purposes: { value: TravelPurpose; label: string; desc: string }[] = [
    { value: 'tourism', label: 'Safari & Wildlife Tourism', desc: 'Gorillas & Savanna Parks' },
    { value: 'business', label: 'Business & Investment Trade', desc: 'Commercial meetings & trade' },
    { value: 'family', label: 'Family & Friends Stay', desc: 'Visiting Ugandan residents' },
    { value: 'studies', label: 'Academic Studies & Research', desc: 'University & field research' },
    { value: 'transit', label: 'Entebbe Airport Transit', desc: 'Connecting flight through EBB' },
    { value: 'employment', label: 'Work & Humanitarian NGO', desc: 'Aid missions & official' },
  ];

  const travellerTypes: { value: TravellerType; label: string }[] = [
    { value: 'solo', label: 'Solo Traveler' },
    { value: 'family', label: 'Family / Minors' },
    { value: 'tourist', label: 'Tour Group' },
    { value: 'business', label: 'Corporate' },
    { value: 'resident', label: 'Resident / Expat' },
    { value: 'student', label: 'Student' },
  ];

  // Sync first and last name if not explicitly set
  const firstName = profile.firstName || profile.fullName.split(' ')[0] || '';
  const lastName = profile.lastName || profile.fullName.split(' ').slice(1).join(' ') || '';
  const isProfileComplete = isTravellerProfileComplete(profile);

  const handleFirstNameChange = (val: string) => {
    const newFullName = `${val} ${lastName}`.trim() || 'Passenger';
    onChange({
      ...profile,
      firstName: val,
      fullName: newFullName,
    });
  };

  const handleLastNameChange = (val: string) => {
    const newFullName = `${firstName} ${val}`.trim() || 'Passenger';
    onChange({
      ...profile,
      lastName: val,
      fullName: newFullName,
    });
  };

  return (
    <div className="w-full bg-pearl-dark rounded-2xl p-5 sm:p-7 border border-pearl-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-pearl-border gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-semibold ${isProfileComplete ? 'text-pearl-success-light' : 'text-pearl-accent'}`}>
              {isProfileComplete ? 'Complete' : 'In progress'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-pearl-text font-heading mt-0.5">
            Profile
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {onOpenReviewAudit && (
            <button
              type="button"
              id="btn-open-review-audit-from-profile"
              onClick={onOpenReviewAudit}
              className="text-xs font-semibold text-pearl-text hover:bg-pearl-input py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors bg-pearl-surface border border-pearl-border"
            >
              <Eye className="w-3.5 h-3.5 text-pearl-text-secondary" />
              <span>Review</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              id="btn-open-settings-from-profile"
              onClick={onOpenSettings}
              className="text-xs font-semibold text-pearl-text hover:bg-pearl-input py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors bg-pearl-surface border border-pearl-border"
            >
              <Settings className="w-3.5 h-3.5 text-pearl-text-secondary" />
              <span>Settings</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetToDemo}
            className="text-xs font-semibold text-pearl-text-secondary hover:text-pearl-text transition-colors py-1.5 px-3 rounded-lg bg-pearl-surface border border-pearl-border cursor-pointer"
          >
            Sample data
          </button>
        </div>
      </div>

      {/* Profile Photo / Avatar Upload Section */}
      <div className="mb-6 p-4 rounded-xl bg-pearl-surface border border-pearl-border flex flex-col md:flex-row items-center gap-4">
        <AvatarUploader
          currentAvatarUrl={profile.avatarUrl}
          userName={profile.fullName || 'Passenger'}
          onAvatarChange={(newUrl) => onChange({ ...profile, avatarUrl: newUrl })}
          size="lg"
        />
        <div className="min-w-0 flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-pearl-text">
            <Camera className="w-3.5 h-3.5 text-pearl-accent" />
            <span>Photo <span className="text-pearl-placeholder font-medium">(optional)</span></span>
          </div>
          <h3 className="mt-1 text-lg font-bold text-pearl-text truncate">
            {profile.fullName || 'Traveller'}
          </h3>
          <p className="text-xs text-pearl-text-secondary mt-1">
            {profile.nationality || 'Nationality not set'}
          </p>
          <p className={`text-xs font-semibold mt-1 ${isProfileComplete ? 'text-pearl-success-light' : 'text-pearl-accent'}`}>
            {isProfileComplete ? 'Profile complete' : 'Profile in progress'}
          </p>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-pearl-text">
        Personal Information
      </h3>
      {/* Personal Identity Grid: Names, Gender, Nationality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* First Name */}
        <div>
          <label htmlFor="passenger-first-name" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>First Name</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border focus-within:ring-2 focus-within:ring-pearl-gold/35 rounded-xl px-3.5 py-2.5 transition-colors">
            <input
              id="passenger-first-name"
              type="text"
              value={firstName}
              onChange={(e) => handleFirstNameChange(e.target.value)}
              placeholder="e.g. Maya"
              className="w-full bg-transparent text-sm font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
            />
          </div>
        </div>

        {/* Last Name */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="passenger-last-name" className="text-xs font-bold text-pearl-text uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-pearl-placeholder" />
              <span>Last Name</span>
            </label>
            {lastName && (
              <button
                type="button"
                onClick={() => handleLastNameChange('')}
                className="text-[11px] font-semibold text-pearl-danger-light hover:underline flex items-center gap-0.5 cursor-pointer"
                title="Delete last name (if unintended or single name traveler)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            )}
          </div>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border focus-within:ring-2 focus-within:ring-pearl-gold/35 rounded-xl px-3.5 py-2.5 flex items-center transition-colors">
            <input
              id="passenger-last-name"
              type="text"
              value={lastName}
              onChange={(e) => handleLastNameChange(e.target.value)}
              placeholder="e.g. Chen"
              className="w-full bg-transparent text-sm font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
            />
            {lastName && (
              <button
                type="button"
                onClick={() => handleLastNameChange('')}
                className="text-pearl-placeholder hover:text-pearl-danger-light p-0.5 ml-1 cursor-pointer"
                title="Clear last name"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Nationality */}
        <div>
          <label htmlFor="passenger-nationality" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>Nationality</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border focus-within:ring-2 focus-within:ring-pearl-gold/35 rounded-xl px-3.5 py-2.5 transition-colors">
            <select
              id="passenger-nationality"
              value={profile.nationality}
              onChange={(e) => onChange({ ...profile, nationality: e.target.value })}
              className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none cursor-pointer"
            >
              {POPULAR_NATIONALITIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Gender Selection */}
        <div>
          <span id="profile-card-gender-label" className="block text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5">
            Gender
          </span>
          <div role="radiogroup" aria-labelledby="profile-card-gender-label" className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {GENDER_CHOICES.map((g) => {
              const isSelected = (profile.gender || 'Prefer not to say') === g;
              return (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onChange({ ...profile, gender: g })}
                  className={`min-h-[44px] py-2.5 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-gold ${
                    isSelected
                      ? 'bg-pearl-gold/15 text-pearl-text border-pearl-gold ring-1 ring-pearl-gold'
                      : 'bg-pearl-surface text-pearl-text-secondary border-pearl-border hover:bg-pearl-input hover:text-pearl-text'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="mb-5 p-4 rounded-xl bg-pearl-surface border border-pearl-border">
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-pearl-text" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-pearl-text">
            Contact &amp; Emergency Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Phone / WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="passenger-phone" className="block text-[11px] font-semibold text-pearl-text-secondary">
                Phone
              </label>
              {profile.phoneNumber && (
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, phoneNumber: '' })}
                  className="text-[10px] font-semibold text-pearl-danger-light hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Delete phone number"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-2 py-2">
                <select
                  aria-label="Country calling code"
                  value={profile.countryCode || '+256'}
                  onChange={(e) => onChange({ ...profile, countryCode: e.target.value })}
                  className="w-full bg-transparent text-xs font-bold text-pearl-text outline-none cursor-pointer"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3 py-2 flex items-center">
                <input
                  id="passenger-phone"
                  type="tel"
                  value={profile.phoneNumber || ''}
                  onChange={(e) => onChange({ ...profile, phoneNumber: e.target.value })}
                  placeholder="e.g. 772 123456"
                  className="w-full bg-transparent text-xs font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
                />
                {profile.phoneNumber && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...profile, phoneNumber: '' })}
                    className="text-pearl-placeholder hover:text-pearl-danger-light p-0.5 ml-1 cursor-pointer"
                    title="Clear phone number"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="passenger-email" className="text-[11px] font-semibold text-pearl-text-secondary mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3 text-pearl-placeholder" />
              <span>Email</span>
            </label>
            <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2">
              <input
                id="passenger-email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => onChange({ ...profile, email: e.target.value })}
                placeholder="passenger@domain.com"
                className="w-full bg-transparent text-xs font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
              />
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="emergency-contact-name" className="text-[11px] font-semibold text-pearl-text-secondary flex items-center gap-1">
                <HeartHandshake className="w-3 h-3 text-pearl-accent" />
                <span>Emergency contact</span>
              </label>
              {profile.emergencyContactName && (
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, emergencyContactName: '' })}
                  className="text-[10px] font-semibold text-pearl-danger-light hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Delete emergency contact name"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2 flex items-center">
              <input
                id="emergency-contact-name"
                type="text"
                value={profile.emergencyContactName || ''}
                onChange={(e) => onChange({ ...profile, emergencyContactName: e.target.value })}
                placeholder="Relative or safari guide (optional)"
                className="w-full bg-transparent text-xs font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
              />
              {profile.emergencyContactName && (
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, emergencyContactName: '' })}
                  className="text-pearl-placeholder hover:text-pearl-danger-light p-0.5 ml-1 cursor-pointer"
                  title="Clear emergency contact"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Emergency Contact Phone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="emergency-contact-phone" className="block text-[11px] font-semibold text-pearl-text-secondary">
                Emergency phone
              </label>
              {profile.emergencyContactPhone && (
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, emergencyContactPhone: '' })}
                  className="text-[10px] font-semibold text-pearl-danger-light hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Delete emergency contact phone"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2 flex items-center">
              <input
                id="emergency-contact-phone"
                type="tel"
                value={profile.emergencyContactPhone || ''}
                onChange={(e) => onChange({ ...profile, emergencyContactPhone: e.target.value })}
                placeholder="+256 772 019283 (optional)"
                className="w-full bg-transparent text-xs font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
              />
              {profile.emergencyContactPhone && (
                <button
                  type="button"
                  onClick={() => onChange({ ...profile, emergencyContactPhone: '' })}
                  className="text-pearl-placeholder hover:text-pearl-danger-light p-0.5 ml-1 cursor-pointer"
                  title="Clear phone number"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="emergency-contact-relationship" className="block text-[11px] font-semibold text-pearl-text-secondary mb-1">
              Relationship
            </label>
            <div className="bg-pearl-input border border-pearl-border rounded-xl px-3.5 py-2">
              <input
                id="emergency-contact-relationship"
                type="text"
                value={profile.emergencyContactRelation || ''}
                onChange={(e) => onChange({ ...profile, emergencyContactRelation: e.target.value })}
                placeholder="e.g. Parent, spouse, friend"
                className="w-full bg-transparent text-xs font-semibold text-pearl-text placeholder:text-pearl-placeholder outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Travel Purpose & Destination */}
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-pearl-text">
        Travel Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Travel Purpose */}
        <div>
          <label htmlFor="passenger-travel-purpose" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>Travel Purpose</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
            <select
              id="passenger-travel-purpose"
              value={profile.travelPurpose}
              onChange={(e) =>
                onChange({ ...profile, travelPurpose: e.target.value as TravelPurpose })
              }
              className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none cursor-pointer"
            >
              {purposes.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="passenger-destination" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>Primary Uganda Destination</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
            <select
              id="passenger-destination"
              value={profile.destination}
              onChange={(e) => onChange({ ...profile, destination: e.target.value })}
              className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none cursor-pointer"
            >
              {POPULAR_DESTINATIONS.map((dest) => (
                <option key={dest} value={dest}>
                  {dest}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type of Traveller */}
        <div>
          <label htmlFor="passenger-traveller-type" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>Type of Traveller</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5">
            <select
              id="passenger-traveller-type"
              value={profile.travellerType}
              onChange={(e) =>
                onChange({ ...profile, travellerType: e.target.value as TravellerType })
              }
              className="w-full bg-transparent text-sm font-semibold text-pearl-text outline-none cursor-pointer"
            >
              {travellerTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stay Duration */}
        <div>
          <label htmlFor="passenger-stay-duration" className="text-xs font-bold text-pearl-text uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-pearl-placeholder" />
            <span>Intended Length of Stay</span>
          </label>
          <div className="bg-pearl-input border border-pearl-border focus-within:border-pearl-border rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <input
              id="passenger-stay-duration"
              type="number"
              min="1"
              max="365"
              value={profile.stayDurationDays}
              onChange={(e) =>
                onChange({
                  ...profile,
                  stayDurationDays: parseInt(e.target.value) || 1,
                })
              }
              className="w-24 bg-transparent text-sm font-semibold text-pearl-text outline-none tabular-nums"
            />
            <span className="text-xs font-semibold text-pearl-placeholder">Days</span>
          </div>
        </div>
      </div>

      {/* Travel Requirements / Clearances Toggles */}
      <div className="pt-4 border-t border-pearl-border">
        <h3 className="block text-sm font-bold text-pearl-text uppercase tracking-wider mb-3">
          Travel Clearances &amp; Booking Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Yellow Fever */}
          <button
            type="button"
            onClick={() =>
              onChange({ ...profile, hasYellowFeverVax: !profile.hasYellowFeverVax })
            }
            className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border text-left ${
              profile.hasYellowFeverVax
                ? 'bg-pearl-surface border-pearl-gold'
                : 'bg-pearl-surface border-pearl-border hover:bg-pearl-input'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  profile.hasYellowFeverVax
                    ? 'bg-pearl-gold text-pearl-text'
                    : 'bg-pearl-dark text-pearl-text-secondary border border-pearl-border'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-pearl-text">Yellow Fever Card</p>
                <p className="text-[11px] text-pearl-text-secondary">Mandatory for Uganda entry</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                profile.hasYellowFeverVax
                  ? 'bg-pearl-gold text-pearl-navy font-bold'
                  : 'bg-pearl-input border border-pearl-border'
              }`}
            >
              {profile.hasYellowFeverVax && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Return Ticket */}
          <button
            type="button"
            onClick={() =>
              onChange({ ...profile, hasReturnTicket: !profile.hasReturnTicket })
            }
            className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border text-left ${
              profile.hasReturnTicket
                ? 'bg-pearl-success/15 border-pearl-success/40'
                : 'bg-pearl-surface border-pearl-border hover:bg-pearl-input'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  profile.hasReturnTicket
                    ? 'bg-pearl-success/15 text-pearl-text'
                    : 'bg-pearl-dark text-pearl-text-secondary border border-pearl-border'
                }`}
              >
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-pearl-text">Return Ticket</p>
                <p className="text-[11px] text-pearl-text-secondary">Outbound flight or bus booked</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                profile.hasReturnTicket
                  ? 'bg-pearl-success/15 text-pearl-text'
                  : 'bg-pearl-input border border-pearl-border'
              }`}
            >
              {profile.hasReturnTicket && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Accommodation */}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...profile,
                hasAccommodationProof: !profile.hasAccommodationProof,
              })
            }
            className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border text-left ${
              profile.hasAccommodationProof
                ? 'bg-pearl-input border-pearl-border'
                : 'bg-pearl-surface border-pearl-border hover:bg-pearl-input'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  profile.hasAccommodationProof
                    ? 'bg-pearl-gold text-pearl-navy font-bold'
                    : 'bg-pearl-dark text-pearl-text-secondary border border-pearl-border'
                }`}
              >
                <Building className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-pearl-text">Accommodation</p>
                <p className="text-[11px] text-pearl-text-secondary">Hotel, lodge, or host address</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                profile.hasAccommodationProof
                  ? 'bg-pearl-gold text-pearl-navy font-bold'
                  : 'bg-pearl-input border border-pearl-border'
              }`}
            >
              {profile.hasAccommodationProof && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>

          {/* Travel Insurance */}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...profile,
                hasTravelInsurance: !profile.hasTravelInsurance,
              })
            }
            className={`p-3.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between border text-left ${
              profile.hasTravelInsurance
                ? 'bg-pearl-input border-pearl-border'
                : 'bg-pearl-surface border-pearl-border hover:bg-pearl-input'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  profile.hasTravelInsurance
                    ? 'bg-pearl-gold text-pearl-navy font-bold'
                    : 'bg-pearl-dark text-pearl-text-secondary border border-pearl-border'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-pearl-text">Travel Health Insurance</p>
                <p className="text-[11px] text-pearl-text-secondary">Medical evacuation covered</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                profile.hasTravelInsurance
                  ? 'bg-pearl-gold text-pearl-navy font-bold'
                  : 'bg-pearl-input border border-pearl-border'
              }`}
            >
              {profile.hasTravelInsurance && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
