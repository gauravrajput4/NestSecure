import SiteSettings from '../models/SiteSettings.js';
import {
  PREDEFINED_THEMES,
  getPredefinedTheme,
  DEFAULT_THEME_KEY,
} from '../utils/settingsDefaults.js';
import {
  sanitizeSection,
  sanitizeTheme,
  VALID_SECTIONS,
  SENSITIVE_SECTIONS,
} from '../validators/settingsValidator.js';
import {
  getCachedSettings,
  invalidateSettingsCache,
  primeSettingsCache,
} from '../utils/settingsCache.js';
import { uploadBuffer, destroyImage } from '../utils/cloudinary.js';

const BRANDING_SLOTS = {
  logo: 'logoId',
  logoDark: 'logoDarkId',
  logoMobile: 'logoMobileId',
  favicon: 'faviconId',
};

// Is an announcement live right now (enabled + within its optional window)?
function announcementActive(a) {
  if (!a || !a.enabled) return false;
  const now = Date.now();
  if (a.startDate && new Date(a.startDate).getTime() > now) return false;
  if (a.endDate && new Date(a.endDate).getTime() < now) return false;
  return true;
}

// Whitelisted projection for unauthenticated visitors — never leaks internal
// business config (payments/booking rules/security/audit) to the frontend.
function toPublicSettings(s) {
  return {
    general: {
      siteName: s.general.siteName,
      shortName: s.general.shortName,
      tagline: s.general.tagline,
      description: s.general.description,
      language: s.general.language,
      currency: s.general.currency,
      currencySymbol: s.general.currencySymbol,
      country: s.general.country,
      dateFormat: s.general.dateFormat,
      timeFormat: s.general.timeFormat,
      supportEmail: s.general.supportEmail,
      supportPhone: s.general.supportPhone,
    },
    branding: {
      logo: s.branding.logo,
      logoDark: s.branding.logoDark,
      logoMobile: s.branding.logoMobile,
      favicon: s.branding.favicon,
      brandName: s.branding.brandName,
      brandTagline: s.branding.brandTagline,
    },
    appearance: {
      activeTheme: s.appearance.activeTheme,
      mode: s.appearance.mode,
      headingFont: s.appearance.headingFont,
      bodyFont: s.appearance.bodyFont,
      fontWeight: s.appearance.fontWeight,
      fontScale: s.appearance.fontScale,
      radius: s.appearance.radius,
      density: s.appearance.density,
      containerWidth: s.appearance.containerWidth,
      buttonStyle: s.appearance.buttonStyle,
    },
    theme: s.theme,
    navigation: s.navigation,
    announcement: {
      active: announcementActive(s.announcement),
      text: s.announcement.text,
      link: s.announcement.link,
      style: s.announcement.style,
    },
    homepage: s.homepage,
    footer: s.footer,
    social: s.social,
    contact: s.contact,
    seo: s.seo,
    registration: {
      enableUser: s.registration.enableUser,
      enableOwner: s.registration.enableOwner,
    },
    maintenance: {
      enabled: s.maintenance.enabled,
      title: s.maintenance.title,
      message: s.maintenance.message,
      estimatedReturn: s.maintenance.estimatedReturn,
    },
    advanced: { showPoweredBy: s.advanced.showPoweredBy },
    updatedAt: s.updatedAt,
  };
}

function pushAudit(doc, req, action, section) {
  doc.auditLog.push({
    admin: req.user?._id,
    adminName: req.user?.name,
    adminEmail: req.user?.email,
    action,
    section,
  });
  // Keep only the most recent 50 entries.
  if (doc.auditLog.length > 50) {
    doc.auditLog = doc.auditLog.slice(-50);
  }
}

async function persist(doc, req) {
  doc.updatedBy = req.user?._id;
  await doc.save();
  primeSettingsCache(doc);
}

