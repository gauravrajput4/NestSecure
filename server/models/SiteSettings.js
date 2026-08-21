import mongoose from 'mongoose';
import { getPredefinedTheme, DEFAULT_THEME_KEY } from '../utils/settingsDefaults.js';

const { Schema } = mongoose;
const noId = { _id: false };

// Single-nested subschema paths need a path-level default for Mongoose to
// instantiate the subdocument (and thus apply its inner field defaults) when a
// parent doc is created. Without this, `doc.<section>` is `undefined` and any
// `doc.<section>.<field>` read/write throws. `sub()` wraps a section schema so
// it always materializes with defaults. (The optional 2nd arg lets existing
// `sub({...}, noId)` call sites keep the familiar signature; noId is applied
// internally regardless.)
const sub = (definition) => ({
  type: new Schema(definition, noId),
  default: () => ({}),
});

// Resolved token set for the active theme (also what the public API serves).
const themeTokens = getPredefinedTheme(DEFAULT_THEME_KEY);

const themeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    primary: { type: String, default: '#4F46E5' },
    primaryHover: { type: String, default: '#4338CA' },
    accent: { type: String, default: '#F59E0B' },
    background: { type: String, default: '#F9FAFB' },
    surface: { type: String, default: '#FFFFFF' },
    border: { type: String, default: '#E5E7EB' },
    text: { type: String, default: '#111827' },
    muted: { type: String, default: '#6B7280' },
    success: { type: String, default: '#059669' },
    warning: { type: String, default: '#D97706' },
    error: { type: String, default: '#DC2626' },
    info: { type: String, default: '#4F46E5' },
  },
  { timestamps: true }
);

const auditSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: 'User' },
    adminName: String,
    adminEmail: String,
    action: String, // human-readable, e.g. "Enabled maintenance mode"
    section: String,
    at: { type: Date, default: Date.now },
  },
  noId
);

