import LogoMark from './Logo.jsx';

export default function Loader({ className = '', label = 'Loading…' }) {
  return (
    <div className={`flex flex-col justify-center items-center gap-3 ${className}`} role="status">
      <span className="relative inline-flex">
        <LogoMark className="h-10 w-10 rounded-lg shadow-card" />
        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-marigold motion-safe:animate-pulse" />
      </span>
      <p className="text-sm text-ink/60">{label}</p>
    </div>
  );
}