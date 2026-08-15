// Single source of truth for the NestSecure brand mark — the same shield+home
// artwork used by the favicon (client/public/favicon.svg). Self-contained
// (indigo tile + white shield + home knockout) so it renders identically
// wherever it's placed. Pass `className` to size the tile (e.g. "h-9 w-9").
export function LogoMark({ className = 'h-9 w-9', title = 'NestSecure PG' }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="#4F46E5" />
      {/* Shield — security */}
      <path
        d="M16 11 H48 Q52 11 52 15 V33 C52 44.5 43.5 51.5 32 55.5 C20.5 51.5 12 44.5 12 33 V15 Q12 11 16 11 Z"
        fill="#FFFFFF"
      />
      {/* Home / roof knockout */}
      <path d="M32 18 L42 30 L42 43 L22 43 L22 30 Z" fill="#4F46E5" />
      {/* Door */}
      <rect x="29" y="35.5" width="6" height="7.5" rx="0.8" fill="#FFFFFF" />
    </svg>
  );
}

export default LogoMark;
