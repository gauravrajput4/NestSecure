import { useState, useRef, useCallback } from 'react';

// Signature element: an e-commerce style product gallery.
// Thumbnail rail (left) drives a main stage (right). Hovering the stage on
// pointer devices opens a magnifier lens that tracks the cursor — the same
// interaction Flipkart/Amazon use to inspect product detail.
export default function PGGallery({ images = [], name = 'PG' }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const stageRef = useRef(null);

  const src = images[active];

  const onMove = useCallback((e) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLens({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }, []);

  // Empty state — no photos uploaded yet
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl2 bg-ink/5 text-7xl text-ink/15">
        🏠
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnail rail */}
      <div className="flex gap-3 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`View photo ${i + 1} of ${name}`}
            aria-current={i === active}
            className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 ${
              i === active
                ? 'border-indigo-brand shadow-sm'
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main stage + magnifier */}
      <div className="relative flex-1">
        <div
          ref={stageRef}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
          className="group relative aspect-[4/3] cursor-crosshair overflow-hidden rounded-xl2 bg-ink/5"
        >
          <img
            src={src}
            alt={`${name} — photo ${active + 1}`}
            className="h-full w-full object-cover"
          />

          {/* Lens indicator on the stage */}
          {zoom && (
            <div
              className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-white/80 bg-white/10 shadow-lift"
              style={{ left: `${lens.x}%`, top: `${lens.y}%` }}
            />
          )}

          {/* Position counter */}
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur">
            {active + 1} / {images.length}
          </span>
        </div>

        {/* Zoom panel — magnified detail overlays the stage on pointer devices.
            Kept within the stage bounds (inset-0) so it can never push past the
            viewport and cause horizontal scroll. Hidden on touch / small screens. */}
        {zoom && (
          <div className="pointer-events-none absolute inset-0 z-20 hidden overflow-hidden rounded-xl2 border border-ink/10 bg-white shadow-lift lg:block">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${src})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: '220%',
                backgroundPosition: `${lens.x}% ${lens.y}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
