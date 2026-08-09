import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownerDashboard } from '../services/bookingService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Button from '../components/Button.jsx';

// ---- Inline icon set -----------------------------------------------------
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
const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v0H5a2 2 0 00-2 2z" />
    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2H5" />
    <path d="M17 12.5h.01" />
  </Svg>
);
const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const IconUsers = (p) => (
  <Svg {...p}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </Svg>
);
const IconBuilding = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
  </Svg>
);
const IconTrend = (p) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </Svg>
);
const IconReceipt = (p) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);
const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.4 2.1L8 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
  </Svg>
);

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const RENT_META = {
  PAID: { label: 'Paid', pill: 'bg-success/10 text-success', order: 2 },
  DUE: { label: 'Due', pill: 'bg-warning/15 text-warning', order: 1 },
  OVERDUE: { label: 'Overdue', pill: 'bg-danger/10 text-danger', order: 0 },
};

export default function Financials() {
  const { user } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [perPG, setPerPG] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await ownerDashboard();
        if (!alive) return;
        setSummary(res.data?.summary || null);
        setPerPG(res.data?.perPG || []);
      } catch (err) {
        if (!alive) return;
        setFailed(true);
        toast.error(err.message || 'Could not load financials');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loader className="min-h-screen" />;

  if (failed) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="bg-white rounded-xl2 shadow-card p-10 text-center max-w-md">
          <h1 className="font-display font-bold text-xl text-ink mb-2">
            Couldn't load your financials
          </h1>
          <p className="text-ink/60 mb-6">
            Something went wrong fetching your dashboard data. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Flatten every confirmed tenant into one rent-roll list.
  const tenants = perPG.flatMap((pg) =>
    (pg.tenants || []).map((t) => ({ ...t, pgName: pg.name }))
  );

  const rentRoll = tenants.reduce((s, t) => s + (t.monthlyRent || 0), 0);
  const paid = tenants.filter((t) => t.rentStatus === 'PAID');
  const pending = tenants.filter((t) => t.rentStatus !== 'PAID');
  const collected = paid.reduce((s, t) => s + (t.monthlyRent || 0), 0);
  const pendingAmount = pending.reduce((s, t) => s + (t.monthlyRent || 0), 0);
  const collectedPct = rentRoll > 0 ? Math.round((collected / rentRoll) * 100) : 0;

  const totalRooms = summary?.totalRooms ?? 0;
  const occupiedRooms = summary?.occupiedRooms ?? 0;
  const occupancy =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const sortedTenants = [...tenants].sort(
    (a, b) =>
      (RENT_META[a.rentStatus]?.order ?? 3) -
      (RENT_META[b.rentStatus]?.order ?? 3)
  );

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })
      : '—';

  const SupportStat = ({ icon, label, value, sub }) => (
    <div className="bg-white rounded-xl2 shadow-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
          {label}
        </p>
        <span className="h-9 w-9 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display font-extrabold text-2xl text-ink">
        {value}
      </p>
      {sub && <p className="text-xs text-ink/50 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-paper py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand mb-2">
              Owner · Financials
            </p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
              Rent &amp; earnings
            </h1>
            <p className="text-ink/60 mt-2">
              Your live rent roll, collection status, and payout setup.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/owner/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link to="/profile">
              <Button size="sm">Manage payouts</Button>
            </Link>
          </div>
        </div>

        {/* Hero — the monthly rent roll is the most characteristic number */}
        <section className="rounded-xl2 bg-gradient-to-br from-ink via-ink-soft to-indigo-brand text-white shadow-lift p-6 sm:p-8 mb-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">
                Monthly rent roll
              </p>
              <p className="mt-2 font-display font-extrabold text-4xl sm:text-5xl tabular-nums">
                {inr(rentRoll)}
              </p>
              <p className="text-white/70 mt-2 text-sm">
                Expected each month from {summary?.activeTenants ?? tenants.length}{' '}
                active {tenants.length === 1 ? 'tenant' : 'tenants'} across{' '}
                {summary?.totalPGs ?? perPG.length}{' '}
                {(summary?.totalPGs ?? perPG.length) === 1
                  ? 'property'
                  : 'properties'}
                .
              </p>
            </div>

            {/* Collected vs pending split — real, from rentStatus */}
            <div className="rounded-xl2 bg-white/10 backdrop-blur p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Collected this cycle</span>
                <span className="font-semibold">{collectedPct}%</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${collectedPct}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-white/60">Collected</p>
                  <p className="font-display font-bold text-lg tabular-nums">
                    {inr(collected)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60">Outstanding</p>
                  <p className="font-display font-bold text-lg tabular-nums">
                    {inr(pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supporting stats — all derived from real dashboard data */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <SupportStat
            icon={<IconClock />}
            label="Pending dues"
            value={inr(pendingAmount)}
            sub={`${pending.length} tenant${
              pending.length === 1 ? '' : 's'
            } to collect from`}
          />
          <SupportStat
            icon={<IconUsers />}
            label="Active tenants"
            value={summary?.activeTenants ?? tenants.length}
            sub={`${paid.length} paid up this cycle`}
          />
          <SupportStat
            icon={<IconBuilding />}
            label="Occupancy"
            value={`${occupancy}%`}
            sub={`${occupiedRooms} of ${totalRooms} rooms filled`}
          />
          <SupportStat
            icon={<IconWallet />}
            label="Properties"
            value={summary?.totalPGs ?? perPG.length}
            sub="Listed under your account"
          />
        </div>

        {/* Rent collection list */}
        <section className="bg-white rounded-xl2 shadow-card p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-ink">
              Rent collection
            </h2>
            <Link
              to="/owner/dashboard"
              className="text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
            >
              View all tenants
            </Link>
          </div>

          {sortedTenants.length === 0 ? (
            <div className="rounded-xl2 bg-paper p-10 text-center">
              <p className="text-ink/60">
                No active tenants yet. Once bookings are confirmed, rent status
                shows up here.
              </p>
              <Link to="/owner/requests" className="inline-block mt-4">
                <Button size="sm" variant="outline">
                  Review booking requests
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink/50 border-b border-ink/10">
                      <th className="pb-3 font-semibold">Tenant</th>
                      <th className="pb-3 font-semibold">Property</th>
                      <th className="pb-3 font-semibold">Rent</th>
                      <th className="pb-3 font-semibold">Next due</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTenants.map((t) => {
                      const meta = RENT_META[t.rentStatus] || {
                        label: t.rentStatus,
                        pill: 'bg-ink/10 text-ink',
                      };
                      return (
                        <tr
                          key={t.bookingId}
                          className="border-b border-ink/5 last:border-0"
                        >
                          <td className="py-3">
                            <span className="font-semibold text-ink">
                              {t.name}
                            </span>
                            {t.roomLabel && (
                              <span className="text-ink/40">
                                {' '}
                                · {t.roomLabel}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-ink/70">{t.pgName}</td>
                          <td className="py-3 font-mono font-semibold text-ink">
                            {inr(t.monthlyRent)}
                          </td>
                          <td className="py-3 text-ink/70">
                            {fmtDate(t.nextDueDate)}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.pill}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {t.rentStatus !== 'PAID' && t.phone ? (
                              <a
                                href={`tel:${t.phone}`}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
                              >
                                <IconPhone className="h-4 w-4" />
                                Remind
                              </a>
                            ) : (
                              <span className="text-ink/30">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {sortedTenants.map((t) => {
                  const meta = RENT_META[t.rentStatus] || {
                    label: t.rentStatus,
                    pill: 'bg-ink/10 text-ink',
                  };
                  return (
                    <div
                      key={t.bookingId}
                      className="rounded-xl2 bg-paper p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">
                            {t.name}
                          </p>
                          <p className="text-sm text-ink/60 truncate">
                            {t.pgName}
                            {t.roomLabel ? ` · ${t.roomLabel}` : ''}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.pill}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="font-mono font-semibold text-ink">
                            {inr(t.monthlyRent)}
                          </p>
                          <p className="text-xs text-ink/50">
                            Due {fmtDate(t.nextDueDate)}
                          </p>
                        </div>
                        {t.rentStatus !== 'PAID' && t.phone && (
                          <a
                            href={`tel:${t.phone}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-brand"
                          >
                            <IconPhone className="h-4 w-4" />
                            Remind
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Honest empty states for data we don't track */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-white rounded-xl2 shadow-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display font-bold text-lg text-ink mb-4">
              <IconReceipt className="h-5 w-5 text-indigo-brand" />
              Payout history
            </h2>
            <div className="rounded-xl2 border border-dashed border-outline-soft p-8 text-center">
              <p className="text-ink/60">
                No payouts recorded yet. Once you activate a payout account and
                receive transfers, they'll be listed here.
              </p>
              <Link to="/profile" className="inline-block mt-4">
                <Button size="sm" variant="outline">
                  Set up payouts
                </Button>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-xl2 shadow-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display font-bold text-lg text-ink mb-4">
              <IconTrend className="h-5 w-5 text-indigo-brand" />
              Revenue trends
            </h2>
            <div className="rounded-xl2 border border-dashed border-outline-soft p-8 text-center">
              <p className="text-ink/60">
                Monthly revenue history isn't tracked yet. As rent is collected
                each cycle, your trend will build up here.
              </p>
              <p className="mt-3 text-sm text-ink/40">
                Current cycle: {inr(collected)} collected of {inr(rentRoll)}.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
