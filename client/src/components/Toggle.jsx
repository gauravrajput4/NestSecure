import { useId } from 'react';

// Accessible on/off switch (role="switch"). Controlled via `checked` + `onChange`
// where onChange receives the next boolean. Colors follow the active theme via
// the brand token, so it re-tints with the selected palette.
export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  description,
  id,
  className = '',
}) {
  const autoId = useId();
  const switchId = id || autoId;
  const descId = description ? `${switchId}-desc` : undefined;

  const control = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      aria-describedby={descId}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-indigo-brand' : 'bg-neutral-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  if (!label && !description) {
    return <span className={className}>{control}</span>;
  }

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {label && (
          <label
            htmlFor={switchId}
            className="block text-sm font-medium text-neutral-800"
          >
            {label}
          </label>
        )}
        {description && (
          <p id={descId} className="mt-0.5 text-sm text-neutral-500">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
