import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
} from 'react';
import { DEFAULT_PUBLIC_SETTINGS } from '../config/defaultSettings.js';
import { getPublicSettings } from '../services/settingsService.js';
import { applyTheme, applyDocumentMeta } from '../utils/applyTheme.js';

const SiteSettingsContext = createContext({
  settings: DEFAULT_PUBLIC_SETTINGS,
  loading: true,
  ready: false,
  refresh: () => {},
});

export const useSiteSettings = () => useContext(SiteSettingsContext);

// Recursively merge a (possibly partial) server payload onto the defaults so no
// section is ever undefined — a stale or trimmed response can't crash consumers.
function deepMerge(base, override) {
  if (Array.isArray(override)) return override;
  if (override && typeof override === 'object' && !Array.isArray(base)) {
    const out = { ...base };
    for (const key of Object.keys(override)) {
      const b = base ? base[key] : undefined;
      const o = override[key];
      out[key] =
        o && typeof o === 'object' && b && typeof b === 'object'
          ? deepMerge(b, o)
          : o;
    }
    return out;
  }
  return override === undefined ? base : override;
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // Paint the default theme before first paint (no flash for the default look;
  // the :root defaults already match, so this is effectively a no-op override
  // clear + meta sync).
  useLayoutEffect(() => {
    applyTheme(DEFAULT_PUBLIC_SETTINGS.theme, DEFAULT_PUBLIC_SETTINGS.appearance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await getPublicSettings();
      const merged = deepMerge(DEFAULT_PUBLIC_SETTINGS, res?.data || {});
      setSettings(merged);
      applyTheme(merged.theme, merged.appearance);
      applyDocumentMeta(merged);
    } catch {
      // Offline / API down → keep the built-in defaults (already applied).
      setSettings(DEFAULT_PUBLIC_SETTINGS);
      applyDocumentMeta(DEFAULT_PUBLIC_SETTINGS);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Re-resolve "system" mode when the OS color scheme flips.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(settings.theme, settings.appearance);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [settings]);

  const value = {
    settings,
    loading,
    ready,
    refresh: load,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
