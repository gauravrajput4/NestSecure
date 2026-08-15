import { Link } from 'react-router-dom';
import LogoMark from './Logo.jsx';

const defaultHighlights = [
  'Secure authentication and protected routes',
  'Real-time booking and payment workflows',
  'Role-based access for users, owners, and admin',
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkTo,
  footerLinkLabel,
  sideTitle = 'NestSecure PG',
  sideSubtitle = 'Trusted PG booking for tenants and property owners.',
  highlights = defaultHighlights,
}) {
  return (
    <section className="page-container py-8 sm:py-12 lg:py-16">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-xl2 border border-outline-soft/60 bg-white shadow-card lg:grid-cols-2">
        <aside className="hidden lg:flex flex-col justify-between gap-8 bg-gradient-to-br from-indigo-brand via-indigo-deep to-ink-soft p-10 text-white">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-10 w-10 rounded-xl ring-1 ring-white/25" />
              <span className="font-display text-lg font-bold tracking-tight">
                NestSecure
              </span>
            </div>
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              Secure Platform
            </span>
            <h2 className="font-display text-3xl font-extrabold tracking-tight">
              {sideTitle}
            </h2>
            <p className="max-w-md text-white/80">{sideSubtitle}</p>
          </div>
          <ul className="space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-white/90">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="mb-6 space-y-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-ink/65 sm:text-base">{subtitle}</p>}
          </div>

          {children}

          {footerText && footerLinkTo && footerLinkLabel && (
            <p className="mt-6 text-center text-sm text-ink/65">
              {footerText}{' '}
              <Link to={footerLinkTo} className="font-semibold text-indigo-deep hover:underline">
                {footerLinkLabel}
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
