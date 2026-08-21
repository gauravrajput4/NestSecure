import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPGs } from '../services/pgService.js';
import PGCard from '../components/PGCard.jsx';
import PGMap from '../components/PGMap.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Button from '../components/Button.jsx';
import { PGCardSkeletonList } from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import Reveal from '../components/Reveal.jsx';

const PAGE_SIZE = 9;

export default function Home() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true); // first page of a query
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [highlightedPG, setHighlightedPG] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Bangalore default
  const toast = useToast();
  const { settings } = useSiteSettings();
  const homepage = settings?.homepage || {};
  const heroHeading = homepage.heroHeading || 'Find Your Safe Haven.';
  const heroSubheading =
    homepage.heroSubheading ||
    'Discover verified, secure, and comfortable PGs tailored to your needs. Zero friction, total peace of mind.';
  const featuredTitle = homepage.featuredTitle || 'Featured Properties';

  // Filters (form state) + the snapshot that's actually applied to queries
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [gender, setGender] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [applied, setApplied] = useState({});

  const sentinelRef = useRef(null);
  const loadingRef = useRef(false); // guards against duplicate observer fires

  // Build query params from an applied-filter snapshot + page number
  const buildParams = useCallback(
    (snapshot, pageNum) => {
      const params = { page: pageNum, limit: PAGE_SIZE };
      if (snapshot.city) params.city = snapshot.city;
      if (snapshot.maxPrice) params.maxPrice = snapshot.maxPrice;
      if (snapshot.minRating) params.minRating = snapshot.minRating;
      if (snapshot.gender && snapshot.gender !== 'BOTH')
        params.gender = snapshot.gender;
      if (snapshot.availableOnly) params.availableOnly = 'true';
      if (userLocation && snapshot.maxDistance) {
        params.lat = userLocation[0];
        params.lng = userLocation[1];
        params.maxDistance = snapshot.maxDistance;
      }
      return params;
    },
    [userLocation]
  );

  // Fetch one page. page 1 replaces the list; later pages append.
  const loadPage = useCallback(
    async (snapshot, pageNum) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);
      try {
        const res = await fetchPGs(buildParams(snapshot, pageNum));
        setPgs((prev) => (pageNum === 1 ? res.data : [...prev, ...res.data]));
        setPage(pageNum);
        setHasMore(res.pagination?.hasMore ?? false);
        setTotal(res.pagination?.total ?? res.data.length);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    },
    [buildParams, toast]
  );

  // Initial load + geolocation
  useEffect(() => {
    loadPage({}, 1);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => toast.info('Location access denied — showing all PGs')
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll — observe the sentinel and pull the next page
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadPage(applied, page + 1);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, page, applied, loadPage]);

  const applyFilters = () => {
    const snapshot = { city, maxPrice, minRating, gender, maxDistance, availableOnly };
    setApplied(snapshot);
    loadPage(snapshot, 1);
  };

  const resetFilters = () => {
    setCity('');
    setMaxPrice('');
    setMinRating('');
    setGender('');
    setMaxDistance('');
    setAvailableOnly(false);
    setApplied({});
    loadPage({}, 1);
  };

  const handleMarkerClick = (pg) => {
    setHighlightedPG(pg._id);
    document
      .getElementById(`pg-${pg._id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const filteredPGs = pgs;
  const activeFilters = [
    city ? `City: ${city}` : null,
    gender ? `Occupancy: ${gender.replace('_', ' ')}` : null,
    maxPrice ? `Max ₹${Number(maxPrice).toLocaleString('en-IN')}` : null,
    minRating ? `Min rating ${minRating}+` : null,
    maxDistance ? `Within ${maxDistance} km` : null,
    availableOnly ? 'Available only' : null,
  ].filter(Boolean);
  const availableCount = filteredPGs.filter((pg) => pg.availableRooms > 0).length;

  // Instrument-panel reading: current viewport center (geolocation or Bangalore).
  const coords = userLocation || [12.9716, 77.5946];
  const geoLabel = `${coords[0].toFixed(4)}°N ${coords[1].toFixed(4)}°E`;

  return (
    <div className="page-shell">
      {/* ── Dusk hero: the live map staged on a quiet instrument panel ────── */}
      <section className="relative overflow-hidden bg-ink">
        {/* Background stack — all pointer-events-none, content sits above */}
        <div className="hero-band absolute inset-0 pointer-events-none" />
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="hero-halo absolute inset-0 pointer-events-none motion-safe:animate-glow-drift" />
        <div className="hero-accent absolute inset-0 pointer-events-none" />
        <div className="hero-horizon absolute inset-x-0 bottom-0 h-px pointer-events-none" />

        <div className="page-container relative py-14 sm:py-20 lg:py-24">
          <header className="max-w-2xl motion-safe:animate-fade-up">
            <p className="eyebrow-on-ink mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-marigold opacity-75 motion-safe:animate-pulse" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-marigold" />
              </span>
              LIVE · {geoLabel}
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.75rem] text-white tracking-tight mb-5 text-balance leading-[1.05]">
              {heroHeading}
            </h1>
            <p className="text-lg sm:text-xl text-white/70 text-pretty max-w-xl leading-relaxed">
              {heroSubheading}
            </p>
          </header>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Search canvas — solid white, crisp and readable against the dusk band */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl ring-1 ring-white/60 shadow-elevated p-5 sm:p-6 flex flex-col gap-4 h-full motion-safe:animate-fade-up motion-safe:[animation-delay:80ms]">
                <div className="flex items-center justify-between">
                  <p className="eyebrow">FIND A HOME</p>
                  <span className="text-xs font-mono text-neutral-500">{total} results</span>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyFilters();
                  }}
                  className="flex flex-col gap-4"
                >
                  <Input
                    label="City, neighborhood, or landmark"
                    placeholder="e.g. Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Occupancy"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      options={[
                        { value: '', label: 'Any' },
                        { value: 'BOYS_ONLY', label: 'Boys Only' },
                        { value: 'GIRLS_ONLY', label: 'Girls Only' },
                        { value: 'BOTH', label: 'Co-living' },
                      ]}
                    />
                    <Input
                      label="Max rent"
                      type="number"
                      placeholder="₹ / month"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Min rating"
                      type="number"
                      placeholder="0 – 5"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      step="0.1"
                    />
                    {userLocation ? (
                      <Input
                        label="Max distance"
                        type="number"
                        placeholder="km"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(e.target.value)}
                      />
                    ) : (
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Available only
                        </label>
                      </div>
                    )}
                  </div>
                  {userLocation && (
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(e) => setAvailableOnly(e.target.checked)}
                        className="w-5 h-5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Available only
                    </label>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <Button type="submit" fullWidth>
                      Search PGs
                    </Button>
                    <Button type="button" variant="outline" onClick={resetFilters}>
                      Reset
                    </Button>
                  </div>
                  {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-stone-line">
                      {activeFilters.map((f) => (
                        <span
                          key={f}
                          className="inline-flex rounded-full border border-stone-line bg-stone-soft px-2.5 py-1 text-xs font-medium text-neutral-600"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </form>

                <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-stone-line bg-stone-soft p-3.5">
                    <p className="eyebrow !text-[10px]">Live results</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-ink">{total}</p>
                  </div>
                  <div className="rounded-xl border border-stone-line bg-stone-soft p-3.5">
                    <p className="eyebrow !text-[10px]">Available now</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-success">
                      {availableCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live map — the signature: every PG pinned on its coordinates */}
            <div className="lg:col-span-7 relative h-[420px] lg:h-[520px] rounded-2xl ring-1 ring-white/15 border border-white/15 overflow-hidden shadow-elevated bg-white/5 motion-safe:animate-fade-in motion-safe:[animation-delay:140ms]">
              <PGMap
                pgs={filteredPGs}
                center={mapCenter}
                zoom={userLocation ? 13 : 12}
                highlightedPG={highlightedPG}
                onMarkerClick={handleMarkerClick}
                className="h-full w-full"
              />
              <span className="absolute left-3 bottom-3 z-[20] inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 font-mono text-[11px] font-medium text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
                {filteredPGs.length} PG{filteredPGs.length === 1 ? '' : 's'} on map
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured properties ───────────────────────────────────────── */}
      <section className="bg-stone-soft border-t border-stone-line py-12 sm:py-16">
        <div className="page-container">
          <Reveal className="flex flex-wrap items-end justify-between gap-3 mb-8">
            <div>
              <p className="eyebrow mb-2">FEATURED · VERIFIED PGS</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                {featuredTitle}
              </h2>
              <p className="text-neutral-500 mt-2">
                {activeFilters.length > 0
                  ? 'Filtered properties based on your search criteria.'
                  : 'Highly rated accommodations in prime locations.'}
              </p>
            </div>
            {!loading && (
              <span className="font-mono text-sm font-medium text-neutral-500">
                {total} {total === 1 ? 'PG' : 'PGs'} found
              </span>
            )}
          </Reveal>

          {/* First-load skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PGCardSkeletonList count={6} />
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredPGs.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-card-soft border border-stone-line">
              <div className="mb-4 flex justify-center text-indigo-brand/25" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.5 2.5V4L9 1.5 15 4l5.5-2.5V20L15 22.5 9 20z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 1.5V20M15 4v18.5" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-1">
                No PGs match your filters
              </h3>
              <p className="text-neutral-500 mb-5">
                Try widening your search or clearing a filter or two.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          )}

          {/* Results grid */}
          {!loading && filteredPGs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPGs.map((pg, i) => (
                <Reveal key={pg._id} delay={(i % 3) * 70}>
                  <div id={`pg-${pg._id}`}>
                    <PGCard
                      pg={pg}
                      onHover={setHighlightedPG}
                      isHighlighted={highlightedPG === pg._id}
                    />
                  </div>
                </Reveal>
              ))}
              {/* Next-page skeletons while fetching more */}
              {loadingMore && <PGCardSkeletonList count={3} />}
            </div>
          )}

          {/* Infinite-scroll sentinel */}
          {!loading && hasMore && <div ref={sentinelRef} className="h-1" />}

          {/* End of results */}
          {!loading && !hasMore && filteredPGs.length > 0 && (
            <p className="text-center text-sm text-neutral-400 py-8">
              You've reached the end · {total} {total === 1 ? 'PG' : 'PGs'} total
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
