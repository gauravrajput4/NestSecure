import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  myBookings,
  myPayments,
  ownerPGs,
  ownerDashboard,
} from '../services/bookingService.js';
import { updateProfile, provisionPayout } from '../services/payoutService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import VerifySelfie from '../components/VerifySelfie.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

// ---- Inline icon set (stroke-based, matches the Navbar shield) ----------
const Svg = ({ children, className = 'h-5 w-5', ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);
const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9.5 12l1.8 1.8 3.2-3.6" />
  </Svg>
);
const IconUser = (p) => (
  <Svg {...p}>
    <path d="M20 21a8 8 0 10-16 0" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
);
const IconReceipt = (p) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);
const IconHeart = (p) => (
  <Svg {...p}>
    <path d="M12 21s-7-4.35-9.5-8.5C.9 9.5 2.2 6 5.5 6 7.4 6 8.7 7 12 10c3.3-3 4.6-4 6.5-4 3.3 0 4.6 3.5 3 6.5C19 16.65 12 21 12 21z" />
  </Svg>
);
const IconGear = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Svg>
);
const IconPencil = (p) => (
  <Svg {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </Svg>
);
const IconPin = (p) => (
  <Svg {...p}>
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.4 2.1L8 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
  </Svg>
);
const IconStar = ({ className = 'h-5 w-5', ...p }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" {...p}>
    <path d="M12 2l2.9 6.26 6.85.6-5.19 4.53 1.55 6.7L12 17.9l-6.11 3.7 1.55-6.7L2.25 8.86l6.85-.6z" />
  </svg>
);
const IconBuilding = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
  </Svg>
);
const IconUsers = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </Svg>
);
const IconBank = (p) => (
  <Svg {...p}>
    <path d="M3 10l9-6 9 6" />
    <path d="M4 10v9M20 10v9M8 10v9M16 10v9M3 21h18" />
  </Svg>
);
const IconIdCard = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M6 16c.5-1.3 1.8-2 3-2s2.5.7 3 2M15 9h3M15 13h3" />
  </Svg>
);
const IconChevron = (p) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

// ---- Small helpers -------------------------------------------------------
const GENDER_LABEL = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };
const PG_GENDER_LABEL = { BOTH: 'Unisex', BOYS_ONLY: 'Boys', GIRLS_ONLY: 'Girls' };
const RENT_TONE = {
  PAID: 'text-success',
  OVERDUE: 'text-danger',
  DUE: 'text-warning',
};

