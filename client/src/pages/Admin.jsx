import { useState, useEffect, useCallback } from 'react';
import {
  adminStats,
  adminUsers,
  adminToggleBan,
  adminSetVerification,
  adminPGs,
  adminDeletePG,
  adminBookings,
  adminReviews,
  adminDeleteReview,
} from '../services/adminService.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'pgs', label: 'Listings' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'reviews', label: 'Reviews' },
];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const statusColor = {
  REQUESTED: 'bg-warning/15 text-warning',
  PENDING: 'bg-indigo-brand/10 text-indigo-brand',
  CONFIRMED: 'bg-success/10 text-success',
  CANCELLED: 'bg-ink/10 text-ink/50',
  REJECTED: 'bg-danger/10 text-danger',
};

export default function Admin() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="min-h-screen bg-paper py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand mb-2">
            Control room
          </p>
          <h1 className="font-display font-extrabold text-4xl text-ink">
            Admin panel
          </h1>
          <p className="text-ink/60 mt-2">
            Moderate listings, users, and disputes across NestSecure PG.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-ink/10">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-indigo-brand text-indigo-brand'
                  : 'border-transparent text-ink/50 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'users' && <Users />}
        {tab === 'pgs' && <Listings />}
        {tab === 'bookings' && <Bookings />}
        {tab === 'reviews' && <Reviews />}
      </div>
    </div>
  );
}

