# Admin Site Settings & Theme Management — Implementation Report

**Project:** NestSecure PG (MERN)
**Date:** 12 August 2026
**Scope:** Add a professional Site Settings / Appearance / Branding management system to the existing admin panel, so admins can control site‑wide settings without editing source code — **without rebuilding the app and without changing the current look by default.**

---

## 1. Summary

A complete Site Settings subsystem was added end‑to‑end: a singleton settings document on the backend, a safe public projection, admin‑only management APIs, a runtime theming engine driven by CSS custom properties, and a full admin UI (`/admin/settings`) with a sidebar, search, per‑section save/discard, unsaved‑changes protection, a theme manager with 6 predefined themes, a custom‑theme builder with live preview, image upload for branding, and additive site‑wide enforcement (maintenance mode, announcement bar, navigation toggles, homepage content, branding, typography, SEO meta).

The guiding constraint throughout was **§65: the site must look pixel‑identical immediately after implementation.** This was achieved by storing the exact current palette as `:root` CSS‑variable defaults and having the theme engine *remove* overrides for the default theme — so the out‑of‑the‑box experience is byte‑for‑byte unchanged, and themes only take effect when an admin activates them.

---

## 2. What was built (by area)

**Backend**

- `models/SiteSettings.js` — a singleton document (`key: 'global'`) holding every settings section (general, branding, appearance, theme, custom themes[], navigation, announcement, homepage, footer, social, contact, booking, payments, seo, notifications, maintenance, registration, security, advanced) plus an append‑only `auditLog[]`.
- `controllers/settingsController.js` — public read (safe projection), admin read (full doc + predefined themes), per‑section update, per‑section reset, branding image upload/remove, and theme CRUD + activation.
- `validators/settingsValidator.js` — a strict per‑section **allowlist** (type‑checked: string/bool/int/num/hex/url/email/enum/date) that silently drops unknown keys, preventing mass‑assignment. Sensitive sections are flagged for audit logging.
- `routes/settingsRoutes.js` — exposes **only** `GET /api/settings/public` (unauthenticated).
- `routes/adminRoutes.js` — all settings/theme mutations gated behind `[authMiddleware, adminMiddleware]`.
- `middleware/maintenanceMiddleware.js` — additive gate: when maintenance is on, non‑admins get a `503`; admins (and optionally owners) pass through; auth/settings/health routes are always allowed so an admin can log in and turn it off.
- `utils/settingsCache.js` — in‑memory cache of the singleton to keep the public endpoint and middleware fast.

**Frontend infrastructure**

- `config/defaultSettings.js` — client mirror of the public shape; the offline/fallback default that reproduces the current look exactly.
- `config/themes.js` — 6 predefined themes, token field definitions, and all appearance option lists.
- `utils/applyTheme.js` — the theming engine: writes the brand ramp as space‑separated RGB channels, sets radius/font/container/density/mode, loads allowlisted web fonts, and syncs document meta (title/description/robots/theme‑color/favicon).
- `context/SiteSettingsContext.jsx` — fetches public settings once, deep‑merges over defaults, applies the theme before first paint, and re‑resolves "system" mode on OS theme changes. Exposes `{ settings, loading, ready, refresh }`.
- `services/settingsService.js` — typed API wrappers.

**Admin UI**

- `pages/AdminSettings.jsx` — the page shell: grouped sidebar (5 groups), settings search, mobile section picker, per‑section save/discard bar, "reset section to defaults", and unsaved‑changes protection (in‑app confirm + browser `beforeunload`).
- `components/settings/panels/*` — every section panel (general, branding, homepage, footer, contact, social, theme, appearance, navigation, announcement, booking, payments, registration, seo, notifications, maintenance, security, advanced).
- Theme manager: predefined swatches + custom‑theme CRUD, with a modal builder (12 color fields, hex validation, live preview) and "can't delete the active theme" protection.
- Shared primitives added/reused: `Toggle`, `Textarea`, `ColorField`, `ThemePreview`, and a `size` prop on `Modal`.

**Wire‑in (this phase)**

