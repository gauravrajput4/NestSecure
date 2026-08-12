import { Link } from 'react-router-dom';

// Dark NestSecure footer — brand block on the left, quick links on the right.
// Purely presentational; rendered globally beneath every route.
export default function Footer() {
  const year = new Date().getFullYear();
  const links = [
    { label: 'Explore PGs', to: '/' },
    { label: 'My Bookings', to: '/bookings' },
    { label: 'Owner Dashboard', to: '/owner/dashboard' },
    { label: 'Help Center', to: '/help' },
  ];

  return (
    <footer className="mt-auto border-t border-neutral-800 bg-neutral-950 text-neutral-300">
      <div className="page-container py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="flex flex-col gap-3 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8 3.2-3.6" />
              </svg>
            </span>
            <span className="font-display font-bold text-xl text-white tracking-tight">
              NestSecure
            </span>
          </div>
          <p className="text-sm text-neutral-400 max-w-sm">
            Verified, secure, and comfortable PG accommodations — booked with
            total peace of mind.
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            © {year} NestSecure Housing Solutions. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:col-span-2">
          <nav className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500">
              Product
            </h3>
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500">
              Trust
            </h3>
            <p className="text-sm text-neutral-400">
              Verified tenant onboarding, role-based approvals, and secure payment flow.
            </p>
            <p className="text-xs text-neutral-500">
              Built for students, professionals, and PG owners.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