// ---------- Overview ----------
function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl2 shadow-card p-6">
      <p className="text-sm text-ink/60 mb-1">{label}</p>
      <p className={`font-mono font-bold text-3xl ${accent || 'text-ink'}`}>
        {value}
      </p>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await adminStats();
        setStats(res.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading) return <Loader />;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats.users.total} />
        <StatCard label="Owners" value={stats.users.owners} />
        <StatCard label="Listings" value={stats.pgs.total} />
        <StatCard label="Bookings" value={stats.bookings.total} />
        <StatCard
          label="Confirmed bookings"
          value={stats.bookings.confirmed}
          accent="text-success"
        />
        <StatCard
          label="Banned users"
          value={stats.users.banned}
          accent="text-danger"
        />
        <StatCard
          label="Pending verifications"
          value={stats.users.pendingVerifications}
          accent="text-warning"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h3 className="font-display font-bold text-lg text-ink mb-4">
            Revenue
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Gross collected</span>
              <span className="font-mono font-semibold text-ink">
                {inr(stats.revenue.gross)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Refunded</span>
              <span className="font-mono font-semibold text-danger">
                −{inr(stats.revenue.refunded)}
              </span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3">
              <span className="font-semibold text-ink">Net</span>
              <span className="font-display font-extrabold text-ink text-lg">
                {inr(stats.revenue.net)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h3 className="font-display font-bold text-lg text-ink mb-4">
            Bookings by status
          </h3>
          <div className="space-y-2 text-sm">
            {Object.keys(stats.bookings.byStatus).length === 0 && (
              <p className="text-ink/50">No bookings yet.</p>
            )}
            {Object.entries(stats.bookings.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusColor[status] || 'bg-ink/10 text-ink/60'
                  }`}
                >
                  {status}
                </span>
                <span className="font-mono font-semibold text-ink">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Users ----------
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminUsers(search ? { search } : undefined);
      setUsers(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBan = async (u) => {
    try {
      setBusy(u._id);
      const res = await adminToggleBan(u._id);
      toast.success(res.message);
      setUsers((prev) =>
        prev.map((x) =>
          x._id === u._id ? { ...x, isBanned: res.data.isBanned } : x
        )
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleVerify = async (u) => {
    const next = u.verificationStatus === 'VERIFIED' ? 'UNVERIFIED' : 'VERIFIED';
    try {
      setBusy(u._id);
      const res = await adminSetVerification(u._id, next);
      toast.success(res.message);
      setUsers((prev) =>
        prev.map((x) =>
          x._id === u._id
            ? { ...x, verificationStatus: res.data.verificationStatus }
            : x
        )
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 rounded-xl border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-brand"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/50">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Verified</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-ink/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-xs text-ink/50">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-ink/70">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.verificationStatus === 'VERIFIED' ? (
                        <span className="text-success text-xs font-semibold">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-ink/40 text-xs">
                          {u.verificationStatus === 'PENDING'
                            ? 'Pending'
                            : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-xs font-semibold">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              onClick={() => toggleVerify(u)}
                              disabled={busy === u._id}
                              className="text-xs font-semibold text-indigo-brand hover:underline disabled:opacity-50"
                            >
                              {u.verificationStatus === 'VERIFIED'
                                ? 'Unverify'
                                : 'Verify'}
                            </button>
                            <button
                              onClick={() => toggleBan(u)}
                              disabled={busy === u._id}
                              className="text-xs font-semibold text-danger hover:underline disabled:opacity-50"
                            >
                              {u.isBanned ? 'Reinstate' : 'Ban'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Listings ----------
function Listings() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminPGs();
      setPgs(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!target) return;
    try {
      setBusy(true);
      await adminDeletePG(target._id);
      toast.success('Listing removed');
      setPgs((prev) => prev.filter((p) => p._id !== target._id));
      setTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {pgs.map((pg) => (
          <div
            key={pg._id}
            className="bg-white rounded-xl2 shadow-card p-5 flex gap-4"
          >
            <div className="w-16 h-16 rounded-xl bg-ink/5 overflow-hidden flex-shrink-0">
              {pg.images?.[0] ? (
                <img
                  src={pg.images[0]}
                  alt={pg.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">
                  🏠
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-ink truncate">
                {pg.name}
              </h3>
              <p className="text-xs text-ink/50">{pg.city}</p>
              <p className="text-xs text-ink/60 mt-1">
                Owner: {pg.owner?.name || '—'}
                {pg.owner?.isBanned && (
                  <span className="text-danger"> (banned)</span>
                )}
              </p>
              <p className="text-sm mt-1">
                <span className="font-display font-extrabold text-ink">
                  {inr(pg.price)}
                </span>
                <span className="text-ink/40"> · </span>
                <span className="text-ink/70">
                  <span className="text-marigold">⭐</span> {pg.rating?.toFixed(1)} ({pg.reviewCount})
                </span>
              </p>
            </div>
            <button
              onClick={() => setTarget(pg)}
              className="text-xs font-semibold text-danger hover:underline self-start"
            >
              Remove
            </button>
          </div>
        ))}
        {pgs.length === 0 && (
          <p className="text-ink/50 col-span-2 text-center py-8">
            No listings yet.
          </p>
        )}
      </div>

      <Modal
        open={!!target}
        onClose={() => !busy && setTarget(null)}
        title="Remove listing?"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTarget(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={busy}>
              Remove listing
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink/70">
          This permanently deletes <strong>{target?.name}</strong> and its
          reviews association. Existing bookings are not deleted, but the listing
          will disappear from search.
        </p>
      </Modal>
    </div>
  );
}

// ---------- Bookings ----------
function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminBookings(status ? { status } : undefined);
      setBookings(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'REQUESTED', 'PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'].map(
          (s) => (
            <button
              key={s || 'ALL'}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                status === s
                  ? 'bg-indigo-brand text-white'
                  : 'bg-white text-ink/60 shadow-card hover:text-ink'
              }`}
            >
              {s || 'All'}
            </button>
          )
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-ink/50">
                  <th className="px-4 py-3 font-semibold">Tenant</th>
                  <th className="px-4 py-3 font-semibold">PG</th>
                  <th className="px-4 py-3 font-semibold">Start</th>
                  <th className="px-4 py-3 font-semibold">Rent</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b._id}
                    className="border-b border-ink/5 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">
                        {b.user?.name || '—'}
                      </p>
                      <p className="text-xs text-ink/50">{b.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {b.pg?.name || '—'}
                      <span className="text-ink/40"> · {b.pg?.city}</span>
                    </td>
                    <td className="px-4 py-3 text-ink/70">
                      {new Date(b.startDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink/80">
                      {inr(b.monthlyRent)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          statusColor[b.bookingStatus] || 'bg-ink/10 text-ink/60'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Reviews ----------
function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminReviews();
      setReviews(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!target) return;
    try {
      setBusy(true);
      await adminDeleteReview(target._id);
      toast.success('Review removed');
      setReviews((prev) => prev.filter((r) => r._id !== target._id));
      setTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r._id}
            className="bg-white rounded-xl2 shadow-card p-5 flex justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-marigold text-sm">
                  {'⭐'.repeat(r.rating)}
                </span>
                <span className="font-semibold text-ink text-sm">
                  {r.user?.name || 'Anonymous'}
                </span>
                <span className="text-xs text-ink/40">
                  on {r.pg?.name || '—'}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-ink/70">{r.comment}</p>
              )}
            </div>
            <button
              onClick={() => setTarget(r)}
              className="text-xs font-semibold text-danger hover:underline self-start"
            >
              Remove
            </button>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-ink/50 text-center py-8">No reviews yet.</p>
        )}
      </div>

      <Modal
        open={!!target}
        onClose={() => !busy && setTarget(null)}
        title="Remove review?"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTarget(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={busy}>
              Remove review
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink/70">
          Remove this review by {target?.user?.name}? The PG's rating will be
          recalculated automatically.
        </p>
      </Modal>
    </div>
  );
}
