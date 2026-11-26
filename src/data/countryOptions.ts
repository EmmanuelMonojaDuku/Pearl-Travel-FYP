import { EAST_AFRICAN_COMMUNITY, POPULAR_NATIONALITIES } from './travelRequirementsEngine';

export interface CountryCallingCode {
  code: string;
  iso: string;
  country: string;
}

export interface NationalityOption {
  name: string;
  regionTag?: string;
}

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { code: '+256', iso: 'UG', country: 'Uganda' },
  { code: '+254', iso: 'KE', country: 'Kenya' },
  { code: '+255', iso: 'TZ', country: 'Tanzania' },
  { code: '+250', iso: 'RW', country: 'Rwanda' },
  { code: '+257', iso: 'BI', country: 'Burundi' },
  { code: '+211', iso: 'SS', country: 'South Sudan' },
  { code: '+243', iso: 'CD', country: 'DR Congo' },
  { code: '+252', iso: 'SO', country: 'Somalia' },
  { code: '+1', iso: 'US/CA', country: 'United States / Canada' },
  { code: '+44', iso: 'GB', country: 'United Kingdom' },
  { code: '+49', iso: 'DE', country: 'Germany' },
  { code: '+33', iso: 'FR', country: 'France' },
  { code: '+31', iso: 'NL', country: 'Netherlands' },
  { code: '+32', iso: 'BE', country: 'Belgium' },
  { code: '+41', iso: 'CH', country: 'Switzerland' },
  { code: '+46', iso: 'SE', country: 'Sweden' },
  { code: '+47', iso: 'NO', country: 'Norway' },
  { code: '+39', iso: 'IT', country: 'Italy' },
  { code: '+34', iso: 'ES', country: 'Spain' },
  { code: '+971', iso: 'AE', country: 'United Arab Emirates' },
  { code: '+966', iso: 'SA', country: 'Saudi Arabia' },
  { code: '+974', iso: 'QA', country: 'Qatar' },
  { code: '+91', iso: 'IN', country: 'India' },
  { code: '+86', iso: 'CN', country: 'China' },
  { code: '+81', iso: 'JP', country: 'Japan' },
  { code: '+82', iso: 'KR', country: 'South Korea' },
  { code: '+65', iso: 'SG', country: 'Singapore' },
  { code: '+61', iso: 'AU', country: 'Australia' },
  { code: '+64', iso: 'NZ', country: 'New Zealand' },
  { code: '+27', iso: 'ZA', country: 'South Africa' },
  { code: '+234', iso: 'NG', country: 'Nigeria' },
  { code: '+233', iso: 'GH', country: 'Ghana' },
  { code: '+251', iso: 'ET', country: 'Ethiopia' },
  { code: '+20', iso: 'EG', country: 'Egypt' },
  { code: '+212', iso: 'MA', country: 'Morocco' },
  { code: '+55', iso: 'BR', country: 'Brazil' },
];

const ADDITIONAL_NATIONALITIES = [
  'Belgium',
  'Brazil',
  'Denmark',
  'Egypt',
  'Ethiopia',
  'Finland',
  'Ghana',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Malaysia',
  'Malawi',
  'Mauritius',
  'Morocco',
  'New Zealand',
  'Norway',
  'Poland',
  'Portugal',
  'Qatar',
  'Saudi Arabia',
  'Senegal',
  'Seychelles',
  'Singapore',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'Zambia',
  'Zimbabwe',
];

export const ALL_NATIONALITY_OPTIONS: NationalityOption[] = (() => {
  const seen = new Set<string>();
  const list: NationalityOption[] = [];

  for (const country of EAST_AFRICAN_COMMUNITY) {
    if (!seen.has(country)) {
      seen.add(country);
      list.push({
        name: country,
        regionTag: country === 'Uganda' ? 'Citizen' : 'EAC Partner State',
      });
    }
  }

  const remaining = [...POPULAR_NATIONALITIES, ...ADDITIONAL_NATIONALITIES]
    .filter((country) => !seen.has(country))
    .sort((a, b) => a.localeCompare(b));

  for (const country of remaining) {
    if (!seen.has(country)) {
      seen.add(country);
      list.push({ name: country });
    }
  }

  return list;
})();

export const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Relative',
  'Friend',
  'Colleague',
  'Other',
];
