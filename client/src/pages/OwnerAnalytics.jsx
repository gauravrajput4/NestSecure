import { useState, useEffect } from 'react';
import {
  getAnalyticsSummary,
  getOccupancyTrends,
  getRevenueStats,
  getTenantTurnover,
  getRentRoll,
} from '../services/analyticsService.js';
import { suggestPricing } from '../services/pricingService.js';
import { fetchOwnerPGs } from '../services/pgService.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card-soft border border-stone-line p-5 sm:p-6">
      <p className="text-sm text-ink/60 mb-1">{label</p>
      <p className={`font-display text-3xl font-extrabold ${accent || 'text-ink'}`}>
        {value}
     </p>
   </div>
  );
}

function MiniBarChart({ data, valueKey, labelKey, prefix = '', suffix = '' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-ink/60 w-20 shrink-0">{d[labelKey]</span>
          <div className="flex-1 h-6 bg-stone-deep rounded overflow-hidden">
            <div
              className="h-full bg-indigo-brand transition-all"
              style={{ width: `${(d[valueKey] / max) * 100}%` }}
            />
         </div>
          <span className="text-xs font-semibold text-ink w-24 text-right">
            {prefix}
            {typeof d[valueKey] === 'number' && d[valueKey] >= 1000
              ? (d[valueKey] / 1000).toFixed(1) + 'k'
              : d[valueKey]}
            {suffix}
         </span>
       </div>
      ))}
   </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Occupancy Trends' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'turnover', label: 'Tenant Turnover' },
  { id: 'rentroll', label: 'Rent Roll' },
  { id: 'pricing', label: 'Smart Pricing' },
];

