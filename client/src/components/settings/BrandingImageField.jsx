import { useRef, useState } from 'react';

// Upload / preview / remove control for a single branding image slot.
// - `value`   current image URL ('' when none)
// - `onUpload(file)` async; should resolve once the server has the new image
// - `onRemove()`     async; clears the slot
// Accepts JPG/PNG/WebP/AVIF/SVG up to 5 MB (server enforces the real limit).
export default function BrandingImageField({
  label,
  hint,
  value = '',
  onUpload,
  onRemove,
  aspect = 'landscape', // 'landscape' | 'square'
  className = '',
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onUpload?.(file);
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError('');
    setBusy(true);
    try {
      await onRemove?.();
    } catch (err) {
      setError(err?.message || 'Could not remove image');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      {label && (
        <p className="mb-1.5 block text-sm font-medium text-neutral-800">{label}</p>
      )}
      <div className="flex items-center gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 ${
            aspect === 'square' ? 'h-16 w-16' : 'h-16 w-28'
          }`}
        >
          {value ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={value}
              alt={`${label || 'Brand'} preview`}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-2 text-center text-[11px] text-neutral-400">
              No image
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={busy}
            className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-60"
          >
            {busy ? 'Working…' : value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
            >
              Remove
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
}