// GET /api/settings/public — cached, unauthenticated, safe subset.
export async function getPublicSettings(req, res, next) {
  try {
    const s = await getCachedSettings();
    res.json({ success: true, data: toPublicSettings(s) });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/settings — full document + predefined themes catalog.
export async function getAdminSettings(req, res, next) {
  try {
    const doc = await SiteSettings.getSingleton();
    res.json({
      success: true,
      data: doc,
      predefinedThemes: PREDEFINED_THEMES,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/settings/:section — validated, allowlisted partial update.
export async function updateSection(req, res, next) {
  try {
    const { section } = req.params;
    if (!VALID_SECTIONS.has(section)) {
      return res
        .status(400)
        .json({ success: false, message: `Unknown settings section: ${section}` });
    }
    const { value, error } = sanitizeSection(section, req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const doc = await SiteSettings.getSingleton();
    Object.assign(doc[section], value);
    doc.markModified(section);

    if (SENSITIVE_SECTIONS.has(section)) {
      pushAudit(doc, req, `Updated ${section} settings`, section);
    }
    await persist(doc, req);
    res.json({ success: true, data: doc[section] });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/themes — create a custom theme.
export async function createTheme(req, res, next) {
  try {
    const { value, error } = sanitizeTheme(req.body);
    if (error) return res.status(400).json({ success: false, message: error });
    if (!value.name)
      return res.status(400).json({ success: false, message: 'Theme name is required' });

    const doc = await SiteSettings.getSingleton();
    // Fill any missing tokens from the current active theme for a complete set.
    const base = getPredefinedTheme(DEFAULT_THEME_KEY);
    doc.themes.push({ ...base, ...value });
    pushAudit(doc, req, `Created custom theme "${value.name}"`, 'theme');
    await persist(doc, req);
    const created = doc.themes[doc.themes.length - 1];
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/themes/:id — edit a custom theme (and re-apply if active).
export async function updateTheme(req, res, next) {
  try {
    const { value, error } = sanitizeTheme(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const doc = await SiteSettings.getSingleton();
    const theme = doc.themes.id(req.params.id);
    if (!theme)
      return res.status(404).json({ success: false, message: 'Custom theme not found' });

    Object.assign(theme, value);
    // If this custom theme is currently active, sync the resolved tokens too.
    if (doc.appearance.activeTheme === String(theme._id)) {
      Object.assign(doc.theme, {
        primary: theme.primary, primaryHover: theme.primaryHover, accent: theme.accent,
        background: theme.background, surface: theme.surface, border: theme.border,
        text: theme.text, muted: theme.muted, success: theme.success,
        warning: theme.warning, error: theme.error, info: theme.info,
      });
      doc.markModified('theme');
    }
    pushAudit(doc, req, `Edited custom theme "${theme.name}"`, 'theme');
    await persist(doc, req);
    res.json({ success: true, data: theme });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/themes/:id — cannot delete the active theme.
export async function deleteTheme(req, res, next) {
  try {
    const doc = await SiteSettings.getSingleton();
    const theme = doc.themes.id(req.params.id);
    if (!theme)
      return res.status(404).json({ success: false, message: 'Custom theme not found' });
    if (doc.appearance.activeTheme === String(theme._id)) {
      return res.status(409).json({
        success: false,
        message: 'Switch to another theme before deleting this one',
      });
    }
    const name = theme.name;
    theme.deleteOne();
    pushAudit(doc, req, `Deleted custom theme "${name}"`, 'theme');
    await persist(doc, req);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/themes/:id/activate — activate a predefined key OR custom id.
export async function activateTheme(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await SiteSettings.getSingleton();

    let tokens = null;
    let label = '';
    const predefined = PREDEFINED_THEMES.find((t) => t.key === id);
    if (predefined) {
      tokens = predefined;
      label = predefined.name;
    } else {
      const custom = doc.themes.id(id);
      if (!custom)
        return res.status(404).json({ success: false, message: 'Theme not found' });
      tokens = custom;
      label = custom.name;
    }

    doc.appearance.activeTheme = id;
    Object.assign(doc.theme, {
      primary: tokens.primary, primaryHover: tokens.primaryHover, accent: tokens.accent,
      background: tokens.background, surface: tokens.surface, border: tokens.border,
      text: tokens.text, muted: tokens.muted, success: tokens.success,
      warning: tokens.warning, error: tokens.error, info: tokens.info,
    });
    doc.markModified('theme');
    doc.markModified('appearance');
    pushAudit(doc, req, `Activated theme "${label}"`, 'theme');
    await persist(doc, req);
    res.json({ success: true, data: { activeTheme: id, theme: doc.theme } });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/settings/reset/:section — reset one section to defaults.
export async function resetSection(req, res, next) {
  try {
    const { section } = req.params;
    const resettable = new Set([...VALID_SECTIONS]);
    if (!resettable.has(section)) {
      return res
        .status(400)
        .json({ success: false, message: `Cannot reset unknown section: ${section}` });
    }
    const doc = await SiteSettings.getSingleton();
    // Pull schema defaults from a fresh (unsaved) instance.
    const fresh = new SiteSettings();
    doc[section] = fresh[section];
    if (section === 'theme' || section === 'appearance') {
      doc.appearance.activeTheme = DEFAULT_THEME_KEY;
      doc.theme = getPredefinedTheme(DEFAULT_THEME_KEY);
      doc.markModified('appearance');
      doc.markModified('theme');
    }
    doc.markModified(section);
    pushAudit(doc, req, `Reset ${section} to defaults`, section);
    await persist(doc, req);
    res.json({ success: true, data: doc[section] });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/settings/branding/:slot — upload logo/favicon/etc.
export async function uploadBrandingImage(req, res, next) {
  try {
    const { slot } = req.params;
    if (!(slot in BRANDING_SLOTS)) {
      return res.status(400).json({
        success: false,
        message: `Unknown branding slot. Use one of: ${Object.keys(BRANDING_SLOTS).join(', ')}`,
      });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Choose an image to upload' });
    }
    const doc = await SiteSettings.getSingleton();
    const result = await uploadBuffer(req.file.buffer, {
      folder: 'roomward/settings',
      publicId: slot,
    });
    // Remove the previous asset for this slot, if any.
    const idField = BRANDING_SLOTS[slot];
    if (doc.branding[idField]) await destroyImage(doc.branding[idField]);

    doc.branding[slot] = result.url;
    doc.branding[idField] = result.publicId;
    doc.markModified('branding');
    await persist(doc, req);
    res.status(201).json({ success: true, data: { slot, url: result.url } });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/settings/branding/:slot — clear an uploaded image.
export async function removeBrandingImage(req, res, next) {
  try {
    const { slot } = req.params;
    if (!(slot in BRANDING_SLOTS)) {
      return res.status(400).json({ success: false, message: 'Unknown branding slot' });
    }
    const doc = await SiteSettings.getSingleton();
    const idField = BRANDING_SLOTS[slot];
    if (doc.branding[idField]) await destroyImage(doc.branding[idField]);
    doc.branding[slot] = '';
    doc.branding[idField] = '';
    doc.markModified('branding');
    await persist(doc, req);
    res.json({ success: true, data: { slot } });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/settings/audit — recent change log (newest first).
export async function getAuditLog(req, res, next) {
  try {
    const doc = await SiteSettings.getSingleton();
    const log = [...doc.auditLog].reverse();
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
}
