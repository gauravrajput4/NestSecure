import { useEffect, useId } from 'react';

// Lightweight centered modal. Closes on Escape and backdrop click; locks body
// scroll while open. Kept dependency-free so any page can drop it in. On small
// screens it docks to the bottom as a sheet for easier thumb reach.
// `size` widens the desktop dialog; it defaults to 'md' so existing callers are
// unaffected.
const SIZES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  '2xl': 'sm:max-w-3xl',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : 'Dialog'}
    >
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm motion-safe:animate-fade-in"
        onClick={onClose}
      />
      <div className={`relative w-full ${SIZES[size] || SIZES.md} max-h-[90vh] flex flex-col bg-white rounded-t-xl2 sm:rounded-xl2 shadow-lift overflow-hidden motion-safe:animate-modal-pop`}>
        {title && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3 border-b border-stone-line">
            <h2 id={titleId} className="font-display font-bold text-xl text-ink tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-brand"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="px-6 py-4 bg-paper border-t border-stone-line flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}