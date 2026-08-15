import { getPredefinedTheme, DEFAULT_THEME_KEY } from './themes.js';

// Client-side mirror of the server's `toPublicSettings()` shape. Used as the
// fallback when the public settings endpoint is unreachable, and as the base
// the SiteSettingsProvider deep-merges the server response onto (so a partial
// or older payload never leaves a section undefined).
//
// IMPORTANT: these values reproduce the CURRENT look exactly (brief §65) — the
// site is visually identical whether or not the API responds.
export const DEFAULT_PUBLIC_SETTINGS = {
  general: {
    siteName: 'NestSecure PG',
    shortName: 'NestSecure',
    tagline: 'Find your safe haven',
    description:
      'Discover, book, and manage PG accommodations with a live map, verified rooms, and secure payments.',
    language: 'en',
    currency: 'INR',
    currencySymbol: '₹',
    country: 'IN',
    dateFormat: 'DD MMM YYYY',
    timeFormat: '12h',
    supportEmail: 'support@nestsecure.example',
    supportPhone: '',
  },
  branding: {
    logo: '',
    logoDark: '',
    logoMobile: '',
    favicon: '',
    brandName: 'NestSecure',
    brandTagline: 'Trusted PG booking',
  },
  appearance: {
    activeTheme: DEFAULT_THEME_KEY,
    mode: 'light',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeight: 'semibold',
    fontScale: 'default',
    radius: 'default',
    density: 'comfortable',
    containerWidth: 'standard',
    buttonStyle: 'solid',
  },
  theme: getPredefinedTheme(DEFAULT_THEME_KEY),
  navigation: {
    sticky: true,
    showSearch: true,
    showWishlist: true,
    showAuthButtons: true,
    showOwnerPortal: true,
    showContact: true,
    showHelp: true,
  },
  announcement: {
    active: false,
    text: '',
    link: '',
    style: 'primary',
  },
  homepage: {
    heroHeading: 'Find Your Safe Haven.',
    heroSubheading:
      'Discover verified, secure, and comfortable PGs tailored to your needs. Zero friction, total peace of mind.',
    heroShowSearch: true,
    featuredEnabled: true,
    featuredTitle: 'Featured Properties',
    featuredCount: 9,
    featuredMode: 'newest',
    sections: [
      { key: 'hero', label: 'Hero', enabled: true, order: 0 },
      { key: 'search', label: 'Search', enabled: true, order: 1 },
      { key: 'featured', label: 'Featured PGs', enabled: true, order: 2 },
    ],
  },
  footer: {
    showLogo: true,
    description:
      'Verified, secure, and comfortable PG accommodations — booked with total peace of mind.',
    address: '',
    email: '',
    phone: '',
    copyright: 'NestSecure Housing Solutions. All rights reserved.',
    showProductLinks: true,
    showTrust: true,
  },
  social: {
    instagram: '',
    facebook: '',
    linkedin: '',
    youtube: '',
    twitter: '',
  },
  contact: {
    supportEmail: 'support@nestsecure.example',
    supportPhone: '',
    whatsapp: '',
    address: '',
    mapLink: '',
    workingHours: '',
  },
  seo: {
    defaultTitle: 'NestSecure PG — Find your safe haven',
    metaDescription:
      'Discover, book, and manage PG accommodations with a live map, verified rooms, and secure payments.',
    metaKeywords: 'PG, hostel, accommodation, booking, rooms',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterImage: '',
    robotsIndex: true,
    canonicalDomain: '',
  },
  registration: {
    enableUser: true,
    enableOwner: true,
  },
  maintenance: {
    enabled: false,
    title: "We'll be right back",
    message:
      'NestSecure is undergoing scheduled maintenance. Please check back shortly.',
    estimatedReturn: '',
  },
  advanced: { showPoweredBy: true },
};
