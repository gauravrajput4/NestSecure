// Spec-driven validator + allowlist for Site Settings.
//
// Every writable section declares exactly which fields may be set and the type
// rules for each. Anything not listed is dropped (mass-assignment protection,
// brief §53). Validation runs on the backend regardless of client checks (§52).

import { FONT_OPTIONS, FEATURED_MODES } from '../utils/settingsDefaults.js';

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isStr = (v) => typeof v === 'string';
const isBoolLike = (v) => typeof v === 'boolean' || v === 'true' || v === 'false';
const toBool = (v) => v === true || v === 'true';

function httpOk(v) {
  if (v === '') return true;
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Each spec: { t: type, max, min, values } ; t in
// str | bool | int | num | hex | url | email | enum | date
function coerce(spec, raw) {
  const t = spec.t;
  if (t === 'bool') {
    if (!isBoolLike(raw)) return { err: 'must be true or false' };
    return { value: toBool(raw) };
  }
  if (t === 'int' || t === 'num') {
    const n = t === 'int' ? parseInt(raw, 10) : Number(raw);
    if (Number.isNaN(n)) return { err: 'must be a number' };
    if (spec.min != null && n < spec.min) return { err: `must be ≥ ${spec.min}` };
    if (spec.max != null && n > spec.max) return { err: `must be ≤ ${spec.max}` };
    return { value: n };
  }
  if (t === 'date') {
    if (raw === '' || raw == null) return { value: null };
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return { err: 'invalid date' };
    return { value: d };
  }
  // string-ish from here
  if (!isStr(raw)) return { err: 'must be text' };
  const s = raw.trim();
  if (spec.max && s.length > spec.max) return { err: `must be ≤ ${spec.max} characters` };
  if (t === 'hex') return HEX.test(s) ? { value: s } : { err: 'must be a hex color like #4F46E5' };
  if (t === 'url') return httpOk(s) ? { value: s } : { err: 'must be a valid http(s) URL' };
  if (t === 'email')
    return s === '' || EMAIL.test(s) ? { value: s } : { err: 'must be a valid email' };
  if (t === 'enum')
    return spec.values.includes(s) ? { value: s } : { err: `must be one of: ${spec.values.join(', ')}` };
  return { value: s };
}

const THEME_TOKENS = {
  primary: { t: 'hex' }, primaryHover: { t: 'hex' }, accent: { t: 'hex' },
  background: { t: 'hex' }, surface: { t: 'hex' }, border: { t: 'hex' },
  text: { t: 'hex' }, muted: { t: 'hex' },
  success: { t: 'hex' }, warning: { t: 'hex' }, error: { t: 'hex' }, info: { t: 'hex' },
};

export const SECTION_SPECS = {
  general: {
    siteName: { t: 'str', max: 120 }, shortName: { t: 'str', max: 60 },
    tagline: { t: 'str', max: 200 }, description: { t: 'str', max: 600 },
    language: { t: 'str', max: 12 }, currency: { t: 'str', max: 8 },
    currencySymbol: { t: 'str', max: 5 }, country: { t: 'str', max: 4 },
    timezone: { t: 'str', max: 60 }, dateFormat: { t: 'str', max: 30 },
    timeFormat: { t: 'enum', values: ['12h', '24h'] },
    supportEmail: { t: 'email' }, supportPhone: { t: 'str', max: 30 },
  },
  branding: {
    brandName: { t: 'str', max: 60 }, brandTagline: { t: 'str', max: 120 },
    logo: { t: 'url' }, logoDark: { t: 'url' }, logoMobile: { t: 'url' }, favicon: { t: 'url' },
  },
  appearance: {
    mode: { t: 'enum', values: ['light', 'dark', 'system', 'light-dark'] },
    headingFont: { t: 'enum', values: FONT_OPTIONS },
    bodyFont: { t: 'enum', values: FONT_OPTIONS },
    fontWeight: { t: 'enum', values: ['regular', 'medium', 'semibold', 'bold'] },
    fontScale: { t: 'enum', values: ['compact', 'default', 'comfortable', 'large'] },
    radius: { t: 'enum', values: ['sharp', 'subtle', 'default', 'rounded', 'soft'] },
    density: { t: 'enum', values: ['compact', 'comfortable', 'spacious'] },
    containerWidth: { t: 'enum', values: ['compact', 'standard', 'wide', 'full'] },
    buttonStyle: { t: 'enum', values: ['solid', 'soft', 'outline', 'minimal'] },
  },
  theme: THEME_TOKENS,
  navigation: {
    sticky: { t: 'bool' }, showSearch: { t: 'bool' }, showWishlist: { t: 'bool' },
    showAuthButtons: { t: 'bool' }, showOwnerPortal: { t: 'bool' },
    showContact: { t: 'bool' }, showHelp: { t: 'bool' },
  },
  announcement: {
    enabled: { t: 'bool' }, text: { t: 'str', max: 200 }, link: { t: 'url' },
    style: { t: 'enum', values: ['primary', 'accent', 'neutral'] },
    startDate: { t: 'date' }, endDate: { t: 'date' },
  },
  homepage: {
    heroHeading: { t: 'str', max: 160 }, heroSubheading: { t: 'str', max: 400 },
    heroShowSearch: { t: 'bool' }, featuredEnabled: { t: 'bool' },
    featuredTitle: { t: 'str', max: 120 },
    featuredCount: { t: 'int', min: 3, max: 24 },
    featuredMode: { t: 'enum', values: FEATURED_MODES },
    // `sections` handled specially below.
  },
  footer: {
    showLogo: { t: 'bool' }, description: { t: 'str', max: 400 },
    address: { t: 'str', max: 200 }, email: { t: 'email' }, phone: { t: 'str', max: 30 },
    copyright: { t: 'str', max: 200 },
    showProductLinks: { t: 'bool' }, showTrust: { t: 'bool' },
  },
  social: {
    instagram: { t: 'url' }, facebook: { t: 'url' }, linkedin: { t: 'url' },
    youtube: { t: 'url' }, twitter: { t: 'url' },
  },
  contact: {
    supportEmail: { t: 'email' }, supportPhone: { t: 'str', max: 30 },
    whatsapp: { t: 'str', max: 30 }, address: { t: 'str', max: 200 },
    mapLink: { t: 'url' }, workingHours: { t: 'str', max: 120 },
  },
  booking: {
    minDurationMonths: { t: 'int', min: 1, max: 60 },
    maxDurationMonths: { t: 'int', min: 1, max: 120 },
    advanceBookingDays: { t: 'int', min: 0, max: 365 },
    cancellationDeadlineHours: { t: 'int', min: 0, max: 720 },
    allowInstantBooking: { t: 'bool' }, requireOwnerApproval: { t: 'bool' },
    requireAdminApproval: { t: 'bool' }, cancellationAllowed: { t: 'bool' },
    freeCancellationHours: { t: 'int', min: 0, max: 720 },
    cancellationFeeType: { t: 'enum', values: ['fixed', 'percentage'] },
    cancellationFeeValue: { t: 'num', min: 0 },
  },
  payments: {
    enableOnline: { t: 'bool' }, enablePayAtProperty: { t: 'bool' },
    enableRazorpay: { t: 'bool' }, minBookingAmount: { t: 'num', min: 0 },
    platformFeePercent: { t: 'num', min: 0, max: 100 },
    taxPercent: { t: 'num', min: 0, max: 100 }, bookingFee: { t: 'num', min: 0 },
  },
  seo: {
    defaultTitle: { t: 'str', max: 160 }, metaDescription: { t: 'str', max: 320 },
    metaKeywords: { t: 'str', max: 300 }, ogTitle: { t: 'str', max: 160 },
    ogDescription: { t: 'str', max: 320 }, ogImage: { t: 'url' }, twitterImage: { t: 'url' },
    robotsIndex: { t: 'bool' }, canonicalDomain: { t: 'str', max: 120 },
  },
  notifications: {
    bookingConfirmation: { t: 'bool' }, cancellation: { t: 'bool' }, refund: { t: 'bool' },
    ownerBooking: { t: 'bool' }, adminBooking: { t: 'bool' }, welcome: { t: 'bool' },
    paymentConfirmation: { t: 'bool' },
  },
  maintenance: {
    enabled: { t: 'bool' }, title: { t: 'str', max: 120 }, message: { t: 'str', max: 400 },
    estimatedReturn: { t: 'str', max: 120 }, allowOwnerAccess: { t: 'bool' },
  },
  registration: {
    enableUser: { t: 'bool' }, enableOwner: { t: 'bool' },
    requireEmailVerification: { t: 'bool' }, requireAdminApprovalOwners: { t: 'bool' },
  },
  security: {
    sessionTimeoutMinutes: { t: 'int', min: 5, max: 43200 },
    maxLoginAttempts: { t: 'int', min: 3, max: 50 },
    requireEmailVerification: { t: 'bool' }, requireStrongPassword: { t: 'bool' },
    enableMaintenanceRestrictions: { t: 'bool' },
  },
  advanced: {
    cachePublicSettings: { t: 'bool' }, showPoweredBy: { t: 'bool' },
  },
};

// Sections whose changes are worth recording in the audit log.
export const SENSITIVE_SECTIONS = new Set([
  'maintenance', 'booking', 'payments', 'registration', 'security', 'theme',
]);

export const VALID_SECTIONS = new Set(Object.keys(SECTION_SPECS));

/**
 * Validate + pick allowed fields from `input` for one section.
 * @returns {{ value?: object, error?: string }}
 */
export function sanitizeSection(section, input) {
  const spec = SECTION_SPECS[section];
  if (!spec) return { error: `Unknown settings section: ${section}` };
  if (!input || typeof input !== 'object') return { error: 'Invalid payload' };

  const out = {};
  for (const [key, rawVal] of Object.entries(input)) {
    if (!(key in spec)) continue; // drop unknown keys (mass-assignment guard)
    if (rawVal === undefined) continue;
    const { value, err } = coerce(spec[key], rawVal);
    if (err) return { error: `${section}.${key}: ${err}` };
    out[key] = value;
  }

  // Homepage sections array (ordering + enable toggles), validated per item.
  if (section === 'homepage' && Array.isArray(input.sections)) {
    const seen = new Set();
    out.sections = input.sections
      .filter((s) => s && typeof s.key === 'string' && !seen.has(s.key) && seen.add(s.key))
      .map((s, i) => ({
        key: s.key.slice(0, 40),
        label: typeof s.label === 'string' ? s.label.slice(0, 60) : s.key,
        enabled: toBool(s.enabled),
        order: Number.isFinite(+s.order) ? +s.order : i,
      }));
  }

  // Cross-field sanity: booking duration range.
  if (section === 'booking' && out.minDurationMonths != null && out.maxDurationMonths != null) {
    if (out.minDurationMonths > out.maxDurationMonths)
      return { error: 'booking: minimum duration cannot exceed maximum duration' };
  }
  return { value: out };
}

/** Validate a full theme token set (+ optional name). */
export function sanitizeTheme(input) {
  if (!input || typeof input !== 'object') return { error: 'Invalid theme payload' };
  const out = {};
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || !input.name.trim())
      return { error: 'Theme name is required' };
    out.name = input.name.trim().slice(0, 60);
  }
  for (const [key, spec] of Object.entries(THEME_TOKENS)) {
    if (input[key] === undefined) continue;
    const { value, err } = coerce(spec, input[key]);
    if (err) return { error: `theme.${key}: ${err}` };
    out[key] = value;
  }
  return { value: out };
}
