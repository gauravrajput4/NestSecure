import { DEFAULT_THEME_KEY, getPredefinedTheme } from '../config/themes.js';

// ---------------------------------------------------------------------------
// Theming engine
//
// The app is themed through CSS custom properties that hold the PRIMARY BRAND
// RAMP as space-separated RGB channels ("R G B"), so Tailwind utilities written
// as `rgb(var(--c-primary-600) / <alpha-value>)` keep working with opacity
// modifiers (e.g. bg-indigo-brand/10).
//
// Only the brand ramp + a few layout knobs are variable. Status colors
// (success / warning / error / info) and the marigold star accent are STATIC in
// Tailwind and are never repainted here — that keeps status chips and star
// ratings consistent across every theme.
//
// Pixel-perfect default (brief §65): the :root block in index.css hardcodes the
// exact current hexes. For the default theme we simply REMOVE any inline
// overrides, letting those :root defaults win — so the out-of-the-box site is
// byte-for-byte identical. Non-default themes get a ramp derived from their
// primary / primaryHover.
// ---------------------------------------------------------------------------

const BRAND_VARS = [
  '--c-primary-50',
  '--c-primary-200',
  '--c-primary-300',
  '--c-primary-500',
  '--c-primary-600',
  '--c-primary-700',
  '--c-primary-deep',
  '--c-accent',
];

const RADIUS_REM = {
  sharp: '0.25rem',
  subtle: '0.375rem',
  default: '0.5rem',
  rounded: '0.625rem',
  soft: '0.875rem',
};

const FONT_SCALE_PX = { compact: 14, default: 16, comfortable: 17, large: 18 };

const CONTAINER_MAX = {
  compact: '64rem',
  standard: '80rem',
  wide: '90rem',
  full: '100%',
};

// Allowlisted font families → Google Fonts stylesheet href. No arbitrary font
// injection: anything not in this map (or "Inter" / "System UI", already
// available) is ignored and falls back to the system stack.
const FONT_LINKS = {
  'Bricolage Grotesque':
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&display=swap',
  Manrope:
    'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
  'DM Sans':
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  'Plus Jakarta Sans':
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  Roboto:
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap',
  Poppins:
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'Open Sans':
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap',
};

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

// "#4F46E5" | "#abc" -> [r,g,b]. Returns null on anything unparseable.
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Channel string "R G B" for use inside rgb(var(--x) / <alpha>).
function toChannels(hex, fallback) {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
}

// Linear blend of two hexes; weight = amount of `b` mixed into `a` (0..1).
function mix(aHex, bHex, weight) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  if (!a || !b) return aHex;
  const w = Math.max(0, Math.min(1, weight));
  const out = a.map((c, i) => clamp(c + (b[i] - c) * w));
  return `${out[0]} ${out[1]} ${out[2]}`;
}

// Derive a full brand ramp from a theme's primary / primaryHover. The lighter
// steps are mixed toward white, the "deep" step slightly past the hover shade.
function buildPrimaryRamp(theme) {
  const primary = theme.primary || '#4F46E5';
  const hover = theme.primaryHover || primary;
  return {
    '--c-primary-50': mix(primary, '#FFFFFF', 0.92),
    '--c-primary-200': mix(primary, '#FFFFFF', 0.6),
    '--c-primary-300': mix(primary, '#FFFFFF', 0.45),
    '--c-primary-500': mix(primary, '#FFFFFF', 0.12),
    '--c-primary-600': toChannels(primary, '79 70 229'),
    '--c-primary-700': toChannels(hover, '67 56 202'),
    '--c-primary-deep': mix(hover, '#000000', 0.12),
    '--c-accent': toChannels(theme.accent, '245 158 11'),
  };
}

