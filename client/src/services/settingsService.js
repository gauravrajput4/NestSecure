import api from './api.js';

// ── Public (unauthenticated) ────────────────────────────────────────────────
// Safe subset consumed once by SiteSettingsProvider and shared app-wide.
export const getPublicSettings = () =>
  api.get('/settings/public').then((r) => r.data);

// ── Admin: read ─────────────────────────────────────────────────────────────
// Full document + predefined theme catalog. { success, data, predefinedThemes }
export const getAdminSettings = () =>
  api.get('/admin/settings').then((r) => r.data);

export const getAuditLog = () =>
  api.get('/admin/settings/audit').then((r) => r.data);

// ── Admin: section updates ──────────────────────────────────────────────────
export const updateSettingsSection = (section, payload) =>
  api.patch(`/admin/settings/${section}`, payload).then((r) => r.data);

export const resetSettingsSection = (section) =>
  api.post(`/admin/settings/reset/${section}`).then((r) => r.data);

// ── Admin: branding image upload / remove ───────────────────────────────────
// slot ∈ logo | logoDark | logoMobile | favicon. Field name must be "image".
export const uploadBrandingImage = (slot, file) => {
  const form = new FormData();
  form.append('image', file);
  return api
    .post(`/admin/settings/branding/${slot}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const removeBrandingImage = (slot) =>
  api.delete(`/admin/settings/branding/${slot}`).then((r) => r.data);

// ── Admin: theme CRUD ───────────────────────────────────────────────────────
export const createTheme = (payload) =>
  api.post('/admin/themes', payload).then((r) => r.data);

export const updateTheme = (id, payload) =>
  api.patch(`/admin/themes/${id}`, payload).then((r) => r.data);

export const deleteTheme = (id) =>
  api.delete(`/admin/themes/${id}`).then((r) => r.data);

export const activateTheme = (id) =>
  api.post(`/admin/themes/${id}/activate`).then((r) => r.data);

// ── Account (self-service) ──────────────────────────────────────────────────
// The signed-in user's notification/preference + saved payment methods.
export const getAccountSettings = () =>
  api.get('/settings/account').then((r) => r.data);
export const updateNotificationPrefs = (data) =>
  api.put('/settings/account/notifications', data).then((r) => r.data);
export const updatePrivacyPrefs = (data) =>
  api.put('/settings/account/privacy', data).then((r) => r.data);
export const addPaymentMethod = (data) =>
  api.post('/settings/account/payment-methods', data).then((r) => r.data);
export const setDefaultPaymentMethod = (id) =>
  api.put(`/settings/account/payment-methods/${id}/default`).then((r) => r.data);
export const deletePaymentMethod = (id) =>
  api.delete(`/settings/account/payment-methods/${id}`).then((r) => r.data);
export const exportAccountData = () =>
  api.get('/settings/account/data').then((r) => r.data);
export const deleteAccount = () =>
  api.post('/settings/account/delete-account').then((r) => r.data);