- `index.css` — `:root` CSS‑variable defaults (exact current hexes as RGB channels) + layout‑knob defaults; `.page-container` max‑width now reads `--container-max`.
- `tailwind.config.js` — the brand `indigo` steps + `indigo.brand`/`indigo.deep` and the `primary` ramp resolve through `rgb(var(--c-primary-*) / <alpha-value>)`; fonts resolve through `--font-heading`/`--font-body`.
- `Button.jsx` / `Input.jsx` — control radius reads `--radius-control`.
- `Navbar.jsx` — consumes brand name, custom logo, sticky toggle, and nav visibility toggles (wishlist, owner portal, auth buttons).
- `Footer.jsx` — consumes brand name/logo, description, copyright, contact details, and social links (each rendered only when set).
- `Home.jsx` — hero heading/subheading and featured title come from settings.
- `App.jsx` — `AnnouncementBar` mounts above the navbar; `MaintenanceGate` wraps the app (with admin + auth‑route bypass).

---

## 3. Preserving the current design (§65)

The default look is provably unchanged:

- The 8 brand tokens are defined once in `:root` as RGB channels equal to the **exact** current hexes (`--c-primary-600: 79 70 229` → `#4F46E5`, etc.).
- For the default theme, `applyTheme()` *removes* any inline overrides, so those `:root` values win.
- Every layout knob default reproduces the current value: `--radius-control: 0.5rem` (= `rounded-lg`), `--container-max: 80rem` (= `max-w-7xl`), fonts = Inter.
- All settings consumers fall back to the current hard‑coded strings when a value is absent, and optional UI (announcement bar, social links, contact block) renders nothing until configured.

A verification script confirmed all 8 tokens and 4 layout defaults are byte‑identical (see §6).

---

## 4. Security & safety constraints honored

- **No secrets in the frontend.** The settings controller and validator contain zero references to `RAZORPAY_KEY_SECRET`, `JWT_SECRET`, DB URI, or SMTP credentials (scanned — clean). The Payments and Security panels carry explicit notes that secret keys live only on the server.
- **Safe public projection.** `toPublicSettings()` exposes only presentational sections; it excludes **payments, booking, security, notifications, and the audit log** (verified programmatically).
- **No mass assignment.** Per‑section allowlist validation drops any key not explicitly permitted.
- **Authorization.** Only `GET /public` is unauthenticated; all mutations require admin.
- **No arbitrary fonts / no unrestricted custom CSS.** Fonts are limited to an allowlist; there is no free‑form CSS field.
- **Images reuse the existing Cloudinary pipeline** — no base64 blobs stored in MongoDB.
- **Additive enforcement only.** Booking, payment, refund, and auth core logic are untouched; those settings are stored and manageable but intentionally not wired into the frozen flows. Only safe, non‑destructive settings are enforced (maintenance, announcement, navigation, homepage, branding, theme, typography, SEO).

---

## 5. Predefined themes

Six ship out of the box: **Indigo Professional** (the current default), plus five alternates spanning cool and warm palettes. Each defines 12 resolved tokens (primary, primary‑hover, accent, background, surface, border, text, muted, success, warning, error, info). Status colors and the marigold star accent stay static across themes so chips and ratings remain consistent. Admins can also build custom themes (hex‑validated, live preview) and activate any theme instantly.

---

## 6. Verification performed

All checks below passed:

| Check | Method | Result |
|---|---|---|
| Client syntax (all touched + settings files) | `@babel/parser` parse, 18 files | ✅ all parse |
| Backend syntax | `node --check`, 7 files | ✅ all pass |
| Client import/export graph | Static resolver from client entry points | ✅ 43 modules, no missing files/exports |
| Backend import/export graph | Static resolver from `server.js` | ✅ 48 modules, no missing files/exports |
| Backend module load (real ESM loader) | `import()` of settings chain + full route mount on a live Express app | ✅ mounts clean; all settings/theme endpoints register |
| Tailwind config loads | Dynamic `import()` | ✅ brand tokens resolve to `rgb(var(...))` |
| **Pixel‑identity (§65)** | RGB‑channel → hex comparison vs. original | ✅ 8/8 tokens + 4/4 layout defaults byte‑identical |
| Opacity modifiers preserved | Token audit (`bg-indigo-brand/10`, etc.) | ✅ 60+ modifiers still valid under RGB‑channel format |
| No unthemed brand steps leaked | grep for indigo/primary 100/400/800/900/950 in edited files | ✅ none |
| Secret leakage | grep for env/secret names in public surface | ✅ clean |
| Public projection safety | AST of `toPublicSettings` | ✅ excludes payments/booking/security/notifications/audit |
| Route authorization | Route inspection | ✅ only `GET /public` open; all mutations admin‑gated |
| Maintenance middleware | Code review | ✅ additive, admin bypass, fails open |

