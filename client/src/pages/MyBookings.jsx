import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { myBookings, cancelBooking, refundPreview } from '../services/bookingService.js';
import { createOrder, verifyPayment } from '../services/bookingService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  // Cancel flow: which booking is being cancelled + its live refund preview
  const [cancelTarget, setCancelTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const stats = {
    total: bookings.length,
    active: bookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'PENDING'
    ).length,
    awaitingApproval: bookings.filter((b) => b.bookingStatus === 'REQUESTED').length,
    overdue: bookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED' && b.rentStatus === 'OVERDUE'
    ).length,
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await myBookings();
      setBookings(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (booking, type = 'BOOKING') => {
    try {
      setActionLoading(booking._id);
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load');
        return;
      }

      // Create order
      const orderRes = await createOrder({ bookingId: booking._id, type });
      const { order, paymentId, keyId, customerId } = orderRes;

      // Real Razorpay checkout
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'NestSecure PG',
        description: `${type} Payment`,
        order_id: order.id,
        ...(customerId
          ? {
              customer_id: customerId,
              remember_customer: true,
              save_card: true,
            }
          : {}),
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await verifyPayment({
              paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful');
            loadBookings();
          } catch (err) {
            toast.error(err.message);
          }
        },
        theme: { color: '#4F46E5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Open the cancel modal and fetch what the refund would be right now.
  const openCancel = async (booking) => {
    setCancelTarget(booking);
    setPreview(null);
    setPreviewLoading(true);
    try {
      const res = await refundPreview(booking._id);
      setPreview(res);
    } catch (err) {
      toast.error(err.message);
      setCancelTarget(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closeCancel = () => {
    if (cancelling) return;
    setCancelTarget(null);
    setPreview(null);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const res = await cancelBooking(cancelTarget._id);
      toast.success(
        res.refund.amount > 0
          ? `Booking cancelled. Refund: ₹${res.refund.amount.toLocaleString(
              'en-IN'
            )} (${res.refund.percent}%)`
          : 'Booking cancelled.'
      );
      setCancelTarget(null);
      setPreview(null);
      loadBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Loader className="min-h-screen" />;

  return (
    <div className="page-shell py-12">
      <div className="page-container max-w-5xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-indigo-brand">
              Booking workspace
            </p>
            <h1 className="font-display font-extrabold text-4xl text-ink">
              My Bookings
            </h1>
          </div>
          {user?.name && (
            <span className="rounded-full border border-outline-soft bg-white px-3 py-1 text-xs font-semibold text-ink/60">
              {user.name}
            </span>
          )}
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">Total</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{stats.total}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">Active</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-success">{stats.active}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
              Awaiting approval
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-indigo-brand">
              {stats.awaitingApproval}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">Overdue</p>
            <p className="mt-1 font-display text-2xl font-extrabold text-danger">{stats.overdue}</p>
          </div>
        </div>

        <h2 className="sr-only">
          My Bookings
        </h2>

        {bookings.length === 0 && (
          <div className="surface-card p-12 text-center">
            <p className="text-ink/60 mb-4">You have no bookings yet.</p>
            <Link to="/">
              <Button variant="outline">Explore PGs</Button>
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {bookings.map((b) => (
            <div
              key={b._id}
              className="surface-card p-6 border-2 border-transparent hover:border-indigo-brand/20 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {b.pg?.images?.[0] && (
                  <img
                    src={b.pg.images[0]}
                    alt={b.pg?.name || 'Property'}
                    loading="lazy"
                    className="w-full md:w-44 h-40 md:h-28 object-cover rounded-xl shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-xl text-ink mb-1">
                    {b.pg?.name}
                  </h3>
                  <p className="text-sm text-ink/60 mb-3">
                    {b.pg?.address}, {b.pg?.city}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-ink/60">Start Date:</span>{' '}
                      <span className="font-semibold text-ink">
                        {new Date(b.startDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink/60">Next Due:</span>{' '}
                      <span className="font-semibold text-ink">
                        {new Date(b.nextDueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink/60">Rent:</span>{' '}
                      <span className="font-display font-bold text-ink">
                        ₹{b.monthlyRent.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        b.bookingStatus === 'CONFIRMED'
                          ? 'bg-success/10 text-success'
                          : b.bookingStatus === 'PENDING'
                          ? 'bg-warning/10 text-warning'
                          : b.bookingStatus === 'REQUESTED'
                          ? 'bg-indigo-brand/10 text-indigo-deep'
                          : 'bg-danger/10 text-danger'
                      }`}
                    >
                      {b.bookingStatus === 'REQUESTED'
                        ? 'AWAITING APPROVAL'
                        : b.bookingStatus === 'PENDING'
                        ? 'APPROVED · PAY NOW'
                        : b.bookingStatus}
                    </span>
                    {b.bookingStatus === 'REJECTED' && b.rejectionReason && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-ink/10 text-ink/70">
                        {b.rejectionReason}
                      </span>
                    )}
                    {b.bookingStatus === 'CONFIRMED' && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          b.rentStatus === 'PAID'
                            ? 'bg-success/10 text-success'
                            : b.rentStatus === 'OVERDUE'
                            ? 'bg-danger/10 text-danger'
                            : 'bg-ink/10 text-ink'
                        }`}
                      >
                        Rent: {b.rentStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:min-w-[9rem]">
                  {b.bookingStatus === 'REQUESTED' && (
                    <span className="text-xs text-ink/50 text-right md:max-w-[9rem]">
                      Waiting for the owner to approve your request.
                    </span>
                  )}
                  {b.bookingStatus === 'PENDING' && (
                    <Button
                      size="sm"
                      onClick={() => handlePay(b, 'BOOKING')}
                      loading={actionLoading === b._id}
                    >
                      Pay Now
                    </Button>
                  )}
                  {b.bookingStatus === 'CONFIRMED' &&
                    b.rentStatus !== 'PAID' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePay(b, 'RENT')}
                        loading={actionLoading === b._id}
                      >
                        Pay Rent
                      </Button>
                    )}
                  {b.bookingStatus === 'CONFIRMED' && (
                    <Link to={`/rent/${b._id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        Rent ledger
                      </Button>
                    </Link>
                  )}
                  {(b.bookingStatus === 'REQUESTED' ||
                    b.bookingStatus === 'PENDING' ||
                    b.bookingStatus === 'CONFIRMED') && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openCancel(b)}
                      loading={actionLoading === b._id}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel + refund-preview modal */}
      <Modal
        open={!!cancelTarget}
        onClose={closeCancel}
        title="Cancel booking?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeCancel} disabled={cancelling}>
              Keep booking
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmCancel}
              loading={cancelling}
              disabled={previewLoading}
            >
              Confirm cancel
            </Button>
          </>
        }
      >
        {previewLoading || !preview ? (
          <div className="py-6 flex justify-center">
            <Loader />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink/70">
              You're cancelling your booking at{' '}
              <span className="font-semibold text-ink">{cancelTarget?.pg?.name}</span>.
            </p>

            {preview.paid ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-paper border border-ink/10 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink/60">Amount paid</span>
                    <span className="font-mono font-semibold text-ink">
                      ₹{preview.amountPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink/60">
                      Days since start · {preview.refund.daysSinceStart}
                    </span>
                    <span className="font-semibold text-ink">
                      {preview.refund.percent}% rent refund
                    </span>
                  </div>
                  
                  {preview.refund.proRata && (
                    <div className="rounded-lg bg-indigo-brand/5 border border-indigo-brand/10 p-2 mb-2">
                      <p className="text-xs font-semibold text-indigo-deep mb-1">
                        Pro-rata Calculation
                      </p>
                      <div className="text-xs text-ink/60 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Days stayed: {preview.refund.daysStayed}</span>
                          <span>Days total: {preview.refund.totalDays}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily rate: ₹{preview.refund.dailyRate}</span>
                          <span>Unused: {preview.refund.unusedDays} days</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink/60">Rent refund</span>
                    <span className="font-mono font-semibold text-success">
                      ₹{preview.refund.rentRefund?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  
                  {/* Security deposit breakdown */}
                  <div className="pt-2 mt-2 border-t border-ink/10 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink/60">Security deposit</span>
                      <span className="font-mono font-semibold text-ink">
                        ₹{preview.refund.securityDeposit?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                    {preview.refund.unpaidRent > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-danger/70">Unpaid rent (deducted)</span>
                          <span className="font-mono font-semibold text-danger">
                            -₹{preview.refund.securityDeduction?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-ink/60">Security refund</span>
                          <span className="font-mono font-semibold text-success">
                            ₹{preview.refund.securityRefund?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                      </>
                    )}
                    {preview.refund.unpaidRent === 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-ink/60">Security refund</span>
                        <span className="font-mono font-semibold text-success">
                          ₹{preview.refund.securityRefund?.toLocaleString('en-IN') || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-ink/10">
                    <span className="text-ink font-semibold">Total refund</span>
                    <span
                      className={`font-mono font-bold text-2xl ${
                        preview.refund.amount > 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      ₹{preview.refund.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {preview.refund.unpaidRent > 0 && (
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                    <p className="text-xs text-warning font-semibold mb-1 flex items-center gap-1">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.5 2.9a1.5 1.5 0 013 0l5.6 10.2a1.5 1.5 0 01-1.3 2.2H4.2a1.5 1.5 0 01-1.3-2.2L8.5 2.9zm1.5 4a.75.75 0 01.75.75v2.7a.75.75 0 01-1.5 0v-2.7a.75.75 0 01.75-.75zM10 12.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Unpaid Rent Notice
                    </p>
                    <p className="text-xs text-ink/70">
                      You have ₹{preview.refund.unpaidRent.toLocaleString('en-IN')} in unpaid rent. 
                      This will be deducted from your security deposit before refund.
                    </p>
                    {preview.refund.outstandingBalance > 0 && (
                      <p className="text-xs text-danger font-semibold mt-2 flex items-center gap-1">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.5 2.9a1.5 1.5 0 013 0l5.6 10.2a1.5 1.5 0 01-1.3 2.2H4.2a1.5 1.5 0 01-1.3-2.2L8.5 2.9zm1.5 4a.75.75 0 01.75.75v2.7a.75.75 0 01-1.5 0v-2.7a.75.75 0 01.75-.75zM10 12.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Outstanding Balance: ₹{preview.refund.outstandingBalance.toLocaleString('en-IN')}
                        <br />
                        Your security deposit is insufficient. You will still owe this amount after cancellation.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-paper border border-ink/10 p-4 text-sm text-ink/70">
                No payment has been made on this booking, so there's nothing to
                refund. Cancelling is free.
              </div>
            )}

            <div>
              <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-2">
                Refund policy
              </p>
              <ul className="space-y-1">
                {preview.tiers?.map((t) => (
                  <li
                    key={t.label}
                    className="flex justify-between text-xs text-ink/60"
                  >
                    <span>{t.label}</span>
                    <span className="font-semibold text-ink/80">{t.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
