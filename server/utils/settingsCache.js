import SiteSettings from '../models/SiteSettings.js';

// Tiny in-memory cache for the singleton settings document. Reads are frequent
// (public API + maintenance gate on every request) but writes are rare, so we
// cache the plain object and invalidate on any admin update. No Redis needed —
// this is process-local and rebuilds itself on demand.
let cached = null;
let cachedAt = 0;
const TTL_MS = 60 * 1000; // safety refresh even without explicit invalidation

export function invalidateSettingsCache() {
  cached = null;
  cachedAt = 0;
}

/** Returns the settings as a lean plain object, cached. Safe to call often. */
export async function getCachedSettings() {
  const fresh = cached && Date.now() - cachedAt < TTL_MS;
  if (fresh) return cached;
  const doc = await SiteSettings.getSingleton();
  cached = doc.toObject();
  cachedAt = Date.now();
  return cached;
}

/** Prime/replace the cache from a document we already have in hand. */
export function primeSettingsCache(doc) {
  cached = doc?.toObject ? doc.toObject() : doc;
  cachedAt = Date.now();
}
