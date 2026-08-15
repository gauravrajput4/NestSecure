import { useId } from 'react';

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(v) {
  return typeof v === 'string' && HEX_RE.test(v.trim());
}

// A color swatch (native <input type=color>) paired with an editable hex field.
// `onChange` receives the raw string on every keystroke so the parent can drive
// a live preview; validity is surfaced inline but not enforced here (the parent
// / server validate before save).
export default function ColorField({
  label,
  hint,
  value = '',
  onChange,
  id,
  className = '',
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const valid = isValidHex(value);
  // Native color input requires a full 6-digit hex; fall back to a neutral.
  const swatch = valid ? normalizeHex(value) : '#E5E7EB';

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-neutral-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <span className="relative inline-flex h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-neutral-300 shadow-sm">
          <input
            type="color"
            aria-label={`${label || 'Color'} swatch`}
            value={swatch}
            onChange={(e) => onChange?.(e.target.value.toUpperCase())}
            className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] cursor-pointer border-0 bg-transparent p-0"
          />
        </span>
        <input
          id={fieldId}
          type="text"
          spellCheck={false}
          autoCapitalize="characters"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="#4F46E5"
          aria-invalid={!valid && value ? true : undefined}
          className={`h-11 w-full rounded-lg border bg-white px-3 font-mono text-sm uppercase text-neutral-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 ${
            !valid && value
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/50'
              : 'border-neutral-300 hover:border-neutral-400'
          }`}
        />
      </div>
      {!valid && value ? (
        <p className="mt-1.5 text-xs text-error-600">
          Enter a valid hex color, e.g. #4F46E5
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>
      )}
    </div>
  );
}

function normalizeHex(v) {
  let h = v.trim();
  if (h.length === 4) {
    // #abc -> #aabbcc (native input needs the long form)
    h = '#' + h.slice(1).split('').map((c) => c + c).join('');
  }
  return h.toUpperCase();
}
