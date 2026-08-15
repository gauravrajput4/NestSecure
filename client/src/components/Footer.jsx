import { Link } from 'react-router-dom';
import LogoMark from './Logo.jsx';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

// Social platforms → label + href builder. Rendered only for links that are set,
// so the default footer (no socials configured) is visually unchanged (§65).
const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'X' },
];

// Dark NestSecure footer — brand block on the left, quick links on the right.
// Content is driven by Site Settings; defaults reproduce the current footer.
export default function Footer() {
  const { settings } = useSiteSettings();
  const {
    general = {},
    branding = {},
    footer = {},
    contact = {},
    social = {},
  } = settings || {};

  const year = new Date().getFullYear();
  const brandName = branding.brandName || general.shortName || 'NestSecure';
  const customLogo = branding.logo || '';
  const description =
    footer.description ||
    'Verified, secure, and comfortable PG accommodations — booked with total peace of mind.';
  const copyright = footer.copyright || 'NestSecure Housing Solutions. All rights reserved.';
  const showLogo = footer.showLogo !== false;
  const showProductLinks = footer.showProductLinks !== false;
  const showTrust = footer.showTrust !== false;

  const email = footer.email || contact.supportEmail || '';
  const phone = footer.phone || contact.supportPhone || '';
  const address = footer.address || contact.address || '';
  const hasContact = Boolean(email || phone || address);

  const socialLinks = SOCIALS.map((s) => ({ ...s, href: social[s.key] })).filter(
    (s) => s.href
  );

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
          {showLogo && (
            <div className="flex items-center gap-2">
              {customLogo ? (
                <img
                  src={customLogo}
                  alt={brandName}
                  className="h-9 w-auto max-w-[9rem] object-contain"
                />
              ) : (
                <LogoMark className="h-9 w-9" />
              )}
              <span className="font-display font-bold text-xl text-white tracking-tight">
                {brandName}
              </span>
            </div>
          )}
          <p className="text-sm text-neutral-400 max-w-sm">{description}</p>

          {hasContact && (
            <div className="mt-1 flex flex-col gap-1 text-sm text-neutral-400">
              {email && (
                <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                  {email}
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-white transition-colors">
                  {phone}
                </a>
              )}
              {address && <span className="text-neutral-500">{address}</span>}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-500 mt-2">
            © {year} {copyright}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:col-span-2">
          {showProductLinks && (
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
          )}
          {showTrust && (
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
          )}
        </div>
      </div>
    </footer>
  );
}
