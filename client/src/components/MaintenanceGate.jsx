import { Link, useLocation } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import LogoMark from './Logo.jsx';
import Loader from './Loader.jsx';

// Full-screen "we'll be right back" page shown to visitors while maintenance
// mode is on. Purely presentational — the server middleware is the real gate.
function MaintenanceScreen({ title, message, estimatedReturn, brandName }) {
  return (
    <div className="page-shell flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <LogoMark className="mb-6 h-14 w-14 rounded-xl shadow-card" />
      <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">
        {title || "We'll be right back"}
      </h1>
      <p className="mt-3 max-w-md text-balance text-ink/60">
        {message ||
          `${brandName} is undergoing scheduled maintenance. Please check back shortly.`}
      </p>
      {estimatedReturn && (
        <p className="mt-4 rounded-full bg-indigo-brand/10 px-4 py-1.5 text-sm font-semibold text-indigo-brand">
          Estimated back: {estimatedReturn}
        </p>
      )}
      <Link
        to="/login"
        className="mt-8 text-sm font-medium text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline"
      >
        Administrator sign in
      </Link>
    </div>
  );
}

// Gate that swaps the entire app for the maintenance screen when enabled.
// Bypasses: auth routes (so an admin can sign in) and authenticated admins (so
// they can turn maintenance back off). Invisible when disabled (§65).
export default function MaintenanceGate({ children }) {
  const { settings } = useSiteSettings();
  const { user, loading } = useAuth();
  const location = useLocation();
  const m = settings?.maintenance || {};

  if (!m.enabled) return children;

  // Always let auth routes through so an admin can reach the login form.
  const authRoute = /^\/(login|forgot-password|reset-password)/.test(location.pathname);
  if (authRoute) return children;

  // Wait for the session to resolve before deciding, so a signed-in admin never
  // flashes the maintenance screen.
  if (loading) return <Loader className="min-h-screen" />;
  if (user?.role === 'ADMIN') return children;

  const brandName = settings?.branding?.brandName || settings?.general?.shortName || 'NestSecure';
  return (
    <MaintenanceScreen
      title={m.title}
      message={m.message}
      estimatedReturn={m.estimatedReturn}
      brandName={brandName}
    />
  );
}
