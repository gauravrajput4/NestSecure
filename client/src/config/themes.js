// Predefined themes — mirrors server/utils/settingsDefaults.js exactly so the
// admin builder/preview works even before the first save. `primary` is the brand
// color, `primaryHover` the pressed shade, `accent` a secondary highlight, and
// the rest are neutrals + semantics.
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

export function getPredefinedTheme(key) {
  return (
    PREDEFINED_THEMES.find((t) => t.key === key) ||
    PREDEFINED_THEMES.find((t) => t.key === DEFAULT_THEME_KEY)
  );
}

// The twelve editable tokens, in display order, with friendly labels + hints.
// Used by the custom theme builder and the color-field grid.
export const THEME_TOKEN_FIELDS = [
  { key: 'primary', label: 'Primary', hint: 'Main brand color — buttons, links, active states' },
  { key: 'primaryHover', label: 'Primary (hover)', hint: 'Pressed / hover shade of the primary' },
  { key: 'accent', label: 'Accent', hint: 'Secondary highlight for emphasis' },
  { key: 'background', label: 'Background', hint: 'App page background' },
  { key: 'surface', label: 'Surface', hint: 'Cards, panels, menus' },
  { key: 'border', label: 'Border', hint: 'Dividers and outlines' },
  { key: 'text', label: 'Text', hint: 'Primary body text' },
  { key: 'muted', label: 'Muted text', hint: 'Secondary / helper text' },
  { key: 'success', label: 'Success', hint: 'Positive states' },
  { key: 'warning', label: 'Warning', hint: 'Cautionary states' },
  { key: 'error', label: 'Error', hint: 'Destructive / error states' },
  { key: 'info', label: 'Info', hint: 'Informational states' },
];

// Option lists mirrored from the server so selects stay in sync.
export const FONT_OPTIONS = [
  'Bricolage Grotesque',
  'Inter',
  'Manrope',
  'DM Sans',
  'Plus Jakarta Sans',
  'Roboto',
  'Poppins',
  'Open Sans',
  'System UI',
];

export const FONT_SCALE_OPTIONS = [
  { value: 'compact', label: 'Compact (14px)' },
  { value: 'default', label: 'Default (16px)' },
  { value: 'comfortable', label: 'Comfortable (17px)' },
  { value: 'large', label: 'Large (18px)' },
];

export const RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'default', label: 'Default' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'soft', label: 'Soft' },
];

export const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
];

export const CONTAINER_OPTIONS = [
  { value: 'compact', label: 'Compact (1024px)' },
  { value: 'standard', label: 'Standard (1280px)' },
  { value: 'wide', label: 'Wide (1440px)' },
  { value: 'full', label: 'Full width' },
];

export const MODE_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Follow system' },
];

export const BUTTON_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'soft', label: 'Soft' },
  { value: 'outline', label: 'Outline' },
  { value: 'minimal', label: 'Minimal' },
];

export const FONT_WEIGHT_OPTIONS = [
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
];

export const FEATURED_MODE_OPTIONS = [
  { value: 'automatic', label: 'Automatic' },
  { value: 'highest-rated', label: 'Highest rated' },
  { value: 'most-booked', label: 'Most booked' },
  { value: 'newest', label: 'Newest' },
  { value: 'manual', label: 'Manual' },
];

export const ANNOUNCEMENT_STYLE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'accent', label: 'Accent' },
  { value: 'neutral', label: 'Neutral' },
];
