export default function Loader({ className = '' }) {
  return (
    <div className={`flex flex-col justify-center items-center gap-3 ${className}`}>
      <div className="animate-spin rounded-full h-11 w-11 border-[3px] border-indigo-brand/20 border-t-indigo-brand" />
      <p className="text-sm text-ink/60">Loading…</p>
    </div>
  );
}