export default function OwnerAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [turnover, setTurnover] = useState(null);
  const [rentRoll, setRentRoll] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [pgs, setPgs] = useState([]);
  const [selectedPgId, setSelectedPgId] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'pricing' && selectedPgId) {
      loadPricing(selectedPgId);
    }
  }, [activeTab, selectedPgId]);

  async function loadAll() {
    try {
      setLoading(true);
      const [summaryRes, trendsRes, revenueRes, turnoverRes, rentRollRes, pgsRes] =
        await Promise.all([
          getAnalyticsSummary(),
          getOccupancyTrends(6),
          getRevenueStats(),
          getTenantTurnover(),
          getRentRoll(),
          fetchOwnerPGs(),
        ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data || []);
      setRevenue(revenueRes.data);
      setTurnover(turnoverRes.data);
      setRentRoll(rentRollRes.data);
      setPgs(pgsRes.data || []);
      if (pgsRes.data && pgsRes.data.length > 0) {
        setSelectedPgId(pgsRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadPricing(pgId) {
    try {
      const res = await suggestPricing({ pgId });
      setPricing(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Loader className="min-h-screen" />;

  return (
    <div className="page-shell py-12">
      <div className="page-container max-w-6xl">
        <div className="mb-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand">
            Owner · Analytics
         </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink tracking-tight mb-1">
            Analytics Dashboard
         </h1>
          <p className="text-ink/60">
            Track occupancy, revenue, turnover, and optimize your pricing.
         </p>
       </div>

        <div className="mb-6 flex gap-2 border-b border-stone-line overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-brand text-indigo-brand'
                  : 'border-transparent text-ink/60 hover:text-ink'
              }`}
            >
              {t.label}
           </button>
          ))}
       </div>

        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total PGs" value={summary.totalPGs} accent="text-indigo-deep" />
              <StatCard label="Total Rooms" value={summary.totalRooms} />
              <StatCard label="Occupied" value={summary.occupiedRooms} accent="text-warning" />
              <StatCard label="Available" value={summary.availableRooms} accent="text-success" />
           </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard label="Occupancy Rate" value={`${summary.occupancyRate}%`} accent="text-indigo-deep" />
              <StatCard label="This Month Revenue" value={`₹${summary.monthRevenue.toLocaleString('en-IN')}`} accent="text-success" />
              <StatCard label="Expected Monthly Rent" value={`₹${summary.expectedMonthlyRent.toLocaleString('en-IN')}`} />
           </div>
         </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                Occupancy Trends (Last 6 Months)
             </h2>
              {trends.length > 0 && (
                <MiniBarChart
                  data={trends}
                  valueKey="occupancyRate"
                  labelKey="monthLabel"
                  suffix="%"
                />
              )}
           </div>
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                Revenue Trends (Last 6 Months)
             </h2>
              {trends.length > 0 && (
                <MiniBarChart
                  data={trends}
                  valueKey="revenue"
                  labelKey="monthLabel"
                  prefix="₹"
                />
              )}
           </div>
         </div>
        )}

        {activeTab === 'revenue' && revenue && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard label="Lifetime Revenue" value={`₹${revenue.lifetime.total.toLocaleString('en-IN')}`} accent="text-success" />
              <StatCard label="This Month" value={`₹${revenue.thisMonth.toLocaleString('en-IN')}`} accent="text-indigo-deep" />
              <StatCard label="Last Month" value={`₹${revenue.lastMonth.toLocaleString('en-IN')}`} />
           </div>
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                Month-over-Month Change
             </h2>
              <div className="flex items-center gap-4">
                <span
                  className={`text-4xl font-display font-extrabold ${
                    revenue.monthOverMonth >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {revenue.monthOverMonth >= 0 ? '+' : ''}
                  {revenue.monthOverMonth}%
               </span>
                <span className="text-ink/60">vs last month</span>
             </div>
           </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="surface-card p-6">
                <h3 className="font-semibold text-ink mb-3">Lifetime Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Bookings</span>
                    <span className="font-mono font-semibold">
                      ₹{revenue.lifetime.bookings.toLocaleString('en-IN')} ({revenue.lifetime.bookingsCount})
                   </span>
                 </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Rent Payments</span>
                    <span className="font-mono font-semibold">
                      ₹{revenue.lifetime.rent.toLocaleString('en-IN')} ({revenue.lifetime.rentCount})
                   </span>
                 </div>
               </div>
             </div>
              <div className="surface-card p-6">
                <h3 className="font-semibold text-ink mb-3">Refunds</h3>
                <div className="flex justify-between mb-2">
                  <span className="text-ink/60">Total Refunded</span>
                  <span className="font-mono font-semibold text-danger">
                    -₹{revenue.totalRefunded.toLocaleString('en-IN')}
                 </span>
               </div>
                <div className="flex justify-between border-t border-ink/10 pt-2">
                  <span className="font-semibold text-ink">Net Revenue</span>
                  <span className="font-display font-extrabold text-success">
                    ₹{revenue.netRevenue.toLocaleString('en-IN')}
                 </span>
               </div>
             </div>
           </div>
         </div>
        )}

        {activeTab === 'turnover' && turnover && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Active Tenants" value={turnover.activeTenants} />
              <StatCard label="New (30 days)" value={turnover.newThisMonth} accent="text-success" />
              <StatCard label="Cancelled (30 days)" value={turnover.cancelledThisMonth} accent="text-danger" />
              <StatCard
                label="Net Growth"
                value={`${turnover.netGrowth >= 0 ? '+' : ''}${turnover.netGrowth}`}
                accent={turnover.netGrowth >= 0 ? 'text-success' : 'text-danger'}
              />
           </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="surface-card p-6">
                <h3 className="font-semibold text-ink mb-3">Year Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink/60">New (this year</span>
                    <span className="font-semibold">{turnover.newThisYear</span>
                 </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Cancelled (this year</span>
                    <span className="font-semibold">{turnover.cancelledThisYear</span>
                 </div>
               </div>
             </div>
              <div className="surface-card p-6">
                <h3 className="font-semibold text-ink mb-3">Retention</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Average stay</span>
                    <span className="font-semibold">{turnover.avgStayDays} days</span>
                 </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Turnover rate</span>
                    <span className="font-semibold">{turnover.turnoverRate}%</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
        )}

        {activeTab === 'rentroll' && rentRoll && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Tenants" value={rentRoll.summary.totalTenants} />
              <StatCard
                label="Monthly Rent"
                value={`₹${rentRoll.summary.totalMonthlyRent.toLocaleString('en-IN')}`}
                accent="text-success"
              />
              <StatCard
                label="Deposits Held"
                value={`₹${rentRoll.summary.totalDepositsHeld.toLocaleString('en-IN')}`}
              />
              <StatCard label="Overdue" value={rentRoll.summary.overdue} accent="text-danger" />
           </div>
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-xl text-ink mb-4">Rent Roll</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink/60">
                      <th className="pb-2 font-semibold">Tenant</th>
                      <th className="pb-2 font-semibold">PG</th>
                      <th className="pb-2 font-semibold">Room</th>
                      <th className="pb-2 font-semibold">Rent</th>
                      <th className="pb-2 font-semibold">Next Due</th>
                      <th className="pb-2 font-semibold">Status</th>
                   </tr>
                 </thead>
                  <tbody>
                    {rentRoll.entries.map((t) => (
                      <tr key={t.bookingId} className="border-t border-ink/10">
                        <td className="py-2 text-ink font-medium">{t.tenant</td>
                        <td className="py-2 text-ink/70">{t.pg</td>
                        <td className="py-2 text-ink/70">{t.roomLabel || '—'</td>
                        <td className="py-2 font-mono text-ink">
                          ₹{t.monthlyRent.toLocaleString('en-IN')}
                       </td>
                        <td className="py-2 text-ink/70">
                          {new Date(t.nextDueDate).toLocaleDateString('en-IN')}
                          {t.daysUntilDue <= 7 && t.daysUntilDue >= 0 && (
                            <span className="ml-1 text-xs text-warning">({t.daysUntilDue}d</span>
                          )}
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
         </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="surface-card p-6">
              <h2 className="font-display font-bold text-xl text-ink mb-4">
                Smart Pricing Suggestions
             </h2>
              {pgs.length === 0 ? (
                <p className="text-ink/60">You need to list a PG first</p>
              ) : (
                <>
                  <label className="block text-sm font-medium text-ink mb-2">
                    Select a PG
                 </label>
                  <select
                    value={selectedPgId}
                    onChange={(e) => setSelectedPgId(e.target.value)}
                    className="w-full sm:w-auto rounded-lg border border-outline-soft bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/30"
                  >
                    {pgs.map((pg) => (
                      <option key={pg._id} value={pg._id}>
                        {pg.name} ({pg.city})
                     </option>
                    ))}
                 </select>
                </>
              )}
           </div>

            {pricing && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="surface-card p-6 border-2 border-success/30">
                    <p className="text-sm text-ink/60 mb-1">Recommended Rent</p>
                    <p className="font-display text-4xl font-extrabold text-success">
                      ₹{pricing.recommendedRent.toLocaleString('en-IN')}
                   </p>
                    <p className="text-xs text-ink/50 mt-1">
                      Confidence: {pricing.confidence}
                   </p>
                 </div>
                  <StatCard
                    label="Your Current Rent"
                    value={`₹${pricing.currentRent.toLocaleString('en-IN')}`}
                  />
                  <StatCard
                    label="Market Avg"
                    value={
                      pricing.marketStats.sampleSize > 0
                        ? `₹${pricing.marketStats.avgRent.toLocaleString('en-IN')}`
                        : 'N/A'
                    }
                  />
               </div>

                {pricing.marketStats.sampleSize > 0 && (
                  <div className="surface-card p-6">
                    <h3 className="font-semibold text-ink mb-3">
                      Price Range ({pricing.marketStats.sampleSize} comparable rooms)
                   </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-ink/60">Budget</p>
                        <p className="font-display font-bold text-ink">
                          ₹{pricing.priceRange.budget.toLocaleString('en-IN')}
                       </p>
                     </div>
                      <div>
                        <p className="text-xs text-ink/60">Recommended</p>
                        <p className="font-display font-bold text-success">
                          ₹{pricing.priceRange.recommended.toLocaleString('en-IN')}
                       </p>
                     </div>
                      <div>
                        <p className="text-xs text-ink/60">Premium</p>
                        <p className="font-display font-bold text-ink">
                          ₹{pricing.priceRange.premium.toLocaleString('en-IN')}
                       </p>
                     </div>
                   </div>
                 </div>
                )}

                {pricing.insights && pricing.insights.length > 0 && (
                  <div className="surface-card p-6">
                    <h3 className="font-semibold text-ink mb-3">Insights</h3>
                    <div className="space-y-2">
                      {pricing.insights.map((insight, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${
                            insight.type === 'positive'
                              ? 'border-success/30 bg-success/5 text-success'
                              : insight.type === 'warning'
                              ? 'border-warning/30 bg-warning/5 text-warning'
                              : 'border-indigo-brand/30 bg-indigo-brand/5 text-indigo-deep'
                          }`}
                        >
                          {insight.text}
                       </div>
                      ))}
                   </div>
                 </div>
                )}

                <div className="surface-card p-6">
                  <h3 className="font-semibold text-ink mb-3">Demand Analysis</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-ink/60">Demand Level</p>
                      <p
                        className={`font-display font-bold text-lg ${
                          pricing.demand === 'high'
                            ? 'text-success'
                            : pricing.demand === 'medium'
                            ? 'text-warning'
                            : 'text-ink/70'
                        }`}
                      >
                        {pricing.demand.toUpperCase()}
                     </p>
                   </div>
                    <div>
                      <p className="text-xs text-ink/60">Bookings (30 days</p>
                      <p className="font-display font-bold text-lg text-ink">
                        {pricing.recentBookings}
                     </p>
                   </div>
                    <div>
                      <p className="text-xs text-ink/60">Your Occupancy</p>
                      <p className="font-display font-bold text-lg text-ink">
                        {pricing.occupancyRate}%
                     </p>
                   </div>
                 </div>
               </div>
              </>
            )}
         </div>
        )}
     </div>
   </div>
  );
}