// Card wrapper for one group of related settings. Renders an anchored header
// (title + optional description) with an optional actions slot on the right
// (e.g. a per-section Reset button), then the fields.
export default function SettingsSection({
  title,
  description,
  actions,
  id,
  children,
  className = '',
}) {
  return (
    <section
      id={id}
      className={`surface-card scroll-mt-24 ${className}`}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-lg font-bold text-neutral-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-neutral-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
