/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // NestSecure PG palette — cool slate ink on lavender-white, indigo
        // primary, with gold reserved for star ratings only.
        ink: {
          DEFAULT: '#151C27', // cool near-black (on-surface)
          soft: '#2A313D', // inverse-surface (footer / secondary btn)
          muted: '#4F46E5', // primary indigo accent
        },
        indigo: {
          brand: '#4F46E5', // primary-container (buttons)
          deep: '#3525CD', // primary (wordmark, links, emphasis)
        },
        // Gold accent — used almost exclusively for star ratings.
        marigold: {
          DEFAULT: '#F59E0B',
          soft: '#FBBF24',
          deep: '#D97706',
        },
        paper: {
          DEFAULT: '#F9F9FF', // lavender-white surface/background
          sunk: '#F0F3FF', // surface-container-low (insets / section bands)
        },
        // Extra surface steps mirrored from the NestSecure Material scheme so
        // chips, toggles and rails have a cohesive tint ladder.
        surface: {
          DEFAULT: '#FFFFFF',
          low: '#F0F3FF',
          mid: '#E7EEFE',
          high: '#E2E8F8',
          highest: '#DCE2F3',
        },
        outline: {
          DEFAULT: '#777587',
          soft: '#C7C4D8', // outline-variant (hairline borders)
        },
        // Status colors — each has a soft tint for badge/alert backgrounds so
        // status is never carried by the strong color alone (pairs with a label).
        success: {
          DEFAULT: '#059669',
          soft: '#D1FAE5',
        },
        danger: {
          DEFAULT: '#DC2626',
          soft: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FEF3C7',
        },
        info: {
          DEFAULT: '#4F46E5',
          soft: '#E2DFFF',
        },
      },
      fontFamily: {
        // NestSecure is deliberately Inter throughout; display uses the
        // heaviest weights with tight tracking for a clean corporate voice.
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        // Soft, indigo-tinted shadows — the signature NestSecure elevation.
        subtle: '0 2px 4px rgba(79,70,229,0.05)',
        card: '0 2px 4px rgba(79,70,229,0.05), 0 10px 20px rgba(79,70,229,0.06)',
        lift: '0 10px 30px rgba(79,70,229,0.16)',
        // Upward shadow for sticky bottom bars on mobile.
        'bar-top': '0 -4px 20px rgba(79,70,229,0.10)',
      },
      borderRadius: {
        xl2: '1rem', // NestSecure cards use a 1rem (rounded-2xl) corner
      },
      // Control heights so inputs, selects, and buttons align on a shared grid.
      height: {
        control: '2.75rem', // 44px — meets the min touch-target requirement
        'control-sm': '2.25rem',
        'control-lg': '3.25rem',
      },
      minHeight: {
        control: '2.75rem',
      },
      maxWidth: {
        content: '48rem', // comfortable reading width for prose blocks
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pin-drop': {
          '0%': { opacity: '0', transform: 'translateY(-18px) scale(0.9)' },
          '60%': { transform: 'translateY(2px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pin-drop': 'pin-drop 0.5s cubic-bezier(0.22,1,0.36,1) both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
