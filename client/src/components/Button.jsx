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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl leading-none transition-all duration-150 select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100';

  const variants = {
    primary:
      'bg-indigo-brand text-white hover:bg-indigo-deep focus-visible:outline-indigo-brand shadow-subtle hover:shadow-card',
    secondary:
      'bg-ink text-white hover:bg-ink-soft focus-visible:outline-ink shadow-subtle hover:shadow-card',
    outline:
      'border border-indigo-brand text-indigo-brand hover:bg-indigo-brand hover:text-white focus-visible:outline-indigo-brand',
    ghost: 'text-indigo-brand hover:bg-indigo-brand/5 focus-visible:outline-indigo-brand',
    danger:
      'bg-danger text-white hover:bg-red-700 focus-visible:outline-danger shadow-subtle hover:shadow-card',
  };

  // Sizes map to the shared control-height grid so buttons line up with inputs.
  const sizes = {
    sm: 'h-control-sm px-3.5 text-sm',
    md: 'h-control px-5 text-base',
    lg: 'h-control-lg px-7 text-lg',
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
