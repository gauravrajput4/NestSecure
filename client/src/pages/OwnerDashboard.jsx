import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ownerDashboard } from '../services/bookingService.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';

function StatCard({ label, value, accent, tint, icon }) {
  return (
    <div className="bg-white rounded-xl2 shadow-subtle border border-outline-soft/70 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/60 mb-1">{label}</p>
          <p className={`font-display text-3xl font-extrabold ${accent || 'text-ink'}`}>
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              tint || 'bg-surface-mid text-indigo-brand'
            }`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="w-full h-2 bg-surface-highest rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-brand rounded-full transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    ownerDashboard()
      .then((res) => setData(res.data))
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader className="min-h-screen" />;
  if (!data) return null;

  const { summary, perPG } = data;
  const totalRentRoll = perPG.reduce(
    (sum, pg) =>
      sum +
      (pg.tenants || []).reduce(
        (tenantSum, tenant) => tenantSum + Number(tenant.monthlyRent || 0),
        0
      ),
    0
  );
  const totalOverdue = perPG.reduce(
    (sum, pg) =>
      sum +
      (pg.tenants || []).filter((tenant) => tenant.rentStatus === 'OVERDUE').length,
    0
  );
  const occupancyRate =
    summary.totalRooms > 0
      ? Math.round((summary.occupiedRooms / summary.totalRooms) * 100)
      : 0;

  return (
    <div className="page-shell py-12">
      <div className="page-container max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand">
              Owner · Overview
            </p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight mb-1">
              Owner Dashboard
            </h1>
            <p className="text-ink/60">
              Real-time view of occupancy, tenants, and monthly rent pipeline.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/owner/requests">
              <button className="h-control-sm rounded-xl border border-outline-soft bg-white px-3.5 text-sm font-semibold text-ink/70 transition hover:border-indigo-brand/40 hover:text-indigo-deep">
                Review Requests
              </button>
            </Link>
            <Link to="/owner/financials">
              <button className="h-control-sm rounded-xl bg-indigo-brand px-3.5 text-sm font-semibold text-white transition hover:bg-indigo-deep">
                Open Financials
              </button>
            </Link>
          </div>
        </div>

        <section className="mb-8 rounded-xl2 bg-gradient-to-br from-ink via-ink-soft to-indigo-brand p-6 text-white shadow-lift sm:p-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/65">Monthly rent roll</p>
              <p className="mt-2 font-display text-4xl font-extrabold">
                ₹{totalRentRoll.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/65">Occupancy</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{occupancyRate}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/65">Overdue tenants</p>
              <p className="mt-2 font-display text-4xl font-extrabold">{totalOverdue}</p>
            </div>
          </div>
        </section>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total PGs"
            value={summary.totalPGs}
            accent="text-indigo-deep"
            tint="bg-indigo-brand/10 text-indigo-brand"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-7 9 7M5 10v9a1 1 0 001 1h12a1 1 0 001-1v-9" />
              </svg>
            }
          />
          <StatCard
            label="Total Rooms"
            value={summary.totalRooms}
            tint="bg-surface-mid text-ink/70"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V7a1 1 0 011-1h16a1 1 0 011 1v5M3 12v5m18-5v5M3 14h18" />
              </svg>
            }
          />
          <StatCard
            label="Occupied"
            value={summary.occupiedRooms}
            accent="text-warning"
            tint="bg-warning/10 text-warning"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 0112 0v1" />
              </svg>
            }
          />
          <StatCard
            label="Available"
            value={summary.availableRooms}
            accent="text-success"
            tint="bg-success/10 text-success"
            icon={
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Per-PG breakdown */}
        <h2 className="font-display font-bold text-2xl text-ink mb-4">
          Property Breakdown
        </h2>
        <div className="space-y-6">
          {perPG.length === 0 && (
            <div className="bg-white rounded-xl2 shadow-card p-12 text-center text-ink/60">
              You haven't listed any PGs yet.
            </div>
          )}
          {perPG.map((pg) => (
            <div key={pg._id} className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-ink">
                    {pg.name}
                  </h3>
                  <p className="text-sm text-ink/60">{pg.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-indigo-brand">
                    {pg.occupancyRate}%
                  </p>
                  <p className="text-xs text-ink/60">occupied</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-ink/60 mb-1">
                  <span>
                    {pg.occupiedRooms} occupied · {pg.availableRooms} available
                  </span>
                  <span>{pg.totalRooms} total</span>
                </div>
                <ProgressBar percent={pg.occupancyRate} />
              </div>

              {/* Tenants */}
              {pg.tenants.length > 0 && (
                <div className="border-t border-ink/10 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">
                      Tenants ({pg.tenants.length})
                    </p>
                    <p className="text-xs text-ink/55">
                      Rent roll: ₹
                      {pg.tenants
                        .reduce((sum, tenant) => sum + Number(tenant.monthlyRent || 0), 0)
                        .toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-ink/60">
                          <th className="pb-2 font-semibold">Name</th>
                          <th className="pb-2 font-semibold">Room</th>
                          <th className="pb-2 font-semibold">Rent</th>
                          <th className="pb-2 font-semibold">Next Due</th>
                          <th className="pb-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pg.tenants.map((t) => (
                          <tr key={t.bookingId} className="border-t border-ink/5">
                            <td className="py-2 text-ink font-medium">{t.name}</td>
                            <td className="py-2 text-ink/70">
                              {t.roomLabel || '—'}
                            </td>
                            <td className="py-2 font-mono text-ink">
                              ₹{t.monthlyRent.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 text-ink/70">
                              {new Date(t.nextDueDate).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  t.rentStatus === 'PAID'
                                    ? 'bg-success/10 text-success'
                                    : t.rentStatus === 'OVERDUE'
                                    ? 'bg-danger/10 text-danger'
                                    : 'bg-warning/10 text-warning'
                                }`}
                              >
                                {t.rentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