// A Mongo ObjectId embeds its creation time in the first 4 bytes, so we can
// show a real "member since" date without any extra backend field.
function memberSince(id) {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) return null;
  const secs = parseInt(id.slice(0, 8), 16);
  if (!secs) return null;
  return new Date(secs * 1000).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export default function Profile() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Owner-only aggregates (read from existing GET endpoints).
  const [ownerPgs, setOwnerPgs] = useState([]);
  const [ownerSummary, setOwnerSummary] = useState(null);

  // Inline "edit personal info" — the profile API only accepts `phone`, so
  // that's the single editable field (name/email/gender stay read-only).
  const [editingInfo, setEditingInfo] = useState(false);
  const [phone, setPhone] = useState('');
  const [infoBusy, setInfoBusy] = useState(false);

  // Owner payout form state
  const [showPayout, setShowPayout] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('NONE');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payoutBusy, setPayoutBusy] = useState(false);

  useEffect(() => {
    const tasks = [myBookings(), myPayments()];
    if (user?.role === 'OWNER') tasks.push(ownerPGs(), ownerDashboard());

    // allSettled keeps the page usable even if one aggregate call fails.
    Promise.allSettled(tasks)
      .then((results) => {
        const val = (i) =>
          results[i]?.status === 'fulfilled' ? results[i].value : null;
        setBookings(val(0)?.data || []);
        setPayments(val(1)?.data || []);
        if (user?.role === 'OWNER') {
          setOwnerPgs(val(2)?.data || []);
          setOwnerSummary(val(3)?.data?.summary || null);
        }

        // Hydrate payout form from user profile
        if (user?.payout) {
          setPayoutMethod(user.payout.method || 'NONE');
          setAccountHolder(user.payout.accountHolder || '');
          setAccountNumber(user.payout.accountNumber || '');
          setIfsc(user.payout.ifsc || '');
          setUpiId(user.payout.upiId || '');
        }
        setPhone(user?.phone || '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveInfo = async () => {
    try {
      setInfoBusy(true);
      const res = await updateProfile({ phone: phone.trim() });
      patchUser(res.user);
      toast.success('Profile updated');
      setEditingInfo(false);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setInfoBusy(false);
    }
  };

  const cancelEdit = () => {
    setPhone(user?.phone || '');
    setEditingInfo(false);
  };

  const handleSavePayout = async () => {
    if (payoutMethod === 'NONE') {
      toast.error('Please select a payout method');
      return;
    }
    if (payoutMethod === 'BANK' && (!accountHolder || !accountNumber || !ifsc)) {
      toast.error('Fill all bank details');
      return;
    }
    if (payoutMethod === 'UPI' && !upiId) {
      toast.error('Enter your UPI ID');
      return;
    }

    try {
      setPayoutBusy(true);
      const res = await updateProfile({
        payout: {
          method: payoutMethod,
          accountHolder: payoutMethod === 'BANK' ? accountHolder : '',
          accountNumber: payoutMethod === 'BANK' ? accountNumber : '',
          ifsc: payoutMethod === 'BANK' ? ifsc : '',
          upiId: payoutMethod === 'UPI' ? upiId : '',
        },
      });
      patchUser(res.user);
      toast.success('Payout details saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setPayoutBusy(false);
    }
  };

  const handleProvision = async () => {
    try {
      setPayoutBusy(true);
      const res = await provisionPayout();
      patchUser({ payout: { ...user.payout, status: 'ACTIVE' } });
      toast.success(res.message || 'Payout account activated');
    } catch (err) {
      toast.error(err.message || 'Provisioning failed');
    } finally {
      setPayoutBusy(false);
    }
  };

  if (loading) return <Loader className="min-h-screen" />;

  const initials = user.name?.[0]?.toUpperCase() || '?';
  const joined = memberSince(user._id);
  const verified = user.verificationStatus === 'VERIFIED';
  const activeBooking = bookings.find((b) => b.bookingStatus === 'CONFIRMED');

  // Reusable payout form block (shared markup, unchanged logic).
  const payoutForm = (
    <>
      <div className="mb-6">
        <label className="block text-sm font-semibold text-ink mb-2">
          Payout Method
        </label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setPayoutMethod('BANK')}
            className={`h-control px-3 sm:px-4 rounded-xl border-2 text-sm sm:text-base font-semibold transition-colors ${
              payoutMethod === 'BANK'
                ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-brand'
                : 'border-ink/20 hover:border-ink/30 text-ink'
            }`}
          >
            Bank Transfer
          </button>
          <button
            type="button"
            onClick={() => setPayoutMethod('UPI')}
            className={`h-control px-3 sm:px-4 rounded-xl border-2 text-sm sm:text-base font-semibold transition-colors ${
              payoutMethod === 'UPI'
                ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-brand'
                : 'border-ink/20 hover:border-ink/30 text-ink'
            }`}
          >
            UPI
          </button>
        </div>
      </div>

      {payoutMethod === 'BANK' && (
        <div className="space-y-4 mb-6">
          <Input
            label="Account Holder Name"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="Name as per bank account"
          />
          <Input
            label="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="1234567890"
          />
          <Input
            label="IFSC Code"
            value={ifsc}
            onChange={(e) => setIfsc(e.target.value.toUpperCase())}
            placeholder="SBIN0001234"
          />
        </div>
      )}

      {payoutMethod === 'UPI' && (
        <div className="mb-6">
          <Input
            label="UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
          />
        </div>
      )}

      {payoutMethod !== 'NONE' && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleSavePayout}
            loading={payoutBusy}
            disabled={user.payout?.status === 'ACTIVE'}
          >
            Save Details
          </Button>
          {user.payout?.method !== 'NONE' &&
            user.payout?.status !== 'ACTIVE' && (
              <Button
                variant="secondary"
                onClick={handleProvision}
                loading={payoutBusy}
              >
                Activate Payout
              </Button>
            )}
        </div>
      )}
    </>
  );

  // =========================================================================
  // OWNER PROFILE  (mockup 2)
  // =========================================================================
  if (user.role === 'OWNER') {
    const totalReviews = ownerPgs.reduce((s, p) => s + (p.reviewCount || 0), 0);
    const avgRating =
      totalReviews > 0
        ? ownerPgs.reduce((s, p) => s + (p.rating || 0) * (p.reviewCount || 0), 0) /
          totalReviews
        : 0;
    const activeTenants = ownerSummary?.activeTenants ?? 0;

    const payout = user.payout || {};
    const payoutSummary =
      payout.method === 'BANK'
        ? `Bank a/c ending ${(payout.accountNumber || '').slice(-4) || '••••'}`
        : payout.method === 'UPI'
        ? payout.upiId || 'UPI configured'
        : 'Not configured yet';
    const payoutActive = payout.status === 'ACTIVE';

    const kyc = verified
      ? { label: 'Verified', tone: 'text-success', dot: 'bg-success' }
      : user.verificationStatus === 'PENDING'
      ? { label: 'Pending review', tone: 'text-warning', dot: 'bg-warning' }
      : { label: 'Not verified', tone: 'text-ink/50', dot: 'bg-ink/30' };

    const StatCard = ({ label, icon, children }) => (
      <div className="bg-white rounded-xl2 shadow-card p-4 sm:p-5 flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-ink/40">
            {label}
          </p>
          {children}
        </div>
        <span className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
          {icon}
        </span>
      </div>
    );

    return (
      <div className="min-h-screen bg-paper py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-ink">
                Owner Profile
              </h1>
              <p className="text-ink/60 mt-2 text-sm sm:text-base">
                Manage your personal details, business metrics, and property
                portfolio.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              <Link to="/owner/financials" className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Financials
                </Button>
              </Link>
              <Button
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setEditingInfo((v) => !v)}
              >
                {editingInfo ? 'Close' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Profile card — full width until lg */}
            <div className="lg:col-span-2 bg-white rounded-xl2 shadow-card p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full bg-indigo-brand text-white flex items-center justify-center text-2xl sm:text-3xl font-display font-bold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-bold text-xl sm:text-2xl text-ink break-words">
                      {user.name}
                    </h2>
                    {verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                        <IconShield className="h-3.5 w-3.5" /> Verified Owner
                      </span>
                    )}
                  </div>
                  {joined && (
                    <p className="text-sm text-ink/50 mt-1">Joined {joined}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1.5 mt-3 text-sm text-ink/70">
                    <span className="inline-flex items-start gap-1.5 min-w-0">
                      <IconMail className="h-4 w-4 text-indigo-brand shrink-0 mt-0.5" />
                      <span className="break-all">{user.email}</span>
                    </span>
                    {!editingInfo && (
                      <span className="inline-flex items-center gap-1.5">
                        <IconPhone className="h-4 w-4 text-indigo-brand shrink-0" />
                        {user.phone || 'No phone added'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {editingInfo && (
                <div className="mt-6 border-t border-ink/10 pt-6">
                  <div className="max-w-sm">
                    <Input
                      label="Phone number"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      helperText="Name and email can't be changed here — contact support."
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                    <Button size="sm" onClick={handleSaveInfo} loading={infoBusy}>
                      Save changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Stat cards — row on tablet, column beside profile on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
              <StatCard label="Total listings" icon={<IconBuilding />}>
                <p className="mt-2 font-display font-extrabold text-2xl sm:text-3xl text-ink">
                  {ownerPgs.length}
                </p>
              </StatCard>
              <StatCard label="Average rating" icon={<IconStar className="h-5 w-5" />}>
                {totalReviews > 0 ? (
                  <>
                    <p className="mt-2 flex items-center gap-1.5 font-display font-extrabold text-2xl sm:text-3xl text-ink">
                      {avgRating.toFixed(1)}
                      <IconStar className="h-4 w-4 sm:h-5 sm:w-5 text-marigold" />
                    </p>
                    <p className="text-xs text-ink/50 mt-1">
                      From {totalReviews} review{totalReviews === 1 ? '' : 's'}
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-ink/50">No reviews yet</p>
                )}
              </StatCard>
              <StatCard label="Active tenants" icon={<IconUsers />}>
                <p className="mt-2 font-display font-extrabold text-2xl sm:text-3xl text-ink">
                  {activeTenants}
                </p>
              </StatCard>
            </div>
          </div>

          {/* Professional Settings */}
          <section className="mt-4 sm:mt-6 bg-white rounded-xl2 shadow-card p-5 sm:p-8">
            <h2 className="flex items-center gap-2 font-display font-bold text-lg sm:text-xl text-ink mb-4 sm:mb-5">
              <IconShield className="h-5 w-5 text-indigo-brand shrink-0" />
              Professional Settings
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Payout Details (expandable) */}
              <button
                type="button"
                onClick={() => setShowPayout((v) => !v)}
                className="text-left rounded-xl2 border border-ink/10 p-4 sm:p-5 hover:border-indigo-brand/50 hover:bg-indigo-brand/[0.03] transition"
                aria-expanded={showPayout}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="h-10 w-10 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center shrink-0">
                      <IconBank />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Payout Details</p>
                      <p className="text-sm text-ink/60">
                        Manage bank account & UPI
                      </p>
                    </div>
                  </div>
                  <IconChevron
                    className={`h-4 w-4 text-ink/40 mt-1 shrink-0 transition-transform ${
                      showPayout ? 'rotate-90' : ''
                    }`}
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm min-w-0">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      payoutActive ? 'bg-success' : 'bg-ink/30'
                    }`}
                  />
                  <span className="text-ink/70 truncate">{payoutSummary}</span>
                  {payoutActive && (
                    <span className="ml-auto shrink-0 text-xs font-semibold text-success">
                      Active
                    </span>
                  )}
                </div>
              </button>

              {/* Business Verification (status) */}
              <div className="rounded-xl2 border border-ink/10 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="h-10 w-10 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center shrink-0">
                    <IconIdCard />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">Business Verification</p>
                    <p className="text-sm text-ink/60">KYC & identity</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm min-w-0">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${kyc.dot}`} />
                  <span className={`font-semibold truncate ${kyc.tone}`}>
                    KYC status: {kyc.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded payout form (existing logic) */}
            {showPayout && (
              <div className="mt-6 border-t border-ink/10 pt-6">
                <p className="text-sm text-ink/60 mb-6">
                  Set up where you receive rent payments from your listed PGs.
                  Choose bank transfer or UPI, then activate your payout account.
                </p>
                {payoutForm}
              </div>
            )}
          </section>

          {/* Managed Properties */}
          <section className="mt-6 sm:mt-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink min-w-0">
                Managed Properties
              </h2>
              <Link
                to="/owner/pgs"
                className="shrink-0 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
              >
                View all ({ownerPgs.length})
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ownerPgs.slice(0, 3).map((pg) => {
                const avail = pg.availableRooms ?? 0;
                return (
                  <div
                    key={pg._id}
                    className="bg-white rounded-xl2 shadow-card overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-paper-sunk">
                      {pg.images?.[0] ? (
                        <img
                          src={pg.images[0]}
                          alt={pg.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-indigo-brand/40">
                          <IconBuilding className="h-10 w-10" />
                        </div>
                      )}
                      <span
                        className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          avail > 0
                            ? 'bg-success/15 text-success'
                            : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {avail > 0 ? `Available (${avail})` : 'Full'}
                      </span>
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-ink">
                        {PG_GENDER_LABEL[pg.genderType] || 'Unisex'}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-bold text-ink truncate">
                          {pg.name}
                        </h3>
                        {pg.reviewCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-sm text-ink shrink-0">
                            <IconStar className="h-4 w-4 text-marigold" />
                            {pg.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
                        <IconPin className="h-4 w-4" />
                        {pg.city}
                      </p>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <p className="font-display font-bold text-ink">
                          ₹{pg.price?.toLocaleString('en-IN')}
                          <span className="text-xs font-normal text-ink/50">
                            {' '}
                            /mo
                          </span>
                        </p>
                        <Link to="/owner/pgs">
                          <Button size="sm">Manage</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Listing tile */}
              <Link
                to="/owner/pgs"
                className="border-2 border-dashed border-outline-soft rounded-xl2 flex flex-col items-center justify-center p-6 text-center min-h-[16rem] hover:border-indigo-brand hover:bg-indigo-brand/[0.03] transition"
              >
                <span className="h-12 w-12 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
                  <IconPlus className="h-6 w-6" />
                </span>
                <p className="mt-3 font-display font-bold text-ink">
                  Add New Listing
                </p>
                <p className="text-sm text-ink/50 mt-1">
                  List a property and reach more tenants
                </p>
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================================
  // USER / ACCOUNT  (mockup 1)
  // =========================================================================
  const isUser = user.role === 'USER';
  const navItems = [
    { key: 'info', label: 'Personal Info', icon: <IconUser />, active: true },
    ...(isUser
      ? [
          { key: 'bookings', label: 'Active Bookings', icon: <IconReceipt />, to: '/bookings' },
          { key: 'saved', label: 'Saved Properties', icon: <IconHeart />, to: '/wishlist' },
        ]
      : []),
    { key: 'settings', label: 'Account Settings', icon: <IconGear />, href: '#identity' },
  ];

  const Field = ({ label, children }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
        {label}
      </p>
      <div className="mt-1 text-ink font-medium">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* LEFT: summary + nav — horizontal rail on mobile */}
          <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-24 lg:self-start min-w-0">
            <div className="bg-white rounded-xl2 shadow-card p-5 sm:p-6 text-center">
              <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-brand text-white flex items-center justify-center text-3xl sm:text-4xl font-display font-bold">
                {initials}
              </div>
              <h2 className="mt-3 sm:mt-4 font-display font-bold text-lg sm:text-xl text-ink break-words px-1">
                {user.name}
              </h2>
              {joined && (
                <p className="text-sm text-ink/50 mt-0.5">Member since {joined}</p>
              )}
              <span
                className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  verified
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/15 text-warning'
                }`}
              >
                <IconShield className="h-3.5 w-3.5" />
                {verified ? 'Verified' : 'Not verified'}
              </span>
            </div>

            <nav
              className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible bg-white rounded-xl2 shadow-card p-2"
              aria-label="Profile sections"
            >
              {navItems.map((item) => {
                const cls = `flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition min-h-control whitespace-nowrap shrink-0 ${
                  item.active
                    ? 'bg-indigo-brand text-white'
                    : 'text-ink/70 hover:bg-indigo-brand/5 hover:text-indigo-brand'
                }`;
                const inner = (
                  <>
                    <span
                      className={`shrink-0 ${
                        item.active ? 'text-white' : 'text-ink/50'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </>
                );
                if (item.to)
                  return (
                    <Link key={item.key} to={item.to} className={cls}>
                      {inner}
                    </Link>
                  );
                if (item.href)
                  return (
                    <a key={item.key} href={item.href} className={cls}>
                      {inner}
                    </a>
                  );
                return (
                  <span key={item.key} className={cls} aria-current="page">
                    {inner}
                  </span>
                );
              })}
            </nav>
          </aside>

          {/* RIGHT: content */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {/* Personal Information */}
            <section
              id="personal"
              className="bg-white rounded-xl2 shadow-card p-5 sm:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-ink/10">
                <h1 className="font-display font-extrabold text-xl sm:text-3xl text-ink">
                  Personal Information
                </h1>
                {editingInfo ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveInfo} loading={infoBusy}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingInfo(true)}
                  >
                    <IconPencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 pt-5 sm:pt-6">
                <Field label="Full name">
                  <span className="break-words">{user.name}</span>
                </Field>
                <Field label="Email address">
                  <span className="break-all">{user.email}</span>
                </Field>
                <Field label="Phone number">
                  {editingInfo ? (
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  ) : user.phone ? (
                    user.phone
                  ) : (
                    <span className="text-ink/40 font-normal">Not added</span>
                  )}
                </Field>
                <Field label="Gender">
                  {GENDER_LABEL[user.gender] || user.gender || '—'}
                </Field>
              </div>
            </section>

            {/* Current Accommodation */}
            <section className="bg-white rounded-xl2 shadow-card p-5 sm:p-8">
              <h2 className="font-display font-bold text-lg sm:text-xl text-ink mb-4 sm:mb-5">
                Current Accommodation
              </h2>

              {activeBooking ? (
                <div className="rounded-xl2 bg-paper p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-40 h-36 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-surface-mid">
                      {activeBooking.pg?.images?.[0] ? (
                        <img
                          src={activeBooking.pg.images[0]}
                          alt={activeBooking.pg?.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-indigo-brand/40">
                          <IconBuilding className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-base sm:text-lg text-ink truncate">
                            {activeBooking.pg?.name}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-ink/60">
                            <IconPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                              {[activeBooking.pg?.address, activeBooking.pg?.city]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-semibold">
                          Active
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-stretch gap-2 sm:gap-3">
                        {activeBooking.roomLabel && (
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold">
                              Room
                            </p>
                            <p className="text-sm font-semibold text-ink">
                              {activeBooking.roomLabel}
                            </p>
                          </div>
                        )}
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold">
                            Rent due
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              RENT_TONE[activeBooking.rentStatus] || 'text-ink'
                            }`}
                          >
                            {activeBooking.nextDueDate
                              ? new Date(
                                  activeBooking.nextDueDate
                                ).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })
                              : '—'}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-ink/40 font-semibold">
                            Monthly rent
                          </p>
                          <p className="text-sm font-semibold text-ink font-mono">
                            ₹{activeBooking.monthlyRent?.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <Link
                          to={`/rent/${activeBooking._id}`}
                          className="w-full sm:w-auto sm:ml-auto flex"
                        >
                          <Button size="sm" className="w-full sm:w-auto">
                            Pay Rent
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl2 bg-paper p-6 sm:p-8 text-center">
                  <p className="text-ink/60 text-sm sm:text-base">
                    You don't have an active accommodation yet.
                  </p>
                  <Link to="/" className="inline-block mt-4">
                    <Button size="sm" variant="outline">
                      Find a place
                    </Button>
                  </Link>
                </div>
              )}
            </section>

            {/* Identity verification (USER only) */}
            {isUser && (
              <div id="identity">
                <VerifySelfie />
              </div>
            )}

            {/* Payment history */}
            <section
              id="payment-history"
              className="bg-white rounded-xl2 shadow-card p-5 sm:p-8"
            >
              <h2 className="font-display font-bold text-lg sm:text-xl text-ink mb-4">
                Payment History
              </h2>
              {payments.length === 0 ? (
                <p className="text-ink/60 text-center py-8">No payments yet</p>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <div className="sm:hidden space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p._id}
                        className="rounded-xl bg-paper border border-stone-line p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate">
                              {p.booking?.pg?.name || '—'}
                            </p>
                            <p className="text-xs text-ink/50 mt-0.5">
                              {new Date(p.createdAt).toLocaleDateString('en-IN')}
                              {' · '}
                              {p.type}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.status === 'PAID'
                                ? 'bg-success/10 text-success'
                                : p.status === 'REFUNDED'
                                ? 'bg-indigo-brand/10 text-indigo-brand'
                                : p.status === 'FAILED'
                                ? 'bg-danger/10 text-danger'
                                : 'bg-ink/10 text-ink'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <p className="mt-2 font-mono font-semibold text-ink">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* sm+: table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-ink/60 border-b border-ink/10">
                          <th className="pb-3 font-semibold">Date</th>
                          <th className="pb-3 font-semibold">PG</th>
                          <th className="pb-3 font-semibold">Type</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p._id} className="border-b border-ink/5">
                            <td className="py-3 text-ink/70">
                              {new Date(p.createdAt).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-3 text-ink">
                              {p.booking?.pg?.name || '—'}
                            </td>
                            <td className="py-3 text-ink/70">{p.type}</td>
                            <td className="py-3 font-mono font-semibold text-ink">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  p.status === 'PAID'
                                    ? 'bg-success/10 text-success'
                                    : p.status === 'REFUNDED'
                                    ? 'bg-indigo-brand/10 text-indigo-brand'
                                    : p.status === 'FAILED'
                                    ? 'bg-danger/10 text-danger'
                                    : 'bg-ink/10 text-ink'
                                }`}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
