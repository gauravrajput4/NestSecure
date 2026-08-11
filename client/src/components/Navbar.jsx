import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCanGoBack,
  selectCanGoForward,
  selectStack,
  selectIndex,
  goBack,
  goForward,
} from '../store/navigationSlice.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import Button from './Button.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);

  const canGoBack = useSelector(selectCanGoBack);
  const canGoForward = useSelector(selectCanGoForward);
  const stack = useSelector(selectStack);
  const index = useSelector(selectIndex);

  const handleBack = () => {
    if (!canGoBack) return;
    dispatch(goBack());
    navigate(stack[index - 1]);
  };

  const handleForward = () => {
    if (!canGoForward) return;
    dispatch(goForward());
    navigate(stack[index + 1]);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Role-aware link set, defined once and rendered in both desktop + drawer.
  const links = [{ to: '/', label: 'Explore' }];
  if (user?.role === 'OWNER') {
    links.push(
      { to: '/owner/dashboard', label: 'Dashboard' },
      { to: '/owner/pgs', label: 'My PGs' },
      { to: '/owner/requests', label: 'Requests' },
      { to: '/owner/financials', label: 'Financials' }
    );
  }
  if (user?.role === 'USER') {
    links.push(
      { to: '/bookings', label: 'My Bookings' },
      { to: '/wishlist', label: 'Wishlist', badge: wishlist?.count, heart: true }
    );
  }
  if (user?.role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Admin' });
  }
  if (user) {
    links.push({ to: '/profile', label: 'Profile' });
    links.push({ to: '/settings', label: 'Settings' });
  }

  const roleLabel =
    user?.role === 'OWNER' ? 'Owner' : user?.role === 'ADMIN' ? 'Admin' : 'User';
  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('')
    : '';

  const linkClass = (path) =>
    `text-sm font-semibold transition pb-0.5 border-b-2 ${
      isActive(path)
        ? 'text-indigo-deep border-indigo-deep'
        : 'text-ink/60 border-transparent hover:text-indigo-deep'
    }`;

  const Badge = ({ count }) =>
    count > 0 ? (
      <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-indigo-brand text-white text-xs font-bold font-mono">
        {count}
      </span>
    ) : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-outline-soft/60 bg-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-brand text-white shadow-subtle transition group-hover:bg-indigo-deep">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.8 1.8 3.2-3.6" />
              </svg>
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight text-indigo-deep">
              NestSecure<span className="text-ink"> PG</span>
            </span>
          </Link>

          {/* Back/forward buttons */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={!canGoBack}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-ink hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Go back"
              title="Go back"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={!canGoForward}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-ink hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Go forward"
              title="Go forward"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    aria-current={isActive(l.to) ? 'page' : undefined}
                    className={`${linkClass(l.to)} ${
                      l.heart ? 'flex items-center gap-1.5' : ''
                    }`}
                  >
                    {l.heart && <span className="text-danger">♥</span>}
                    {l.label}
                    {l.badge != null && <Badge count={l.badge} />}
                  </Link>
                ))}
                <div className="ml-1 flex items-center gap-2 rounded-full border border-outline-soft bg-paper px-2.5 py-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-brand text-xs font-bold text-white">
                    {initials || 'U'}
                  </span>
                  <span className="hidden lg:block text-xs font-semibold text-ink/70">
                    {roleLabel}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden flex h-11 w-11 -mr-2 items-center justify-center rounded-lg text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-brand"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40" id="mobile-menu">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white border-b border-ink/10 shadow-card max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 flex flex-col gap-1">
              {user ? (
                <>
                  <div className="mb-2 rounded-xl border border-outline-soft/70 bg-paper px-3 py-2.5">
                    <p className="text-sm font-semibold text-ink">{user.name}</p>
                    <p className="text-xs text-ink/60">{roleLabel} account</p>
                  </div>
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      aria-current={isActive(l.to) ? 'page' : undefined}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl text-base font-semibold min-h-control ${
                        isActive(l.to)
                          ? 'bg-indigo-brand/10 text-indigo-brand'
                          : 'text-ink/80 hover:bg-ink/5'
                      }`}
                    >
                      {l.heart && <span className="text-danger">♥</span>}
                      {l.label}
                      {l.badge != null && <Badge count={l.badge} />}
                    </Link>
                  ))}
                  <Button
                    variant="outline"
                    fullWidth
                    className="mt-2"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login">
                    <Button variant="outline" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button fullWidth>Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
