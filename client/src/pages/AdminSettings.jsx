import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  getAdminSettings,
  updateSettingsSection,
  resetSettingsSection,
  uploadBrandingImage,
  removeBrandingImage,
  createTheme as createThemeApi,
  updateTheme as updateThemeApi,
  deleteTheme as deleteThemeApi,
  activateTheme as activateThemeApi,
} from '../services/settingsService.js';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Shimmer from '../components/Skeleton.jsx';
import {
  GeneralPanel,
  BrandingPanel,
  HomepagePanel,
  FooterPanel,
  ContactPanel,
  SocialPanel,
} from '../components/settings/panels/ContentPanels.jsx';
import { ThemePanel, AppearancePanel } from '../components/settings/panels/AppearancePanels.jsx';
import {
  NavigationPanel,
  AnnouncementPanel,
  BookingPanel,
  PaymentsPanel,
  RegistrationPanel,
  SeoPanel,
  NotificationsPanel,
  MaintenancePanel,
  SecurityPanel,
  AdvancedPanel,
} from '../components/settings/panels/SystemPanels.jsx';

// ── Navigation model ────────────────────────────────────────────────────────
// `instant` sections manage themselves (theme activation, image upload) and so
// never show the save bar. Everything else is a draft-backed form section.
const NAV_GROUPS = [
  {
    title: 'Brand & content',
    items: [
      { key: 'general', label: 'General', kw: 'site name currency timezone support email phone' },
      { key: 'branding', label: 'Branding', kw: 'logo favicon brand mark image' },
      { key: 'homepage', label: 'Homepage', kw: 'hero featured landing headline' },
      { key: 'footer', label: 'Footer', kw: 'footer copyright links address' },
      { key: 'contact', label: 'Contact', kw: 'support email phone whatsapp address hours map' },
      { key: 'social', label: 'Social links', kw: 'instagram facebook linkedin youtube twitter x' },
    ],
  },
  {
    title: 'Appearance',
    items: [
      { key: 'theme', label: 'Theme', kw: 'colors palette theme custom brand color', instant: true },
      { key: 'appearance', label: 'Typography & layout', kw: 'font size radius density container button mode dark light' },
    ],
  },
  {
    title: 'Navigation & notices',
    items: [
      { key: 'navigation', label: 'Navigation', kw: 'navbar menu sticky links header' },
      { key: 'announcement', label: 'Announcement bar', kw: 'banner notice announcement message' },
    ],
  },
  {
    title: 'Business rules',
    items: [
      { key: 'booking', label: 'Booking rules', kw: 'duration approval cancellation instant' },
      { key: 'payments', label: 'Payments', kw: 'razorpay online pay fee tax platform' },
      { key: 'registration', label: 'Registration', kw: 'signup owner guest verification approval' },
    ],
  },
  {
    title: 'System',
    items: [
      { key: 'seo', label: 'SEO & meta', kw: 'title description keywords open graph twitter robots index' },
      { key: 'notifications', label: 'Notifications', kw: 'email booking refund welcome payment' },
      { key: 'maintenance', label: 'Maintenance mode', kw: 'offline maintenance 503 downtime' },
      { key: 'security', label: 'Security', kw: 'session login attempts password policy' },
      { key: 'advanced', label: 'Advanced', kw: 'cache powered by performance' },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const isInstant = (key) => !!ALL_ITEMS.find((i) => i.key === key)?.instant;

// Sections the save bar/draft model owns. Branding is a form section (brand
// name/tagline) that ALSO hosts instant image uploads.
const FORM_SECTIONS = ALL_ITEMS.filter((i) => !i.instant).map((i) => i.key);

const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Build the editable draft from a server doc. We deliberately exclude values
// managed elsewhere: branding image URLs (uploaded separately) and
// appearance.activeTheme (owned by the theme manager).
function hydrateDraft(doc) {
  const d = {};
  for (const key of FORM_SECTIONS) {
    if (key === 'branding') {
      d.branding = {
        brandName: doc.branding?.brandName ?? '',
        brandTagline: doc.branding?.brandTagline ?? '',
      };
    } else if (key === 'appearance') {
      const { activeTheme, ...rest } = doc.appearance || {};
      d.appearance = clone(rest);
    } else {
      d[key] = clone(doc[key]);
    }
  }
  return d;
}

export default function AdminSettings() {
  const toast = useToast();
  const { refresh } = useSiteSettings();

  const [doc, setDoc] = useState(null);
  const [predefined, setPredefined] = useState([]);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null); // last-persisted snapshot (form sections)
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [active, setActive] = useState('general');
  const [query, setQuery] = useState('');
  const [savingSection, setSavingSection] = useState(null);
  const [themeBusy, setThemeBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState(null); // section key pending reset
  const [pendingNav, setPendingNav] = useState(null); // target key awaiting discard confirm

  const contentTop = useRef(null);

  // ── Load ────────────────────────────────────────────────────────────────
  const loadDoc = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await getAdminSettings();
      const d = res.data;
      setDoc(d);
      setPredefined(res.predefinedThemes || []);
      const hydrated = hydrateDraft(d);
      setDraft(hydrated);
      setSaved(clone(hydrated));
    } catch (err) {
      setLoadError(err.message || 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoc();
  }, [loadDoc]);

  // ── Dirty tracking ────────────────────────────────────────────────────────
  const dirtySections = useMemo(() => {
    if (!draft || !saved) return new Set();
    const set = new Set();
    for (const key of FORM_SECTIONS) {
      if (!eq(draft[key], saved[key])) set.add(key);
    }
    return set;
  }, [draft, saved]);

  const anyDirty = dirtySections.size > 0;
  const activeDirty = dirtySections.has(active);

  // Warn before leaving the tab/refreshing with unsaved edits (§34).
  useEffect(() => {
    if (!anyDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [anyDirty]);

  // ── Draft editing ─────────────────────────────────────────────────────────
  const patchSection = useCallback(
    (section) => (partial) =>
      setDraft((d) => ({ ...d, [section]: { ...d[section], ...partial } })),
    []
  );

  const discardSection = useCallback(
    (section) => setDraft((d) => ({ ...d, [section]: clone(saved[section]) })),
    [saved]
  );

  // ── Persist one section ─────────────────────────────────────────────────
  const saveSection = async (section) => {
    setSavingSection(section);
    try {
      const res = await updateSettingsSection(section, draft[section]);
      // res.data is the saved section subdoc. Re-sync doc + snapshot.
      setDoc((d) => ({ ...d, [section]: { ...d[section], ...res.data } }));
      setSaved((s) => ({ ...s, [section]: clone(draft[section]) }));
      toast.success('Changes saved');
      refresh(); // push the safe subset to the live site immediately
    } catch (err) {
      toast.error(err.message || 'Could not save changes');
    } finally {
      setSavingSection(null);
    }
  };

  // ── Reset one section to defaults ────────────────────────────────────────
  const doReset = async () => {
    const section = resetTarget;
    if (!section) return;
    setSavingSection(section);
    try {
      const res = await resetSettingsSection(section);
      // Rehydrate just this section from the returned defaults.
      const next = { ...doc, [section]: res.data };
      if (section === 'appearance' || section === 'theme') {
        // Controller also resets active theme + tokens; refetch to stay exact.
        setResetTarget(null);
        await loadDoc();
        toast.success('Reset to defaults');
        refresh();
        return;
      }
      setDoc(next);
      const rehydrated = hydrateDraft(next);
      setDraft((d) => ({ ...d, [section]: rehydrated[section] }));
      setSaved((s) => ({ ...s, [section]: clone(rehydrated[section]) }));
      toast.success('Reset to defaults');
      refresh();
    } catch (err) {
      toast.error(err.message || 'Could not reset section');
    } finally {
      setSavingSection(null);
      setResetTarget(null);
    }
  };

  // ── Branding images (instant) ─────────────────────────────────────────────
  const onUploadImage = async (slot, file) => {
    const res = await uploadBrandingImage(slot, file); // throws on failure
    setDoc((d) => ({ ...d, branding: { ...d.branding, [slot]: res.data.url } }));
    toast.success('Image updated');
    refresh();
  };

  const onRemoveImage = async (slot) => {
    await removeBrandingImage(slot);
    setDoc((d) => ({ ...d, branding: { ...d.branding, [slot]: '' } }));
    toast.success('Image removed');
    refresh();
  };

  // ── Theme manager (instant) ───────────────────────────────────────────────
  const withThemeBusy = async (fn, okMsg) => {
    setThemeBusy(true);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      refresh();
    } catch (err) {
      toast.error(err.message || 'Theme action failed');
    } finally {
      setThemeBusy(false);
    }
  };

  const onActivateTheme = (id) =>
    withThemeBusy(async () => {
      const res = await activateThemeApi(id);
      setDoc((d) => ({
        ...d,
        appearance: { ...d.appearance, activeTheme: id },
        theme: res.data.theme,
      }));
    }, 'Theme activated');

  const onCreateTheme = (payload) =>
    withThemeBusy(async () => {
      const res = await createThemeApi(payload);
      setDoc((d) => ({ ...d, themes: [...(d.themes || []), res.data] }));
    }, 'Custom theme created');

  const onUpdateTheme = (id, payload) =>
    withThemeBusy(async () => {
      const res = await updateThemeApi(id, payload);
      setDoc((d) => {
        const isActive = d.appearance?.activeTheme === id;
        return {
          ...d,
          themes: (d.themes || []).map((t) => (t._id === id ? res.data : t)),
          theme: isActive ? { ...d.theme, ...res.data } : d.theme,
        };
      });
    }, 'Theme updated');

  const onDeleteTheme = (id) =>
    withThemeBusy(async () => {
      await deleteThemeApi(id);
      setDoc((d) => ({ ...d, themes: (d.themes || []).filter((t) => t._id !== id) }));
    }, 'Theme deleted');

  // ── Navigation with unsaved guard ────────────────────────────────────────
  const go = (key) => {
    if (key === active) return;
    if (activeDirty) {
      setPendingNav(key);
      return;
    }
    setActive(key);
    setQuery('');
    contentTop.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const confirmLeave = () => {
    discardSection(active);
    setActive(pendingNav);
    setPendingNav(null);
    setQuery('');
  };

  // ── Search filter ─────────────────────────────────────────────────────────
  const q = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => i.label.toLowerCase().includes(q) || i.kw.includes(q)
      ),
    })).filter((g) => g.items.length);
  }, [q]);

  const activeItem = ALL_ITEMS.find((i) => i.key === active);
  const canReset = !isInstant(active); // form sections are resettable

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) return <SettingsSkeleton />;

  if (loadError) {
    return (
      <div className="page-container flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="mb-3 rounded-full bg-danger/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-danger">
          Couldn’t load settings
        </span>
        <p className="mb-5 max-w-sm text-neutral-600">{loadError}</p>
        <Button onClick={loadDoc}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="bg-paper">
      <div className="page-container py-8 lg:py-10">
        {/* Header */}
        <div className="mb-6">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand">
            Control room
          </p>
          <h1 className="font-display text-3xl font-extrabold text-neutral-900">
            Site settings
          </h1>
          <p className="mt-1 text-neutral-600">
            Manage branding, appearance, content, and platform behavior. Changes
            to the public site apply as soon as you save.
          </p>
        </div>

        {/* Mobile section picker */}
        <div className="mb-5 lg:hidden">
          <label htmlFor="section-picker" className="sr-only">
            Choose a settings section
          </label>
          <select
            id="section-picker"
            value={active}
            onChange={(e) => go(e.target.value)}
            className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 pr-10 text-sm text-neutral-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            {NAV_GROUPS.map((g) => (
              <optgroup key={g.title} label={g.title}>
                {g.items.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.label}
                    {dirtySections.has(i.key) ? ' •' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-3">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search settings…"
                  className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3.5 text-sm text-neutral-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  aria-label="Search settings"
                />
              </div>
              <nav className="max-h-[calc(100vh-11rem)] space-y-5 overflow-y-auto pr-1">
                {filteredGroups.length === 0 && (
                  <p className="px-1 py-4 text-sm text-neutral-400">
                    No settings match “{query}”.
                  </p>
                )}
                {filteredGroups.map((g) => (
                  <div key={g.title}>
                    <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-neutral-400">
                      {g.title}
                    </p>
                    <ul className="space-y-0.5">
                      {g.items.map((i) => {
                        const on = active === i.key;
                        return (
                          <li key={i.key}>
                            <button
                              type="button"
                              onClick={() => go(i.key)}
                              aria-current={on ? 'page' : undefined}
                              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                on
                                  ? 'bg-indigo-brand/10 font-semibold text-indigo-brand'
                                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                              }`}
                            >
                              <span className="truncate">{i.label}</span>
                              {dirtySections.has(i.key) && (
                                <span
                                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
                                  aria-label="Unsaved changes"
                                />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div ref={contentTop} className="min-w-0">
            {/* Section toolbar: reset lives here so it's reachable even when clean */}
            {canReset && (
              <div className="mb-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setResetTarget(active)}
                  disabled={savingSection === active}
                  className="text-xs font-semibold text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline disabled:opacity-50"
                >
                  Reset section to defaults
                </button>
              </div>
            )}

            {/* Extra bottom padding leaves room for the sticky save bar */}
            <div className={activeDirty ? 'pb-28' : ''}>
              {renderPanel({
                active,
                doc,
                draft,
                predefined,
                patchSection,
                themeBusy,
                onActivateTheme,
                onCreateTheme,
                onUpdateTheme,
                onDeleteTheme,
                onUploadImage,
                onRemoveImage,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save bar (form sections only) */}
      {activeDirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="page-container flex items-center justify-between gap-3 py-3">
            <p className="flex items-center gap-2 text-sm text-neutral-600">
              <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
              <span className="truncate">
                Unsaved changes in <strong className="text-neutral-900">{activeItem?.label}</strong>
              </span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => discardSection(active)}
                disabled={savingSection === active}
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={() => saveSection(active)}
                loading={savingSection === active}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm */}
      <Modal
        open={!!resetTarget}
        onClose={() => savingSection !== resetTarget && setResetTarget(null)}
        title="Reset to defaults?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setResetTarget(null)} disabled={savingSection === resetTarget}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={doReset} loading={savingSection === resetTarget}>
              Reset section
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          This restores the <strong>{ALL_ITEMS.find((i) => i.key === resetTarget)?.label}</strong>{' '}
          section to its original values. This can’t be undone.
          {resetTarget === 'appearance' && ' It also resets the active theme to the default palette.'}
        </p>
      </Modal>

      {/* Unsaved-changes guard on section switch */}
      <Modal
        open={!!pendingNav}
        onClose={() => setPendingNav(null)}
        title="Discard unsaved changes?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingNav(null)}>
              Keep editing
            </Button>
            <Button variant="danger" size="sm" onClick={confirmLeave}>
              Discard changes
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          You have unsaved changes in{' '}
          <strong>{activeItem?.label}</strong>. Leaving now will discard them.
        </p>
      </Modal>
    </div>
  );
}

// Renders the active panel with the right props for its contract.
function renderPanel(ctx) {
  const { active, doc, draft, predefined, patchSection } = ctx;
  switch (active) {
    case 'general':
      return <GeneralPanel value={draft.general} patch={patchSection('general')} />;
    case 'branding':
      return (
        <BrandingPanel
          value={draft.branding}
          patch={patchSection('branding')}
          images={doc.branding}
          onUpload={ctx.onUploadImage}
          onRemove={ctx.onRemoveImage}
        />
      );
    case 'homepage':
      return <HomepagePanel value={draft.homepage} patch={patchSection('homepage')} />;
    case 'footer':
      return <FooterPanel value={draft.footer} patch={patchSection('footer')} />;
    case 'contact':
      return <ContactPanel value={draft.contact} patch={patchSection('contact')} />;
    case 'social':
      return <SocialPanel value={draft.social} patch={patchSection('social')} />;
    case 'theme':
      return (
        <ThemePanel
          activeTheme={doc.appearance?.activeTheme}
          customThemes={doc.themes || []}
          predefined={predefined}
          busy={ctx.themeBusy}
          onActivate={ctx.onActivateTheme}
          onCreate={ctx.onCreateTheme}
          onUpdate={ctx.onUpdateTheme}
          onDelete={ctx.onDeleteTheme}
        />
      );
    case 'appearance':
      return <AppearancePanel value={draft.appearance} patch={patchSection('appearance')} />;
    case 'navigation':
      return <NavigationPanel value={draft.navigation} patch={patchSection('navigation')} />;
    case 'announcement':
      return <AnnouncementPanel value={draft.announcement} patch={patchSection('announcement')} />;
    case 'booking':
      return <BookingPanel value={draft.booking} patch={patchSection('booking')} />;
    case 'payments':
      return <PaymentsPanel value={draft.payments} patch={patchSection('payments')} />;
    case 'registration':
      return <RegistrationPanel value={draft.registration} patch={patchSection('registration')} />;
    case 'seo':
      return <SeoPanel value={draft.seo} patch={patchSection('seo')} />;
    case 'notifications':
      return <NotificationsPanel value={draft.notifications} patch={patchSection('notifications')} />;
    case 'maintenance':
      return <MaintenancePanel value={draft.maintenance} patch={patchSection('maintenance')} />;
    case 'security':
      return <SecurityPanel value={draft.security} patch={patchSection('security')} />;
    case 'advanced':
      return <AdvancedPanel value={draft.advanced} patch={patchSection('advanced')} />;
    default:
      return null;
  }
}

function SettingsSkeleton() {
  return (
    <div className="bg-paper">
      <div className="page-container py-8 lg:py-10">
        <Shimmer className="mb-2 h-8 w-56" />
        <Shimmer className="mb-8 h-4 w-80 max-w-full" />
        <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
          <div className="hidden space-y-2 lg:block">
            {Array.from({ length: 8 }).map((_, i) => (
              <Shimmer key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="surface-card p-6">
            <Shimmer className="mb-6 h-6 w-40" />
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Shimmer key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
