import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchPGs } from '../services/pgService.js';
import PGCard from '../components/PGCard.jsx';
import PGMap from '../components/PGMap.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Button from '../components/Button.jsx';
import { PGCardSkeletonList } from '../components/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';

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

  return (
    <div className="page-shell">
      {/* ── Hero + Map split ───────────────────────────────────────────── */}
      <section className="page-container py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: search canvas */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 mb-4">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                </svg>
                Verified &amp; secure PGs near you
              </span>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-neutral-900 tracking-tight mb-4 text-balance leading-[1.05]">
                Find Your Safe Haven.
              </h1>
              <p className="text-lg text-neutral-500 text-pretty max-w-md">
                Discover verified, secure, and comfortable PGs tailored to your
                needs. Zero friction, total peace of mind.
              </p>
            </div>

            {/* Search form — all existing filters preserved */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters();
              }}
              className="surface-card p-5 sm:p-6 flex flex-col gap-4 bg-white"
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
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a1 1 0 01-1.42 1.42l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                  Search PGs
                </Button>
                <Button type="button" variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-neutral-200">
                  {activeFilters.map((f) => (
                    <span
                      key={f}
                      className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </form>

            <div className="grid grid-cols-2 gap-3">
              <div className="surface-card p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Live results
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-neutral-900">{total}</p>
              </div>
              <div className="surface-card p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Available now
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-success-600">
                  {availableCount}
                </p>
              </div>
            </div>
          </div>

          {/* Right: interactive map */}
          <div className="lg:col-span-7 h-[400px] lg:h-[600px] relative rounded-2xl overflow-hidden shadow-card border border-neutral-200">
            <PGMap
              pgs={filteredPGs}
              center={mapCenter}
              zoom={userLocation ? 13 : 12}
              highlightedPG={highlightedPG}
              onMarkerClick={handleMarkerClick}
              className="h-full"
            />
          </div>
        </div>
      </section>

      {/* ── Featured properties ───────────────────────────────────────── */}
      <section className="bg-neutral-50 border-t border-neutral-200 py-12 sm:py-16">
        <div className="page-container">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                Featured Properties
              </h2>
              <p className="text-neutral-500 mt-2">
                {activeFilters.length > 0
                  ? 'Filtered properties based on your search criteria.'
                  : 'Highly rated accommodations in prime locations.'}
              </p>
            </div>
            {!loading && (
              <span className="text-sm font-medium text-neutral-500">
                {total} {total === 1 ? 'PG' : 'PGs'} found
              </span>
            )}
          </div>

          {/* First-load skeletons */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PGCardSkeletonList count={6} />
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredPGs.length === 0 && (
            <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-neutral-200">
              <div className="text-5xl mb-4" aria-hidden="true">
                🗺️
              </div>
              <h3 className="font-display font-bold text-xl text-neutral-900 mb-1">
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
              {filteredPGs.map((pg) => (
                <div key={pg._id} id={`pg-${pg._id}`}>
                  <PGCard
                    pg={pg}
                    onHover={setHighlightedPG}
                    isHighlighted={highlightedPG === pg._id}
                  />
                </div>
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
