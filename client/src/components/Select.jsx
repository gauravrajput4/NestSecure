import { useId } from 'react';

export default function Select({
  label,
  error,
  options = [],
  className = '',
  id,
  ...props
}) {
  const autoId = useId();
  const selectId = id || autoId;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-neutral-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={`w-full h-11 pl-4 pr-10 rounded-[var(--radius-control)] border appearance-none
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm
            bg-white cursor-pointer text-neutral-900
            ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/40' : 'border-neutral-300 hover:border-neutral-400'}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron — native appearance removed for cross-browser consistency */}
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-sm text-error-600 mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}