// Load an allowlisted web font once (idempotent per family).
function ensureFontLoaded(family) {
  if (!family || family === 'Inter' || family === 'System UI') return;
  const href = FONT_LINKS[family];
  if (!href) return;
  const id = `font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

// A CSS font-family stack for a chosen family name.
function fontStack(family) {
  if (!family || family === 'System UI') {
    return 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  }
  return `"${family}", system-ui, sans-serif`;
}

/**
 * Apply the visual theme (colors, radius, fonts, layout knobs) to <html>.
 * @param {object} theme      Resolved token set (primary, primaryHover, accent, ...).
 * @param {object} appearance activeTheme, mode, fonts, radius, density, containerWidth, etc.
 */
export function applyTheme(theme = {}, appearance = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDefaultTheme =
    (appearance.activeTheme || DEFAULT_THEME_KEY) === DEFAULT_THEME_KEY;

  // --- Brand ramp -----------------------------------------------------------
  if (isDefaultTheme) {
    // Let the :root defaults (exact current palette) take over → identical look.
    BRAND_VARS.forEach((v) => root.style.removeProperty(v));
  } else {
    const ramp = buildPrimaryRamp(theme);
    Object.entries(ramp).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  // --- Radius ---------------------------------------------------------------
  root.style.setProperty(
    '--radius-control',
    RADIUS_REM[appearance.radius] || RADIUS_REM.default
  );

  // --- Typography -----------------------------------------------------------
  ensureFontLoaded(appearance.headingFont);
  ensureFontLoaded(appearance.bodyFont);
  root.style.setProperty('--font-heading', fontStack(appearance.headingFont || 'Inter'));
  root.style.setProperty('--font-body', fontStack(appearance.bodyFont || 'Inter'));
  root.style.fontSize = `${FONT_SCALE_PX[appearance.fontScale] || 16}px`;

  // --- Layout ---------------------------------------------------------------
  root.style.setProperty(
    '--container-max',
    CONTAINER_MAX[appearance.containerWidth] || CONTAINER_MAX.standard
  );

  // --- Density + button style + mode ---------------------------------------
  // Set as data-* hooks. Defaults reproduce the current look exactly; a fuller
  // dark palette / density rescale can layer on these later without churn.
  root.setAttribute('data-density', appearance.density || 'comfortable');
  root.setAttribute('data-button-style', appearance.buttonStyle || 'solid');
  root.setAttribute('data-color-mode', resolveMode(appearance.mode));
}

// light | dark | system -> concrete light|dark. `system` reads the OS setting.
export function resolveMode(mode) {
  if (mode === 'dark') return 'dark';
  if (mode === 'system' || mode === 'light-dark') {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
  return 'light';
}

/**
 * Reflect SEO / branding into the document head: title, meta description,
 * theme-color, and favicon (when a custom one is uploaded).
 */
export function applyDocumentMeta(settings = {}) {
  if (typeof document === 'undefined') return;
  const { general = {}, seo = {}, branding = {}, theme = {} } = settings;

  const title = seo.defaultTitle || general.siteName || document.title;
  if (title) document.title = title;

  setMeta('name', 'description', seo.metaDescription || general.description || '');
  setMeta('name', 'keywords', seo.metaKeywords || '');
  setMeta('name', 'robots', seo.robotsIndex === false ? 'noindex, nofollow' : 'index, follow');
  setMeta('name', 'theme-color', theme.primary || '#4F46E5');

  if (branding.favicon) {
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  }
}

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

/**
 * Inline CSS-variable style object for the live theme preview, so a preview
 * card can render an arbitrary (unsaved) theme without touching global state.
 */
export function themePreviewVars(theme = {}) {
  const t = { ...getPredefinedTheme(DEFAULT_THEME_KEY), ...theme };
  return {
    '--pv-primary': t.primary,
    '--pv-primary-hover': t.primaryHover,
    '--pv-accent': t.accent,
    '--pv-bg': t.background,
    '--pv-surface': t.surface,
    '--pv-border': t.border,
    '--pv-text': t.text,
    '--pv-muted': t.muted,
    '--pv-success': t.success,
    '--pv-warning': t.warning,
    '--pv-error': t.error,
    '--pv-info': t.info,
  };
}
