import RentInvoice from '../models/RentInvoice.js';

// YYYY-MM key for a date, in a stable local sense (we only care about month).
export function periodKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function periodLabel(period) {
  const [y, m] = period.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function receiptNo(bookingId, period) {
  return `RW-${period.replace('-', '')}-${bookingId.toString().slice(-6).toUpperCase()}`;
}

// Ensure an invoice row exists for a booking's given month. Idempotent thanks
// to the unique (booking, period) index — a duplicate insert is swallowed.
export async function ensureInvoice(booking, periodStart) {
  const period = periodKey(periodStart);
  const existing = await RentInvoice.findOne({
    booking: booking._id,
    period,
  });
  if (existing) return existing;

  try {
    return await RentInvoice.create({
      booking: booking._id,
      user: booking.user,
      pg: booking.pg,
      period,
      periodStart,
      dueDate: booking.nextDueDate || periodStart,
      amount: booking.monthlyRent,
      status: 'DUE',
    });
  } catch (err) {
    // Unique-index race: another request created it first — fetch and return.
    if (err.code === 11000) {
      return RentInvoice.findOne({ booking: booking._id, period });
    }
    throw err;
  }
}

// Mark the earliest unpaid invoice (or the given period) as PAID and stamp a
// receipt. Returns the settled invoice.
export async function settleInvoice(booking, payment, period) {
  let invoice;
  if (period) {
    invoice = await RentInvoice.findOne({ booking: booking._id, period });
  } else {
    // Oldest still-owed month first.
    invoice = await RentInvoice.findOne({
      booking: booking._id,
      status: { $in: ['DUE', 'OVERDUE'] },
    }).sort({ periodStart: 1 });
  }

  // No open invoice (e.g. first rent right after booking) — create one for the
  // booking's current cycle and settle it.
  if (!invoice) {
    invoice = await ensureInvoice(booking, booking.nextDueDate || new Date());
  }

  invoice.status = 'PAID';
  invoice.paidOn = new Date();
  invoice.payment = payment?._id;
  invoice.receiptNo = receiptNo(booking._id, invoice.period);
  await invoice.save();
  return invoice;
}
