/** @type {import('tailwindcss').Config} */

// Brand ramp tokens resolve through CSS custom properties (space-separated RGB
// channels) so the whole indigo family can be re-themed at runtime while still
// supporting Tailwind opacity modifiers (e.g. bg-indigo-brand/10). The :root
// block in index.css holds the exact current hexes as defaults, so the default
// theme is pixel-identical; applyTheme() only sets these vars for non-default
// themes. Steps not listed here (indigo 100/400/800/900/950) are unused by the
// UI and keep Tailwind's static defaults.
const ch = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // dusk ink — deep navy that carries the "city at night" identity
        ink: { DEFAULT: '#0D1526', soft: '#1C2436', muted: '#4F46E5' },
        indigo: {
          brand: ch('--c-primary-600'),
          deep: ch('--c-primary-deep'),
          50: ch('--c-primary-50'),
          200: ch('--c-primary-200'),
          300: ch('--c-primary-300'),
          500: ch('--c-primary-500'),
          600: ch('--c-primary-600'),
          700: ch('--c-primary-700'),
        },
        marigold: { DEFAULT: '#F59E0B', soft: '#FBBF24', deep: '#D97706' },
        // warm stone surfaces — the "residential" counterpoint to the dusk hero
        stone: {
          DEFAULT: '#F3F0EA',
          soft: '#FAF8F4',
          line: '#E7E3D9',
          deep: '#EAE5DB',
        },
        paper: { DEFAULT: '#F6F4EE', sunk: '#EEE9E0' },
        surface: {
          DEFAULT: '#FFFFFF', low: '#F0F3FF', mid: '#E7EEFE', high: '#E2E8F8', highest: '#DCE2F3',
          100: '#F9FAFB', 200: '#F3F4F6', 300: '#E5E7EB',
        },
        outline: { DEFAULT: '#8A8691', soft: '#DCD8CC' },

        // Expanded scales for a complete UI system
        neutral: {
          50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
          400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
          800: '#1F2937', 900: '#111827', 950: '#030712',
        },
        // Brand scale (mirrors the indigo ramp). The steps the UI actually paints
        // with resolve through the same CSS vars so custom themes stay coherent.
        primary: {
          50: ch('--c-primary-50'), 100: '#E0E7FF', 200: ch('--c-primary-200'),
          300: ch('--c-primary-300'), 400: '#818CF8', 500: ch('--c-primary-500'),
          600: ch('--c-primary-600'), 700: ch('--c-primary-700'),
          800: '#3730A3', 900: '#312E81', 950: '#1E1B4B',
        },
        secondary: {
          50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E1',
          400: '#94A3B8', 500: '#64748B', 600: '#475569', 700: '#334155',
          800: '#1E293B', 900: '#0F172A', 950: '#020617',
        },
        success: {
          DEFAULT: '#059669', soft: '#D1FAE5',
          50: '#F0FDF4', 100: '#DCFCE7', 200: '#BBF7D0', 300: '#86EFAC',
          400: '#4ADE80', 500: '#22C55E', 600: '#16A34A', 700: '#15803D',
          800: '#166534', 900: '#14532D',
        },
        warning: {
          DEFAULT: '#D97706', soft: '#FEF3C7',
          50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D',
          400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444', 50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA',
          300: '#FCA5A5', 400: '#F87171', 500: '#EF4444', 600: '#DC2626',
          700: '#B91C1C', 800: '#991B1B', 900: '#7F1D1D',
        },
        // `danger` mirrors the `error` palette so long-standing utility classes
        // (text-danger, bg-danger/10, bg-danger-soft, border-danger/30) resolve.
        // DEFAULT is the deep 600 shade to match success/warning text convention.
        danger: {
          DEFAULT: '#DC2626', soft: '#FEE2E2',
          50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 300: '#FCA5A5',
          400: '#F87171', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C',
          800: '#991B1B', 900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#4F46E5', soft: '#E2DFFF',
          50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD',
          400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
          800: '#1E40AF', 900: '#1E3A8A',
        },
      },
      fontFamily: {
        // Resolve through CSS vars so the typography settings can swap fonts at
        // runtime. Defaults (set in :root) are Inter — identical to before.
        display: ['var(--font-heading)'],
        sans: ['var(--font-body)'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 2px 4px rgba(79,70,229,0.05)',
        card: '0 2px 4px rgba(79,70,229,0.05), 0 10px 20px rgba(79,70,229,0.06)',
        lift: '0 10px 30px rgba(79,70,229,0.16)',
        'bar-top': '0 -4px 20px rgba(79,70,229,0.10)',
        elevated: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
        'dropdown-md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'dropdown-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
        // warm, low-saturation card shadow for the stone surfaces
        'card-soft': '0 1px 2px rgba(13,21,38,0.04), 0 8px 24px rgba(13,21,38,0.05)',
        glass: '0 8px 32px rgba(13,21,38,0.18), inset 0 1px 0 rgba(255,255,255,0.25)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      height: {
        control: '2.75rem',
        'control-sm': '2.25rem',
        'control-lg': '3.25rem',
      },
      minHeight: {
        control: '2.75rem',
      },
      maxWidth: {
        content: '48rem',
        app: '64rem',
        prose: '42rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pin-drop': {
          '0%': { opacity: '0', transform: 'translateY(-18px) scale(0.9)' },
          '60%': { transform: 'translateY(2px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-pop': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'drawer-in': {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-drift': {
          '0%, 100%': { opacity: '0.72', transform: 'translateY(0) scale(1)' },
          '50%': { opacity: '1', transform: 'translateY(-12px) scale(1.03)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'pin-drop': 'pin-drop 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite',
        shimmer: 'shimmer 1.4s linear infinite',
        'toast-in': 'toast-in 0.28s cubic-bezier(0.22,1,0.36,1) both',
        'modal-pop': 'modal-pop 0.22s cubic-bezier(0.22,1,0.36,1) both',
        'drawer-in': 'drawer-in 0.18s ease-out both',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'glow-drift': 'glow-drift 26s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
