// Shimmer-driven skeletons that mirror the real layouts, so the page doesn't
// reflow when content arrives. The `shimmer` keyframe lives in tailwind.config.
function Shimmer({ className = '' }) {
  return (
    <div
      className={`animate-shimmer bg-ink/5 ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(13,21,38,0.04) 0%, rgba(13,21,38,0.09) 50%, rgba(13,21,38,0.04) 100%)',
        backgroundSize: '800px 100%',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

// Mirrors PGCard: image band + title/price/meta rows.
export function PGCardSkeleton() {
  return (
    <div className="bg-white rounded-xl2 overflow-hidden shadow-card-soft border border-stone-line">
      <Shimmer className="h-48 w-full" />
      <div className="p-4 space-y-3">
        <Shimmer className="h-5 w-3/5 rounded" />
        <Shimmer className="h-4 w-2/5 rounded" />
        <div className="flex items-center justify-between pt-1">
          <Shimmer className="h-7 w-24 rounded" />
          <Shimmer className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-20 rounded" />
          <Shimmer className="h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

// A run of card skeletons for first-load / next-page states.
export function PGCardSkeletonList({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PGCardSkeleton key={i} />
      ))}
    </>
  );
}

// Mirrors the PGDetails gallery + info card.
export function PGDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-paper pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white rounded-xl2 shadow-card p-4 sm:p-6 mb-8">
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            <div className="flex gap-3 sm:flex-col">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
            <Shimmer className="aspect-[4/3] flex-1 rounded-xl2" />
          </div>
        </div>
        <div className="bg-white rounded-xl2 shadow-lift p-8 space-y-4">
          <Shimmer className="h-9 w-1/2 rounded" />
          <Shimmer className="h-5 w-2/3 rounded" />
          <div className="flex gap-2 pt-2">
            <Shimmer className="h-8 w-24 rounded-lg" />
            <Shimmer className="h-8 w-24 rounded-lg" />
            <Shimmer className="h-8 w-24 rounded-lg" />
          </div>
          <Shimmer className="h-24 w-full rounded-xl" />
          <div className="flex gap-3 pt-2">
            <Shimmer className="h-12 flex-1 rounded-xl" />
            <Shimmer className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shimmer;
