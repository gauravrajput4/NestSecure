import { themePreviewVars } from '../../utils/applyTheme.js';

// Live, self-contained preview of a theme. Everything is driven by scoped
// `--pv-*` CSS variables (see themePreviewVars) applied to the wrapper, so it
// can render an arbitrary/unsaved palette without affecting the real app.
// Shows the surfaces called out in the brief: navbar, buttons, input, card,
// badge, alert, and a compact PG card.
export default function ThemePreview({ theme, className = '' }) {
  const vars = themePreviewVars(theme);

  return (
    <div
      style={vars}
      className={`overflow-hidden rounded-xl border ${className}`}
      // border + page bg come from the theme itself
    >
      <div style={{ background: 'var(--pv-bg)', borderColor: 'var(--pv-border)' }}>
        {/* Navbar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--pv-surface)', borderBottom: '1px solid var(--pv-border)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white"
              style={{ background: 'var(--pv-primary)' }}
            >
              N
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--pv-text)' }}>
              NestSecure
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--pv-muted)' }}>
            <span>Explore</span>
            <span className="hidden sm:inline">Help</span>
            <span
              className="rounded-md px-2.5 py-1 font-semibold text-white"
              style={{ background: 'var(--pv-primary)' }}
            >
              Sign in
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'var(--pv-primary)' }}
            >
              Primary
            </span>
            <span
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: 'var(--pv-primary)', color: 'var(--pv-primary)' }}
            >
              Outline
            </span>
            <span
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ background: 'var(--pv-accent)' }}
            >
              Accent
            </span>
          </div>

          {/* Input */}
          <div
            className="flex items-center rounded-lg border px-3 py-2 text-xs"
            style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-muted)' }}
          >
            Search by city or area…
          </div>

          {/* PG card + side rail */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="col-span-2 overflow-hidden rounded-lg border"
              style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}
            >
              <div className="h-14 w-full" style={{ background: 'var(--pv-primary)', opacity: 0.14 }} />
              <div className="space-y-1.5 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--pv-text)' }}>
                    Sunrise Residency
                  </span>
                  {/* Star rating stays gold app-wide; shown here for context */}
                  <span className="text-[11px] font-semibold" style={{ color: '#F59E0B' }}>
                    ★ 4.8
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--pv-muted)' }}>
                  Koramangala · 1.2 km away
                </p>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-bold" style={{ color: 'var(--pv-primary)' }}>
                    ₹9,500<span className="font-normal" style={{ color: 'var(--pv-muted)' }}>/mo</span>
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'var(--pv-success)', color: '#fff' }}
                  >
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {/* Badges */}
              <span
                className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'color-mix(in srgb, var(--pv-primary) 12%, transparent)', color: 'var(--pv-primary)' }}
              >
                New
              </span>
              {/* Alert */}
              <div
                className="rounded-lg border p-2 text-[10px] leading-snug"
                style={{ background: 'color-mix(in srgb, var(--pv-info) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--pv-info) 30%, transparent)', color: 'var(--pv-text)' }}
              >
                Booking confirmed for 1 Sep.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
