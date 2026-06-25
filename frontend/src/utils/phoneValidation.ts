export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  minLength: number;
  maxLength: number;
  pattern?: RegExp;
}

export const COUNTRY_CODES: CountryCode[] = [
  // South Asia (priority for India-first ERP)
  { name: 'India',          code: 'IN', dialCode: '+91',  flag: '🇮🇳', minLength: 10, maxLength: 10, pattern: /^[6-9]\d{9}$/ },
  { name: 'Nepal',          code: 'NP', dialCode: '+977', flag: '🇳🇵', minLength: 10, maxLength: 10 },
  { name: 'Bangladesh',     code: 'BD', dialCode: '+880', flag: '🇧🇩', minLength: 10, maxLength: 10, pattern: /^[13-9]\d{9}$/ },
  { name: 'Pakistan',       code: 'PK', dialCode: '+92',  flag: '🇵🇰', minLength: 10, maxLength: 10, pattern: /^3\d{9}$/ },
  { name: 'Sri Lanka',      code: 'LK', dialCode: '+94',  flag: '🇱🇰', minLength: 9,  maxLength: 9  },
  { name: 'Maldives',       code: 'MV', dialCode: '+960', flag: '🇲🇻', minLength: 7,  maxLength: 7  },
  { name: 'Bhutan',         code: 'BT', dialCode: '+975', flag: '🇧🇹', minLength: 8,  maxLength: 8  },
  // North America
  { name: 'United States',  code: 'US', dialCode: '+1',   flag: '🇺🇸', minLength: 10, maxLength: 10, pattern: /^[2-9]\d{9}$/ },
  { name: 'Canada',         code: 'CA', dialCode: '+1',   flag: '🇨🇦', minLength: 10, maxLength: 10, pattern: /^[2-9]\d{9}$/ },
  { name: 'Mexico',         code: 'MX', dialCode: '+52',  flag: '🇲🇽', minLength: 10, maxLength: 10 },
  // Europe
  { name: 'United Kingdom', code: 'GB', dialCode: '+44',  flag: '🇬🇧', minLength: 10, maxLength: 10 },
  { name: 'Germany',        code: 'DE', dialCode: '+49',  flag: '🇩🇪', minLength: 10, maxLength: 11 },
  { name: 'France',         code: 'FR', dialCode: '+33',  flag: '🇫🇷', minLength: 9,  maxLength: 9  },
  { name: 'Italy',          code: 'IT', dialCode: '+39',  flag: '🇮🇹', minLength: 9,  maxLength: 11 },
  { name: 'Spain',          code: 'ES', dialCode: '+34',  flag: '🇪🇸', minLength: 9,  maxLength: 9  },
  { name: 'Netherlands',    code: 'NL', dialCode: '+31',  flag: '🇳🇱', minLength: 9,  maxLength: 9  },
  { name: 'Switzerland',    code: 'CH', dialCode: '+41',  flag: '🇨🇭', minLength: 9,  maxLength: 9  },
  { name: 'Sweden',         code: 'SE', dialCode: '+46',  flag: '🇸🇪', minLength: 7,  maxLength: 13 },
  { name: 'Norway',         code: 'NO', dialCode: '+47',  flag: '🇳🇴', minLength: 8,  maxLength: 8  },
  { name: 'Denmark',        code: 'DK', dialCode: '+45',  flag: '🇩🇰', minLength: 8,  maxLength: 8  },
  { name: 'Poland',         code: 'PL', dialCode: '+48',  flag: '🇵🇱', minLength: 9,  maxLength: 9  },
  { name: 'Russia',         code: 'RU', dialCode: '+7',   flag: '🇷🇺', minLength: 10, maxLength: 10 },
  { name: 'Turkey',         code: 'TR', dialCode: '+90',  flag: '🇹🇷', minLength: 10, maxLength: 10, pattern: /^5\d{9}$/ },
  // Middle East & Africa
  { name: 'UAE',            code: 'AE', dialCode: '+971', flag: '🇦🇪', minLength: 9,  maxLength: 9  },
  { name: 'Saudi Arabia',   code: 'SA', dialCode: '+966', flag: '🇸🇦', minLength: 9,  maxLength: 9  },
  { name: 'Qatar',          code: 'QA', dialCode: '+974', flag: '🇶🇦', minLength: 8,  maxLength: 8  },
  { name: 'Kuwait',         code: 'KW', dialCode: '+965', flag: '🇰🇼', minLength: 8,  maxLength: 8  },
  { name: 'Bahrain',        code: 'BH', dialCode: '+973', flag: '🇧🇭', minLength: 8,  maxLength: 8  },
  { name: 'Oman',           code: 'OM', dialCode: '+968', flag: '🇴🇲', minLength: 8,  maxLength: 8  },
  { name: 'Jordan',         code: 'JO', dialCode: '+962', flag: '🇯🇴', minLength: 9,  maxLength: 9  },
  { name: 'Israel',         code: 'IL', dialCode: '+972', flag: '🇮🇱', minLength: 9,  maxLength: 9  },
  { name: 'South Africa',   code: 'ZA', dialCode: '+27',  flag: '🇿🇦', minLength: 9,  maxLength: 9  },
  { name: 'Nigeria',        code: 'NG', dialCode: '+234', flag: '🇳🇬', minLength: 10, maxLength: 10 },
  { name: 'Kenya',          code: 'KE', dialCode: '+254', flag: '🇰🇪', minLength: 9,  maxLength: 9  },
  { name: 'Egypt',          code: 'EG', dialCode: '+20',  flag: '🇪🇬', minLength: 10, maxLength: 10 },
  // Asia Pacific
  { name: 'China',          code: 'CN', dialCode: '+86',  flag: '🇨🇳', minLength: 11, maxLength: 11, pattern: /^1[3-9]\d{9}$/ },
  { name: 'Japan',          code: 'JP', dialCode: '+81',  flag: '🇯🇵', minLength: 10, maxLength: 11 },
  { name: 'South Korea',    code: 'KR', dialCode: '+82',  flag: '🇰🇷', minLength: 9,  maxLength: 11 },
  { name: 'Singapore',      code: 'SG', dialCode: '+65',  flag: '🇸🇬', minLength: 8,  maxLength: 8  },
  { name: 'Malaysia',       code: 'MY', dialCode: '+60',  flag: '🇲🇾', minLength: 9,  maxLength: 11 },
  { name: 'Thailand',       code: 'TH', dialCode: '+66',  flag: '🇹🇭', minLength: 9,  maxLength: 9  },
  { name: 'Indonesia',      code: 'ID', dialCode: '+62',  flag: '🇮🇩', minLength: 9,  maxLength: 12 },
  { name: 'Philippines',    code: 'PH', dialCode: '+63',  flag: '🇵🇭', minLength: 10, maxLength: 10, pattern: /^9\d{9}$/ },
  { name: 'Vietnam',        code: 'VN', dialCode: '+84',  flag: '🇻🇳', minLength: 9,  maxLength: 10 },
  { name: 'Australia',      code: 'AU', dialCode: '+61',  flag: '🇦🇺', minLength: 9,  maxLength: 9  },
  { name: 'New Zealand',    code: 'NZ', dialCode: '+64',  flag: '🇳🇿', minLength: 8,  maxLength: 10 },
  // South America
  { name: 'Brazil',         code: 'BR', dialCode: '+55',  flag: '🇧🇷', minLength: 10, maxLength: 11 },
  { name: 'Argentina',      code: 'AR', dialCode: '+54',  flag: '🇦🇷', minLength: 10, maxLength: 10 },
  { name: 'Colombia',       code: 'CO', dialCode: '+57',  flag: '🇨🇴', minLength: 10, maxLength: 10 },
  { name: 'Chile',          code: 'CL', dialCode: '+56',  flag: '🇨🇱', minLength: 9,  maxLength: 9  },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // India

export const validatePhoneWithCountry = (
  phone: string,
  countryCode: CountryCode
): { valid: boolean; error?: string } => {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return { valid: false, error: 'Phone number is required' };
  }

  if (digits.length < countryCode.minLength) {
    return {
      valid: false,
      error: `${countryCode.name} numbers need at least ${countryCode.minLength} digits`,
    };
  }

  if (digits.length > countryCode.maxLength) {
    return {
      valid: false,
      error: `${countryCode.name} numbers must not exceed ${countryCode.maxLength} digits`,
    };
  }

  if (countryCode.pattern && !countryCode.pattern.test(digits)) {
    if (countryCode.code === 'IN') {
      return { valid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9' };
    }
    if (countryCode.code === 'PK') {
      return { valid: false, error: 'Pakistan mobile numbers must start with 3' };
    }
    if (countryCode.code === 'TR') {
      return { valid: false, error: 'Turkey mobile numbers must start with 5' };
    }
    if (countryCode.code === 'PH') {
      return { valid: false, error: 'Philippines mobile numbers must start with 9' };
    }
    if (countryCode.code === 'CN') {
      return { valid: false, error: 'China mobile numbers must start with 13–19' };
    }
    return { valid: false, error: `Invalid phone number format for ${countryCode.name}` };
  }

  return { valid: true };
};

export const formatPhoneWithCountry = (phone: string, countryCode: CountryCode): string => {
  const digits = phone.replace(/\D/g, '');
  return `${countryCode.dialCode}${digits}`;
};

export const parsePhoneWithCountry = (
  fullPhone: string
): { dialCode: string; number: string; country?: CountryCode } => {
  if (!fullPhone || !fullPhone.startsWith('+')) {
    return { dialCode: '+91', number: fullPhone || '' };
  }
  // Sort by dial code length descending to match the most specific prefix first
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const country of sorted) {
    if (fullPhone.startsWith(country.dialCode)) {
      return {
        dialCode: country.dialCode,
        number: fullPhone.slice(country.dialCode.length),
        country,
      };
    }
  }
  return { dialCode: '+91', number: fullPhone };
};
