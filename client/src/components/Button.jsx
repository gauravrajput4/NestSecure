export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-control)] leading-none transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100';

  const variants = {
    primary:
      'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md focus-visible:ring-indigo-500 focus-visible:ring-offset-paper',
    soft: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:ring-indigo-300 focus-visible:ring-offset-paper',
    secondary:
      'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 shadow-sm focus-visible:ring-indigo-500 focus-visible:ring-offset-paper',
    outline:
      'border border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 focus-visible:ring-indigo-500 focus-visible:ring-offset-paper',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300 focus-visible:ring-offset-paper',
    danger:
      'bg-error-600 text-white hover:bg-error-700 shadow-sm focus-visible:ring-error-500 focus-visible:ring-offset-paper',
  };

  // Sizes map to the shared control-height grid so buttons line up with inputs.
  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}