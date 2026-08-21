import { useNavigate } from 'react-router-dom';
import WishlistButton from './WishlistButton.jsx';

const genderConfig = {
  BOYS_ONLY: {
    label: 'Boys',
    // simple "male" glyph
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="10" cy="14" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l5-5m0 0h-4m4 0v4" />
      </svg>
    ),
  },
  GIRLS_ONLY: {
    label: 'Girls',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="12" cy="9" r="5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7m-3-3h6" />
      </svg>
    ),
  },
  BOTH: {
    label: 'Co-living',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <circle cx="16" cy="10" r="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-2.8 2.2-5 5-5s5 2.2 5 5M14.5 20c0-1.8 1-3.4 2.5-4" />
      </svg>
    ),
  },
};

export default function PGCard({ pg, onHover, isHighlighted }) {
  const navigate = useNavigate();
  const goToDetails = () => navigate(`/pg/${pg._id}`);
  const soldOut = pg.availableRooms === 0;
  const gender = genderConfig[pg.genderType] || genderConfig.BOTH;

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={`${pg.name}, ${pg.city}. ₹${pg.price.toLocaleString(
        'en-IN'
      )} per month`}
      className={`group flex flex-col bg-white rounded-xl2 overflow-hidden shadow-card-soft border transition-all duration-300 cursor-pointer border-stone-line hover:shadow-lift hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-brand ${
        isHighlighted
          ? 'border-indigo-400 ring-2 ring-indigo-400/30 md:scale-[1.01]'
          : ''
      }`}
      onClick={goToDetails}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetails();
        }
      }}
      onMouseEnter={() => onHover?.(pg._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image — fixed 4:3 ratio keeps the grid even regardless of source size */}
      <div className="relative aspect-[4/3] bg-surface-highest overflow-hidden">
        {pg.images?.[0] ? (
          <img
            src={pg.images[0]}
            alt={pg.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105 ${
              soldOut ? 'opacity-90' : ''
            }`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-indigo-brand/30">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-16 w-16" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-7 9 7M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
              <path strokeLinecap="round" d="M9 20v-5h6v5" />
            </svg>
          </div>
        )}

        {/* Availability status pill (top-left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {soldOut ? (
            <span className="inline-flex items-center gap-1 bg-danger-soft text-danger text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-subtle">
              <span aria-hidden="true">●</span> Full
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-success-soft text-success text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-subtle">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
              </svg>
              Available
            </span>
          )}
          {pg.isVerified && (
            <span className="bg-white/95 backdrop-blur text-indigo-deep text-[11px] font-bold px-2.5 py-1 rounded-full shadow-subtle flex items-center gap-1">
              <span aria-hidden="true">✓</span> Verified
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <WishlistButton pgId={pg._id} />
        </div>

        {pg.distance !== undefined && (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur text-ink font-mono text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-subtle">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-indigo-brand" aria-hidden="true">
              <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
            </svg>
            {pg.distance.toFixed(1)} km
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-4 border-t border-outline-soft/70">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display font-bold text-lg text-ink line-clamp-1">
            {pg.name}
          </h3>
          <span className="shrink-0 inline-flex items-center gap-1 bg-surface-mid px-2 py-0.5 rounded text-sm font-semibold text-indigo-deep">
            <span className="text-marigold" aria-hidden="true">
              ★
            </span>
            {pg.rating.toFixed(1)}
          </span>
        </div>

        <p className="text-sm text-ink/60 mb-3 line-clamp-1 flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-ink/40" aria-hidden="true">
            <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5c0 3.5 5 11 5 11s5-7.5 5-11a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{pg.city}</span>
        </p>

        {/* Attribute chips */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1 bg-surface-highest text-ink/70 px-2 py-1 rounded text-xs font-medium">
            {gender.icon}
            {gender.label}
          </span>
          <span className="inline-flex items-center gap-1 bg-surface-highest text-ink/70 px-2 py-1 rounded text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7a1 1 0 011-1h16a1 1 0 011 1v5M3 12v5m18-5v5M3 14h18" />
            </svg>
            {soldOut ? 'No beds' : `${pg.availableRooms} available`}
          </span>
        </div>

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-stone-line">
          <p className="leading-none">
            <span className="font-display text-xl font-extrabold text-ink">
              ₹{pg.price.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-ink/50 font-semibold">/mo</span>
          </p>
          <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-brand/70 px-4 py-1.5 text-sm font-semibold text-indigo-brand transition-colors group-hover:bg-indigo-brand group-hover:text-white">
            View Details
            <svg className="h-4 w-4 -translate-x-0.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.6L9.97 4.87a.75.75 0 011.06-1.06l5.5 5.5a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 11-1.06-1.06l4.38-4.38H3.75A.75.75 0 013 10z" clipRule="evenodd" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
