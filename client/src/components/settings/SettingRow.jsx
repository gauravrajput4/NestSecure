// A labeled row for a single setting. On wide screens the label/description sit
// left and the control sits right; they stack on mobile. Use `stacked` to force
// the control below the label (for full-width inputs / textareas).
export default function SettingRow({
  label,
  htmlFor,
  description,
  hint,
  children,
  stacked = false,
  className = '',
}) {
  return (
    <div
      className={`${
        stacked
          ? 'space-y-1.5'
          : 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6'
      } ${className}`}
    >
      {label && (
        <div className={stacked ? '' : 'min-w-0 sm:pt-1.5 sm:max-w-xs'}>
          <label
            htmlFor={htmlFor}
            className="block text-sm font-medium text-neutral-800"
          >
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
          )}
        </div>
      )}
      <div className={stacked ? '' : 'w-full sm:max-w-sm'}>
        {children}
        {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
      </div>
    </div>
  );
}
