import { useState, useEffect, useRef } from 'react';
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
import { useSiteSettings } from '../context/SiteSettingsContext.jsx';
import Button from './Button.jsx';
import LogoMark from './Logo.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const wishlist = useWishlist();
  const { settings } = useSiteSettings();
  const { general = {}, branding = {}, navigation = {} } = settings || {};
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Branding + navigation prefs. Defaults reproduce the current header exactly.
  const brandName = branding.brandName || general.shortName || 'NestSecure';
  const customLogo = branding.logo || '';
  const sticky = navigation.sticky !== false;
  const showWishlist = navigation.showWishlist !== false;
  const showOwnerPortal = navigation.showOwnerPortal !== false;
  const showAuthButtons = navigation.showAuthButtons !== false;

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
    setUserMenuOpen(false);
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Close mobile drawer + user dropdown whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  // Close the user dropdown on outside click / Escape.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointer = (e) => {
      if (!userMenuRef.current?.contains(e.target)) setUserMenuOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setUserMenuOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  // Role-aware link set, defined once and rendered in both desktop + drawer.
  const links = [{ to: '/', label: 'Explore' }];
  if (user?.role === 'OWNER' && showOwnerPortal) {
    links.push(
      { to: '/owner/dashboard', label: 'Dashboard' },
      { to: '/owner/pgs', label: 'My PGs' },
      { to: '/owner/requests', label: 'Requests' },
      { to: '/owner/financials', label: 'Financials' }
    );
  }
  if (user?.role === 'USER') {
    links.push({ to: '/bookings', label: 'My Bookings' });
    links.push({ to: '/waitlist', label: 'Waitlist' });
    if (showWishlist) {
      links.push({ to: '/wishlist', label: 'Wishlist', badge: wishlist?.count, heart: true });
    }
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
    `rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
      isActive(path)
        ? 'bg-ink text-white'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }`;

  const Badge = ({ count }) =>
    count > 0 ? (
      <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
        {count}
      </span>
    ) : null;

  return (
    <nav className={`${sticky ? 'sticky top-0' : ''} z-50 bg-white/85 backdrop-blur-xl border-b border-neutral-200/80`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            {customLogo ? (
              <img
                src={customLogo}
                alt={brandName}
                className="h-9 w-auto max-w-[9rem] object-contain transition group-hover:scale-105"
              />
            ) : (
              <LogoMark className="h-9 w-9 rounded-lg shadow-sm transition group-hover:scale-105" />
            )}
            <span className="font-display font-bold text-xl tracking-tight text-ink">
              {brandName}
            </span>
          </Link>

          {/* Back/forward buttons */}
          <div className="hidden md:flex items-center gap-1 ml-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={!canGoBack}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
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
              className="h-9 w-9 flex items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              aria-label="Go forward"
              title="Go forward"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1.5">
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

                {/* User menu */}
                <div className="relative ml-1" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1.5 transition hover:border-neutral-300 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {initials || 'U'}
                    </span>
                    <span className="hidden lg:block text-xs font-semibold text-neutral-700">
                      {roleLabel}
                    </span>
                    <svg
                      className={`h-4 w-4 text-neutral-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-1.5 shadow-dropdown-lg motion-safe:animate-drawer-in"
                    >
                      <div className="px-3 py-2 border-b border-stone-line mb-1">
                        <p className="text-sm font-bold text-ink truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                      {[
                        { to: '/profile', label: 'Profile' },
                        { to: '/settings', label: 'Settings' },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-error-600 hover:bg-error-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              showAuthButtons && (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden flex h-11 w-11 -mr-2 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="absolute inset-0 bg-neutral-900/40 motion-safe:animate-fade-in"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white border-b border-neutral-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 flex flex-col gap-1">
              {user ? (
                <>
                  <div className="mb-2 rounded-xl border border-stone-line bg-paper px-3 py-2.5">
                    <p className="text-sm font-bold text-ink">{user.name}</p>
                    <p className="text-xs text-neutral-500">{roleLabel} account</p>
                  </div>
                  {links.map((l, i) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      aria-current={isActive(l.to) ? 'page' : undefined}
                      style={{ transitionDelay: `${i * 25}ms` }}
                      className={`motion-safe:animate-fade-up flex items-center gap-2 px-3 py-3 rounded-lg text-base font-semibold min-h-11 ${
                        isActive(l.to)
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {l.heart && <span className="text-danger">♥</span>}
                      {l.label}
                      {l.badge != null && <Badge count={l.badge} />}
                    </Link>
                  ))}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>
                      <Button variant="secondary" fullWidth size="sm">
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      fullWidth
                      size="sm"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                showAuthButtons && (
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
                )
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}