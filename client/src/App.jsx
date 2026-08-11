import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import NavigationTracker from './components/NavigationTracker.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import { PGDetailsSkeleton } from './components/Skeleton.jsx';
import Loader from './components/Loader.jsx';

// Route-level code splitting — each page ships in its own chunk, fetched only
// when the route is visited. Home stays eager since it's the landing page.
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const PGDetails = lazy(() => import('./pages/PGDetails.jsx'));
const MyBookings = lazy(() => import('./pages/MyBookings.jsx'));
const RentLedger = lazy(() => import('./pages/RentLedger.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard.jsx'));
const OwnerPGs = lazy(() => import('./pages/OwnerPGs.jsx'));
const AddListing = lazy(() => import('./pages/AddListing.jsx'));
const OwnerRequests = lazy(() => import('./pages/OwnerRequests.jsx'));
const Financials = lazy(() => import('./pages/Financials.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Help = lazy(() => import('./pages/Help.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  return (
    <div className="page-shell flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-card"
      >
        Skip to main content
      </a>
      <NavigationTracker />
      <Navbar />
      <main id="main-content" className="flex-grow flex flex-col">
        <Suspense fallback={<Loader className="min-h-screen" />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route
              path="/pg/:id"
              element={
                <Suspense fallback={<PGDetailsSkeleton />}>
                  <PGDetails />
                </Suspense>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/help" element={<Help />} />

            {/* User protected */}
            <Route
              path="/bookings"
              element={
                <ProtectedRoute role="USER">
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rent/:bookingId"
              element={
                <ProtectedRoute>
                  <RentLedger />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute role="USER">
                  <Wishlist />
                </ProtectedRoute>
              }
            />

            {/* Owner protected */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute role="OWNER">
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/pgs"
              element={
                <ProtectedRoute role="OWNER">
                  <OwnerPGs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/pgs/new"
              element={
                <ProtectedRoute role="OWNER">
                  <AddListing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/requests"
              element={
                <ProtectedRoute role="OWNER">
                  <OwnerRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/financials"
              element={
                <ProtectedRoute role="OWNER">
                  <Financials />
                </ProtectedRoute>
              }
            />

            {/* Admin protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="ADMIN">
                  <Admin />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="page-container min-h-[65vh] flex flex-col items-center justify-center text-ink">
                  <span className="mb-3 rounded-full bg-indigo-brand/10 px-3 py-1 text-xs font-bold tracking-wide text-indigo-brand">
                    Not Found
                  </span>
                  <h1 className="font-display font-extrabold text-5xl sm:text-6xl mb-2">404</h1>
                  <p className="text-ink/60 text-center text-balance">
                    This page wandered off the map.
                  </p>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
