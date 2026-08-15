// Shared, framework-free defaults for the Site Settings system.
//
// IMPORTANT: these values reproduce the CURRENT NestSecure look exactly, so the
// site is visually identical the moment settings are introduced (see brief §65).
// The admin can then intentionally change things. The client keeps its own copy
// of the public shape (client/src/config/defaultSettings.js) for offline fallback.

// ---------------------------------------------------------------------------
// Predefined themes — each is a complete, self-consistent palette.
// `primary` is the brand color; `primaryHover` the pressed/hover shade;
// `accent` a secondary highlight; the rest are neutrals + semantics.
// ---------------------------------------------------------------------------
export const PREDEFINED_THEMES = [
  {
    key: 'indigo-professional',
    name: 'Indigo Professional',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    accent: '#F59E0B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    muted: '#6B7280',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#4F46E5',
  },
  {
    key: 'emerald-fresh',
    name: 'Emerald Fresh',
    primary: '#059669',
    primaryHover: '#047857',
    accent: '#F59E0B',
    background: '#F8FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    muted: '#6B7280',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0EA5E9',
  },
  {
    key: 'blue-trust',
    name: 'Blue Trust',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    accent: '#F59E0B',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#0F172A',
    muted: '#64748B',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
  },
  {
    key: 'slate-minimal',
    name: 'Slate Minimal',
    primary: '#334155',
    primaryHover: '#1E293B',
    accent: '#0D9488',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    muted: '#64748B',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#334155',
  },
  {
    key: 'rose-modern',
    name: 'Rose Modern',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    accent: '#F59E0B',
    background: '#FFF9FA',
    surface: '#FFFFFF',
    border: '#F1E5E8',
    text: '#111827',
    muted: '#6B7280',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#E11D48',
  },
  {
    key: 'amber-warm',
    name: 'Amber Warm',
    primary: '#D97706',
    primaryHover: '#B45309',
    accent: '#4F46E5',
    background: '#FFFCF7',
    surface: '#FFFFFF',
    border: '#EFE7DA',
    text: '#1C1917',
    muted: '#78716C',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#4F46E5',
  },
];

export const DEFAULT_THEME_KEY = 'indigo-professional';

/** The full token object for a predefined theme key (falls back to default). */
export function getPredefinedTheme(key) {
  return (
    PREDEFINED_THEMES.find((t) => t.key === key) ||
    PREDEFINED_THEMES.find((t) => t.key === DEFAULT_THEME_KEY)
  );
}

// Font families offered in Typography settings (no arbitrary font injection).
export const FONT_OPTIONS = [
  'Inter',
  'Manrope',
  'DM Sans',
  'Plus Jakarta Sans',
  'Roboto',
  'Poppins',
  'Open Sans',
  'System UI',
];

// Named token maps used by both server validation and client apply logic.
export const FONT_SCALE_PX = { compact: 14, default: 16, comfortable: 17, large: 18 };
export const RADIUS_PX = { sharp: 4, subtle: 6, default: 8, rounded: 10, soft: 14 };
export const DENSITY_OPTIONS = ['compact', 'comfortable', 'spacious'];
export const CONTAINER_MAX = {
  compact: '64rem',
  standard: '80rem',
  wide: '90rem',
  full: '100%',
};
export const MODE_OPTIONS = ['light', 'dark', 'system', 'light-dark'];
export const BUTTON_STYLES = ['solid', 'soft', 'outline', 'minimal'];
export const FEATURED_MODES = ['automatic', 'highest-rated', 'most-booked', 'newest', 'manual'];

// Homepage sections the admin can toggle/reorder. Keys map to real sections
// that exist (hero + featured); the rest are honest placeholders that render
// only when the underlying data/section is present.
export const HOMEPAGE_SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'search', label: 'Search' },
  { key: 'featured', label: 'Featured PGs' },
];
