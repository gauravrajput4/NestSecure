import { useId } from 'react';

// Multi-line text field that matches Input's look (labels, error/helper text,
// a11y wiring). `rows` defaults to 4; everything else forwards to <textarea>.
export default function Textarea({
  label,
  error,
  helperText,
  className = '',
  id,
  rows = 4,
  ...props
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error
    ? `${inputId}-error`
    : helperText
      ? `${inputId}-help`
      : undefined;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-neutral-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full px-4 py-3 rounded-[var(--radius-control)] border bg-white text-neutral-900 placeholder:text-neutral-400 leading-relaxed
          focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm resize-y
          ${error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/40' : 'border-neutral-300 hover:border-neutral-400'}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-error-600 mt-1.5">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-help`} className="text-sm text-neutral-500 mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  );
}
