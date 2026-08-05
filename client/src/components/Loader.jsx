export default function Loader({ className = '' }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-ink/10 border-t-indigo-brand"></div>
    </div>
  );
}
