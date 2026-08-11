import { useState, useEffect } from 'react';
import { ownerRequests, approveRequest, rejectRequest } from '../services/bookingService.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';

const genderLabels = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' };

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
const IconInbox = (p) => (
  <Svg {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.5 5h13a2 2 0 011.8 1.1L22 12v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6l3.7-5.9A2 2 0 015.5 5z" />
  </Svg>
);
const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9.5 12l1.8 1.8 3.2-3.6" />
  </Svg>
);
const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M3 7a2 2 0 012-2h12a2 2 0 012 2v0H5a2 2 0 00-2 2z" />
    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2H5" />
    <path d="M17 12.5h.01" />
  </Svg>
);
const IconPin = (p) => (
  <Svg {...p}>
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.2 2 2 0 014 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.4 2.1L8 9.5a16 16 0 006 6l1.1-1.1a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" />
  </Svg>
);
const IconCalendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?';

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reason, setReason] = useState('');
  const toast = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await ownerRequests();
      setRequests(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setBusy(id);
      await approveRequest(id);
      toast.success('Booking approved — tenant can now pay');
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    try {
      setBusy(rejectTarget._id);
      await rejectRequest(rejectTarget._id, reason);
      toast.success('Request declined');
      setRequests((prev) => prev.filter((r) => r._id !== rejectTarget._id));
      setRejectTarget(null);
      setReason('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Loader className="min-h-screen" />;

  // Every stat below is derived from the live pending-request list — no
  // fabricated "approved this week" figures, since that history isn't tracked.
  const pendingCount = requests.length;
  const verifiedCount = requests.filter(
    (r) => r.user?.verificationStatus === 'VERIFIED'
  ).length;
  const expectedRent = requests.reduce((s, r) => s + (r.monthlyRent || 0), 0);

  const Stat = ({ icon, label, value, sub }) => (
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
    <div className="page-shell py-10">
      <div className="page-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand mb-2">
            Owner · Inbox
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            Tenant requests
          </h1>
          <p className="text-ink/60 mt-2">
            Review applications and approve tenants. Approved tenants can then
            pay to reserve their room.
          </p>
        </div>

        {/* Stat cards — all real, derived from the pending queue */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Stat
            icon={<IconInbox />}
            label="Pending requests"
            value={pendingCount}
            sub={pendingCount === 1 ? 'Awaiting your review' : 'Awaiting review'}
          />
          <Stat
            icon={<IconShield />}
            label="Verified applicants"
            value={verifiedCount}
            sub={`${verifiedCount} of ${pendingCount || 0} ID-verified`}
          />
          <Stat
            icon={<IconWallet />}
            label="Potential rent"
            value={inr(expectedRent)}
            sub="If all approved · monthly"
          />
        </div>

        {/* Recent applications */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-ink">
            Recent applications
          </h2>
          {pendingCount > 0 && (
            <span className="text-sm text-ink/50">
              {pendingCount} to review
            </span>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <span className="mx-auto h-14 w-14 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
              <IconInbox className="h-7 w-7" />
            </span>
            <p className="font-display font-bold text-lg text-ink mt-4">
              You're all caught up
            </p>
            <p className="text-ink/60 mt-1">
              No pending requests right now. New applications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => {
              const verified = r.user?.verificationStatus === 'VERIFIED';
              return (
                <div
                  key={r._id}
                  className="surface-card p-5 sm:p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      {/* Avatar */}
                      <span className="shrink-0 h-12 w-12 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center font-display font-bold">
                        {initials(r.user?.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display font-bold text-lg text-ink">
                            {r.user?.name}
                          </h3>
                          {verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-semibold">
                              <IconShield className="h-3 w-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink/10 text-ink/50 text-xs font-semibold">
                              Unverified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink/60 mt-0.5 flex items-center gap-1">
                          <IconPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {r.pg?.name}
                            {r.pg?.city ? ` · ${r.pg.city}` : ''}
                          </span>
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm mt-3 text-ink/70">
                          <span className="inline-flex items-center gap-1">
                            {genderLabels[r.user?.gender] || r.user?.gender}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IconCalendar className="h-4 w-4 text-ink/40" />
                            {new Date(r.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {r.user?.phone && (
                            <a
                              href={`tel:${r.user.phone}`}
                              className="inline-flex items-center gap-1 font-semibold text-indigo-brand hover:text-indigo-deep"
                            >
                              <IconPhone className="h-4 w-4" />
                              {r.user.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rent + actions */}
                    <div className="flex flex-col items-stretch md:items-end gap-3 shrink-0">
                      <div className="md:text-right">
                        <p className="font-display font-extrabold text-xl text-ink tabular-nums">
                          {inr(r.monthlyRent)}
                        </p>
                        <p className="text-xs text-ink/50">per month</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(r._id)}
                          loading={busy === r._id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectTarget(r);
                            setReason('');
                          }}
                          disabled={busy === r._id}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!rejectTarget}
        onClose={() => !busy && setRejectTarget(null)}
        title="Decline request?"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRejectTarget(null)}
              disabled={!!busy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={submitReject}
              loading={!!busy}
            >
              Decline request
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink/70 mb-4">
          Declining {rejectTarget?.user?.name}'s request for{' '}
          {rejectTarget?.pg?.name}. You can add an optional reason the tenant
          will see.
        </p>
        <Input
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Room already committed"
        />
      </Modal>
    </div>
  );
}