**Note on build:** the client uses Vite 8 (rolldown), which cannot run `vite build` in this Linux sandbox. Verification therefore relied on full AST parsing, a complete import/export graph resolution, and a Tailwind‑token compilation simulation rather than a production bundle. These catch the failure modes a build would (syntax errors, missing modules/exports, broken token references) but a final `npm run build` on your machine is recommended as a last gate.

**Post‑implementation fix (12 Aug 2026):** the first pass of this verification checked backend files with `node --check` (syntax only), which does not resolve cross‑module import *paths*. That let one bad path slip through: `validators/settingsValidator.js` imported `./settingsDefaults.js` when the file actually lives at `../utils/settingsDefaults.js`, so `npm run dev` crashed with `ERR_MODULE_NOT_FOUND`. The import was corrected, and verification was hardened to load the real Node ESM graph from `server.js` (48 modules) and to mount every route on a live Express app — both now pass, and the server boots (the only remaining wait is your MongoDB connection).

---

## 7. How to use it

1. Sign in as an admin and open **Admin → Site settings** (or go to `/admin/settings`).
2. Edit any section; use **Save** / **Discard** per section. Theme activation and image uploads apply immediately.
3. Try **Appearance → Theme** to switch palettes, or **+ Custom theme** to build your own.
4. Toggle **Maintenance mode** to take the public site offline — you'll retain access as an admin and can turn it back off.

---

## 8. Files changed / added

**Added (frontend):** `pages/AdminSettings.jsx`, `context/SiteSettingsContext.jsx`, `services/settingsService.js`, `config/defaultSettings.js`, `config/themes.js`, `utils/applyTheme.js`, `components/AnnouncementBar.jsx`, `components/MaintenanceGate.jsx`, `components/Toggle.jsx`, `components/Textarea.jsx`, `components/settings/**` (panels + fields + preview).

**Added (backend):** `models/SiteSettings.js`, `controllers/settingsController.js`, `routes/settingsRoutes.js`, `middleware/maintenanceMiddleware.js`, `validators/settingsValidator.js`, `utils/settingsCache.js`, `utils/settingsDefaults.js`.

**Edited (additive, design‑preserving):** `App.jsx`, `main.jsx`, `index.css`, `tailwind.config.js`, `Navbar.jsx`, `Footer.jsx`, `Home.jsx`, `Button.jsx`, `Input.jsx`, `Modal.jsx`, `Admin.jsx`, `server.js`, `routes/adminRoutes.js`, `middleware/upload.js`.

---

## 9. Deliberately deferred (honest scope)

- **Full dark mode.** The mode setting and `data-color-mode` hook are in place, but a complete dark surface palette isn't — dark/system currently keep light surfaces. The UI states this in an inline note.
- **Enforcing business rules.** Booking/cancellation/payment settings are stored and fully manageable but not yet wired into the live checkout/refund flows (per the agreed "store + manage, enforce only the safe ones" scope). Each panel says so.
- **Density rescale.** `data-density` is emitted but spacing isn't yet rescaled from it.

These are safe extension points that can be enabled later without schema churn.

---

## 10. Recommended next step

Run `npm run build` in `client/` on your machine as the final production gate, then activate a non‑default theme in the admin panel to confirm the runtime repaint end‑to‑end. If you'd like, the deferred items above (especially full dark mode) can be picked up as a follow‑up.
