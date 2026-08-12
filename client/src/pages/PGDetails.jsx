import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPGById, fetchReviews, addReview } from '../services/pgService.js';
import { createBooking } from '../services/bookingService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import PGGallery from '../components/PGGallery.jsx';
import WishlistButton from '../components/WishlistButton.jsx';
import DirectionsMap from '../components/DirectionsMap.jsx';
import { PGDetailsSkeleton } from '../components/Skeleton.jsx';

const genderIcons = {
  BOYS_ONLY: '👦',
  GIRLS_ONLY: '👧',
  BOTH: '👫',
};

const sharingLabels = {
  SINGLE: 'Single sharing',
  DOUBLE: 'Double sharing',
  TRIPLE: 'Triple sharing',
};

export default function PGDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [pg, setPG] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Selected room for room-level PGs
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Directions modal state
  const [directionsOpen, setDirectionsOpen] = useState(false);

  useEffect(() => {
    loadPG();
    loadReviews();
  }, [id]);

  const loadPG = async () => {
    try {
      setLoading(true);
      const res = await fetchPGById(id);
      setPG(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetchReviews(id);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async () => {
    if (!user) {
      toast.info('Please log in to book');
      navigate('/login');
      return;
    }
    // Room-level PG: require a room selection.
    if (hasRooms && !selectedRoom) {
      toast.info('Please select a room first');
      return;
    }
    try {
      setBookingLoading(true);
      await createBooking({
        pgId: id,
        ...(selectedRoom ? { roomId: selectedRoom } : {}),
      });
      toast.success('Request sent! The owner will review your booking.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to review');
      return;
    }
    try {
      setReviewLoading(true);
      await addReview({ pgId: id, rating, comment });
      toast.success('Review submitted');
      setComment('');
      setRating(5);
      loadReviews();
      loadPG(); // refresh rating
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewLoading(false);
    }
  };

  // Open the in-app Leaflet directions modal (route drawn on our own map,
  // ride-app style) instead of leaving the site for Google Maps.
  const getDirections = () => {
    if (!pg) return;
    setDirectionsOpen(true);
  };

  if (loading) return <PGDetailsSkeleton />;
  if (!pg)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ink px-6 text-center">
        <div className="text-5xl" aria-hidden="true">
          🔍
        </div>
        <p className="font-display font-bold text-xl">PG not found</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to explore
        </Button>
      </div>
    );

  const hasRooms = pg.rooms && pg.rooms.length > 0;
  const selectedRoomData = hasRooms
    ? pg.rooms.find((room) => room._id === selectedRoom) || null
    : null;
  const displayRent = selectedRoomData ? selectedRoomData.rent : pg.price;
  const displayDeposit = selectedRoomData
    ? selectedRoomData.deposit
    : pg.securityDeposit;
  const totalPayable = displayRent + (displayDeposit || 0);
  const canBook =
    user &&
    user.role === 'USER' &&
    pg.availableRooms > 0 &&
    (!hasRooms || selectedRoom);

  const bookLabel = !user
    ? 'Log in to book'
    : pg.availableRooms === 0
      ? 'No rooms available'
      : hasRooms && !selectedRoom
        ? 'Select a room to book'
        : 'Request to Book';

  return (
    <div className="page-shell pb-28 lg:pb-12 bg-neutral-50">
      <div className="page-container max-w-6xl pt-6 sm:pt-8">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-600 transition hover:border-indigo-200 hover:text-indigo-700 shadow-sm"
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <span className="hidden sm:inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500 shadow-sm">
            PG details
          </span>
        </div>

        {/* Product-style gallery (signature magnifier) */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-3 sm:p-6 mb-6 sm:mb-8 relative">
          {pg.availableRooms === 0 && (
            <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-10 bg-error-600 text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm">
              Fully booked
            </div>
          )}
          <div className="absolute top-5 left-5 sm:top-6 sm:left-6 z-10">
            <WishlistButton pgId={pg._id} size="lg" />
          </div>
          <PGGallery images={pg.images || []} name={pg.name} />
        </div>

        {/* Two-column: content + sticky booking panel */}
        <div className="grid lg:grid-cols-[1fr_22rem] gap-6 lg:gap-8 items-start">
          {/* ---- Left: details ---- */}
          <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* Header + description */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-8">
              <div className="mb-5">
                <h1 className="font-display font-bold text-3xl sm:text-4xl text-neutral-900 mb-2 text-balance">
                  {pg.name}
                </h1>
                <p className="text-base sm:text-lg text-neutral-500 flex items-start gap-1.5">
                  <span aria-hidden="true">📍</span>
                  <span>
                    {pg.address}, {pg.city}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-marigold text-xl" aria-hidden="true">
                      ⭐
                    </span>
                    <span className="font-bold text-neutral-900">
                      {pg.rating.toFixed(1)}
                    </span>
                    <span className="text-neutral-400 text-sm">
                      ({pg.reviewCount} reviews)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                    <span className="text-base" aria-hidden="true">
                      {genderIcons[pg.genderType]}
                    </span>
                    {pg.genderType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {pg.description && (
                <p className="text-neutral-700 leading-relaxed mb-6 text-pretty">
                  {pg.description}
                </p>
              )}

              {/* Facilities */}
              {pg.facilities?.length > 0 && (
                <div>
                  <h2 className="font-display font-bold text-lg text-neutral-900 mb-3">
                    Amenities
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {pg.facilities.map((f, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700 border border-neutral-200"
                      >
                        <svg
                          className="h-4 w-4 shrink-0 text-indigo-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate">{f}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Room picker (room-level PGs) */}
            {hasRooms && (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-8">
                <h2 className="font-display font-bold text-lg text-neutral-900 mb-1">
                  Choose a room
                </h2>
                <p className="text-sm text-neutral-500 mb-4">
                  Each room has its own sharing type and rent.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {pg.rooms.map((room) => {
                    const soldOut = room.availableBeds <= 0;
                    const selected = selectedRoom === room._id;
                    return (
                      <button
                        key={room._id}
                        type="button"
                        disabled={soldOut}
                        aria-pressed={selected}
                        onClick={() => setSelectedRoom(room._id)}
                        className={`text-left rounded-xl border-2 p-4 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                            : soldOut
                              ? 'border-neutral-200 bg-neutral-50 opacity-60 cursor-not-allowed'
                              : 'border-neutral-200 hover:border-indigo-300'
                        }`}
                      >
                        {room.images?.[0] && (
                          <img
                            src={room.images[0]}
                            alt={room.label}
                            loading="lazy"
                            className="w-full h-28 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-ink">{room.label}</p>
                            <p className="text-xs text-ink/60">
                              {sharingLabels[room.sharingType] ||
                                room.sharingType}
                            </p>
                          </div>
                          {selected && (
                            <span
                              className="text-indigo-brand text-lg"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-end justify-between mt-3">
                          <div>
                            <p className="font-display font-extrabold text-ink text-lg">
                              ₹{room.rent.toLocaleString('en-IN')}
                              <span className="text-xs text-ink/50 font-semibold">
                                /mo
                              </span>
                            </p>
                            {room.deposit > 0 && (
                              <p className="text-[11px] text-ink/50">
                                + ₹{room.deposit.toLocaleString('en-IN')} deposit
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs font-semibold inline-flex items-center gap-1 ${
                              soldOut ? 'text-danger' : 'text-success'
                            }`}
                          >
                            <span aria-hidden="true">●</span>
                            {soldOut
                              ? 'Full'
                              : `${room.availableBeds}/${room.totalBeds} beds`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews section */}
            <div className="surface-card p-5 sm:p-8">
              <h2 className="font-display font-bold text-2xl text-ink mb-6">
                Reviews ({reviews.length})
              </h2>

              <div className="mb-6 grid gap-3 rounded-xl border border-outline-soft/70 bg-paper p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
                    Average rating
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink">
                    {pg.rating.toFixed(1)} <span className="text-marigold">★</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
                    Total reviews
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink">
                    {pg.reviewCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
                    Current availability
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-success">
                    {pg.availableRooms}
                  </p>
                </div>
              </div>

              {/* Add review */}
              {user && user.role === 'USER' && (
                <form
                  onSubmit={handleReview}
                  className="mb-8 p-4 bg-paper rounded-xl"
                >
                  <h3 className="font-semibold text-ink mb-3">Leave a review</h3>
                  <div
                    className="flex gap-1 mb-3"
                    role="radiogroup"
                    aria-label="Rating"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        role="radio"
                        aria-checked={n === rating}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        className={`text-2xl leading-none p-1 rounded transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-brand ${
                          n <= rating ? 'text-marigold' : 'text-ink/20'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <Input
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mb-3"
                  />
                  <Button type="submit" size="sm" loading={reviewLoading}>
                    Submit Review
                  </Button>
                </form>
              )}

              {/* Review list */}
              <div className="space-y-4">
                {reviews.length === 0 && (
                  <p className="text-center text-ink/50 py-8">
                    No reviews yet — be the first to share your experience.
                  </p>
                )}
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="border-b border-ink/10 pb-4 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-semibold text-ink">
                        {r.user?.name || 'Anonymous'}
                      </p>
                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        aria-label={`${r.rating} out of 5 stars`}
                      >
                        {Array.from({ length: r.rating }, (_, i) => (
                          <span
                            key={i}
                            className="text-marigold"
                            aria-hidden="true"
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-ink/70 text-sm">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Right: sticky booking panel (desktop) ---- */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <div className="surface-card shadow-lift p-6">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-3xl font-extrabold text-ink">
                  ₹{displayRent.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-ink/60">/month</span>
              </div>
              {displayDeposit > 0 && (
                <p className="text-xs text-ink/50 mb-4">
                  + ₹{displayDeposit.toLocaleString('en-IN')} security
                  deposit
                </p>
              )}

              <div className="rounded-xl bg-paper p-4 mb-4">
                <p className="text-sm text-ink/60 mb-0.5">Availability</p>
                <p className="font-bold text-ink">
                  {hasRooms
                    ? `${pg.availableRooms} / ${pg.totalRooms} beds available`
                    : `${pg.availableRooms} / ${pg.totalRooms} rooms available`}
                </p>
                {hasRooms && !selectedRoom && pg.availableRooms > 0 && (
                  <p className="text-xs text-indigo-brand font-semibold mt-1">
                    Select a room below to continue
                  </p>
                )}
              </div>

              <div className="mb-4 rounded-xl border border-outline-soft/70 bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink/60">Monthly rent</span>
                  <span className="font-semibold text-ink">
                    ₹{displayRent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink/60">Security deposit</span>
                  <span className="font-semibold text-ink">
                    ₹{(displayDeposit || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-outline-soft pt-2.5">
                  <span className="text-sm font-semibold text-ink">Due now</span>
                  <span className="font-display text-xl font-extrabold text-ink">
                    ₹{totalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBook}
                disabled={!canBook}
                loading={bookingLoading}
                fullWidth
                className="mb-3"
              >
                {bookLabel}
              </Button>
              <Button variant="outline" fullWidth onClick={getDirections}>
                📍 Get Directions
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* ---- Mobile sticky booking bar ---- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink/10 shadow-bar-top px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 mb-3">
          <div className="shrink-0">
            <p className="font-display text-xl font-extrabold text-ink leading-none">
              ₹{displayRent.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-ink/50">
              {pg.availableRooms > 0
                ? `${pg.availableRooms} available`
                : 'Fully booked'}
            </p>
          </div>
          <Button
            onClick={handleBook}
            disabled={!canBook}
            loading={bookingLoading}
            className="flex-1"
          >
            {bookLabel}
          </Button>
        </div>
        <Button variant="outline" fullWidth onClick={getDirections} size="sm">
          📍 Get Directions
        </Button>
      </div>

      {/* Directions modal */}
      {directionsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 backdrop-blur-sm">
          <div className="relative w-full h-full sm:max-w-3xl sm:max-h-[85vh] sm:rounded-xl2 bg-white shadow-lift overflow-hidden flex flex-col">
            <DirectionsMap pg={pg} onClose={() => setDirectionsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