const siteSettingsSchema = new Schema(
  {
    // Singleton guard — always the same key so only one doc can exist.
    key: { type: String, default: 'global', unique: true, immutable: true },

    general: sub(
      {
        siteName: { type: String, default: 'NestSecure PG' },
        shortName: { type: String, default: 'NestSecure' },
        tagline: { type: String, default: 'Find your safe haven' },
        description: {
          type: String,
          default:
            'Discover, book, and manage PG accommodations with a live map, verified rooms, and secure payments.',
        },
        language: { type: String, default: 'en' },
        currency: { type: String, default: 'INR' },
        currencySymbol: { type: String, default: '₹' },
        country: { type: String, default: 'IN' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        dateFormat: { type: String, default: 'DD MMM YYYY' },
        timeFormat: { type: String, default: '12h' },
        supportEmail: { type: String, default: 'support@nestsecure.example' },
        supportPhone: { type: String, default: '' },
      }
    ),

    branding: sub(
      {
        logo: { type: String, default: '' },
        logoId: { type: String, default: '' },
        logoDark: { type: String, default: '' },
        logoDarkId: { type: String, default: '' },
        logoMobile: { type: String, default: '' },
        logoMobileId: { type: String, default: '' },
        favicon: { type: String, default: '' },
        faviconId: { type: String, default: '' },
        brandName: { type: String, default: 'NestSecure' },
        brandTagline: { type: String, default: 'Trusted PG booking' },
      }
    ),

    appearance: sub(
      {
        activeTheme: { type: String, default: DEFAULT_THEME_KEY }, // key or custom _id
        mode: { type: String, default: 'light' }, // light | dark | system | light-dark
        headingFont: { type: String, default: 'Bricolage Grotesque' },
        bodyFont: { type: String, default: 'Manrope' },
        fontWeight: { type: String, default: 'semibold' },
        fontScale: { type: String, default: 'default' }, // compact|default|comfortable|large
        radius: { type: String, default: 'default' }, // sharp|subtle|default|rounded|soft
        density: { type: String, default: 'comfortable' }, // compact|comfortable|spacious
        containerWidth: { type: String, default: 'standard' }, // compact|standard|wide|full
        buttonStyle: { type: String, default: 'solid' }, // solid|soft|outline|minimal
      }
    ),

    // Active resolved tokens (kept in sync when a theme is activated). This is
    // what the client applies as CSS variables.
    theme: sub(
      {
        primary: { type: String, default: themeTokens.primary },
        primaryHover: { type: String, default: themeTokens.primaryHover },
        accent: { type: String, default: themeTokens.accent },
        background: { type: String, default: themeTokens.background },
        surface: { type: String, default: themeTokens.surface },
        border: { type: String, default: themeTokens.border },
        text: { type: String, default: themeTokens.text },
        muted: { type: String, default: themeTokens.muted },
        success: { type: String, default: themeTokens.success },
        warning: { type: String, default: themeTokens.warning },
        error: { type: String, default: themeTokens.error },
        info: { type: String, default: themeTokens.info },
      }
    ),

    // Admin-authored custom themes.
    themes: { type: [themeSchema], default: [] },

    navigation: sub(
      {
        sticky: { type: Boolean, default: true },
        showSearch: { type: Boolean, default: true },
        showWishlist: { type: Boolean, default: true },
        showAuthButtons: { type: Boolean, default: true },
        showOwnerPortal: { type: Boolean, default: true },
        showContact: { type: Boolean, default: true },
        showHelp: { type: Boolean, default: true },
      }
    ),

    announcement: sub(
      {
        enabled: { type: Boolean, default: false },
        text: { type: String, default: '' },
        link: { type: String, default: '' },
        style: { type: String, default: 'primary' }, // primary | accent | neutral
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
      }
    ),

    homepage: sub(
      {
        heroHeading: { type: String, default: 'Find Your Safe Haven.' },
        heroSubheading: {
          type: String,
          default:
            'Discover verified, secure, and comfortable PGs tailored to your needs. Zero friction, total peace of mind.',
        },
        heroShowSearch: { type: Boolean, default: true },
        featuredEnabled: { type: Boolean, default: true },
        featuredTitle: { type: String, default: 'Featured Properties' },
        featuredCount: { type: Number, default: 9, min: 3, max: 24 },
        featuredMode: { type: String, default: 'newest' },
        sections: {
          type: [
            new Schema(
              {
                key: String,
                label: String,
                enabled: { type: Boolean, default: true },
                order: { type: Number, default: 0 },
              },
              noId
            ),
          ],
          default: [
            { key: 'hero', label: 'Hero', enabled: true, order: 0 },
            { key: 'search', label: 'Search', enabled: true, order: 1 },
            { key: 'featured', label: 'Featured PGs', enabled: true, order: 2 },
          ],
        },
      }
    ),

    footer: sub(
      {
        showLogo: { type: Boolean, default: true },
        description: {
          type: String,
          default:
            'Verified, secure, and comfortable PG accommodations — booked with total peace of mind.',
        },
        address: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        copyright: {
          type: String,
          default: 'NestSecure Housing Solutions. All rights reserved.',
        },
        showProductLinks: { type: Boolean, default: true },
        showTrust: { type: Boolean, default: true },
      }
    ),

    social: sub(
      {
        instagram: { type: String, default: '' },
        facebook: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        youtube: { type: String, default: '' },
        twitter: { type: String, default: '' },
      }
    ),

    contact: sub(
      {
        supportEmail: { type: String, default: 'support@nestsecure.example' },
        supportPhone: { type: String, default: '' },
        whatsapp: { type: String, default: '' },
        address: { type: String, default: '' },
        mapLink: { type: String, default: '' },
        workingHours: { type: String, default: '' },
      }
    ),

    // Business config below is STORED and admin-editable, but (per this phase)
    // NOT wired into the frozen booking/payment/refund flows. Enforcement can
    // be enabled later per-setting.
    booking: sub(
      {
        minDurationMonths: { type: Number, default: 1, min: 1, max: 60 },
        maxDurationMonths: { type: Number, default: 12, min: 1, max: 120 },
        advanceBookingDays: { type: Number, default: 90, min: 0, max: 365 },
        cancellationDeadlineHours: { type: Number, default: 48, min: 0, max: 720 },
        allowInstantBooking: { type: Boolean, default: false },
        requireOwnerApproval: { type: Boolean, default: true },
        requireAdminApproval: { type: Boolean, default: false },
        cancellationAllowed: { type: Boolean, default: true },
        freeCancellationHours: { type: Number, default: 48, min: 0, max: 720 },
        cancellationFeeType: { type: String, default: 'percentage' }, // fixed | percentage
        cancellationFeeValue: { type: Number, default: 0, min: 0 },
      }
    ),

    payments: sub(
      {
        enableOnline: { type: Boolean, default: true },
        enablePayAtProperty: { type: Boolean, default: false },
        enableRazorpay: { type: Boolean, default: true },
        minBookingAmount: { type: Number, default: 0, min: 0 },
        platformFeePercent: { type: Number, default: 0, min: 0, max: 100 },
        taxPercent: { type: Number, default: 0, min: 0, max: 100 },
        bookingFee: { type: Number, default: 0, min: 0 },
      }
    ),

    seo: sub(
      {
        defaultTitle: { type: String, default: 'NestSecure PG — Find your safe haven' },
        metaDescription: {
          type: String,
          default:
            'Discover, book, and manage PG accommodations with a live map, verified rooms, and secure payments.',
        },
        metaKeywords: { type: String, default: 'PG, hostel, accommodation, booking, rooms' },
        ogTitle: { type: String, default: '' },
        ogDescription: { type: String, default: '' },
        ogImage: { type: String, default: '' },
        twitterImage: { type: String, default: '' },
        robotsIndex: { type: Boolean, default: true },
        canonicalDomain: { type: String, default: '' },
      }
    ),

    notifications: sub(
      {
        bookingConfirmation: { type: Boolean, default: true },
        cancellation: { type: Boolean, default: true },
        refund: { type: Boolean, default: true },
        ownerBooking: { type: Boolean, default: true },
        adminBooking: { type: Boolean, default: true },
        welcome: { type: Boolean, default: true },
        paymentConfirmation: { type: Boolean, default: true },
      }
    ),

    // ENFORCED this phase (additive, admin-bypass middleware).
    maintenance: sub(
      {
        enabled: { type: Boolean, default: false },
        title: { type: String, default: "We'll be right back" },
        message: {
          type: String,
          default:
            'NestSecure is undergoing scheduled maintenance. Please check back shortly.',
        },
        estimatedReturn: { type: String, default: '' },
        allowOwnerAccess: { type: Boolean, default: false },
      }
    ),

    registration: sub(
      {
        enableUser: { type: Boolean, default: true },
        enableOwner: { type: Boolean, default: true },
        requireEmailVerification: { type: Boolean, default: false },
        requireAdminApprovalOwners: { type: Boolean, default: false },
      }
    ),

    security: sub(
      {
        sessionTimeoutMinutes: { type: Number, default: 10080, min: 5, max: 43200 },
        maxLoginAttempts: { type: Number, default: 10, min: 3, max: 50 },
        requireEmailVerification: { type: Boolean, default: false },
        requireStrongPassword: { type: Boolean, default: false },
        enableMaintenanceRestrictions: { type: Boolean, default: true },
      }
    ),

    advanced: sub(
      {
        cachePublicSettings: { type: Boolean, default: true },
        showPoweredBy: { type: Boolean, default: true },
      }
    ),

    auditLog: { type: [auditSchema], default: [] },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false }
);

// Singleton accessor: find-or-create the one global document.
// Every settings section, used for self-healing older/partial documents.
const SECTION_PATHS = [
  'general', 'branding', 'appearance', 'theme', 'navigation', 'announcement',
  'homepage', 'footer', 'social', 'contact', 'booking', 'payments', 'seo',
  'notifications', 'maintenance', 'registration', 'security', 'advanced',
];

// Backfill any section that is missing or explicitly null on an existing doc.
// Documents created before section paths had defaults (or written with a null
// section) would otherwise crash the controller on `doc.<section>.<field>`.
// Schema defaults cover freshly-created docs; this covers already-persisted
// ones, including the null-stored edge case that defaults do NOT repair.
siteSettingsSchema.statics.normalize = function (doc) {
  if (!doc) return doc;
  const fresh = new this();
  let changed = false;
  for (const path of SECTION_PATHS) {
    if (doc[path] == null) {
      doc[path] = fresh[path];
      doc.markModified(path);
      changed = true;
    }
  }
  if (!Array.isArray(doc.themes)) doc.themes = [];
  if (!Array.isArray(doc.auditLog)) doc.auditLog = [];
  return { doc, changed };
};

// Singleton accessor: find-or-create the one global document, self-healing any
// missing sections so downstream code can always read `doc.<section>.<field>`.
siteSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) {
    doc = await this.create({ key: 'global' });
    return doc;
  }
  const { changed } = this.normalize(doc);
  if (changed) await doc.save();
  return doc;
};

export default mongoose.model('SiteSettings', siteSettingsSchema);
