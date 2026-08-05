import { useId } from 'react';

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
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
          className="block text-sm font-semibold text-ink mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full h-control px-4 rounded-xl border-2 text-ink placeholder:text-ink/40
          focus:outline-none focus:ring-2 focus:ring-indigo-brand/50 focus:border-indigo-brand/60 transition-colors
          ${error ? 'border-danger' : 'border-ink/20 hover:border-ink/30'}`}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger mt-1.5">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-help`} className="text-sm text-ink/60 mt-1.5">
          {helperText}
        </p>
      )}
    </div>
  );
}
