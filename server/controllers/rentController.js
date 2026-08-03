import Booking from '../models/Booking.js';
import RentInvoice from '../models/RentInvoice.js';
import { periodLabel } from '../utils/rentLedger.js';

// GET /api/rent/booking/:bookingId — the full month-by-month ledger
export async function getLedger(req, res, next) {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate('pg', 'name city owner');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isTenant = booking.user.toString() === req.user._id.toString();
    const isOwner =
      booking.pg?.owner &&
      booking.pg.owner.toString() === req.user._id.toString();
    if (!isTenant && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const invoices = await RentInvoice.find({ booking: booking._id }).sort({
      periodStart: 1,
    });

    const rows = invoices.map((inv) => ({
      _id: inv._id,
      period: inv.period,
      periodLabel: periodLabel(inv.period),
      dueDate: inv.dueDate,
      amount: inv.amount,
      status: inv.status,
      paidOn: inv.paidOn,
      receiptNo: inv.receiptNo,
    }));

    const totalPaid = invoices
      .filter((i) => i.status === 'PAID')
      .reduce((s, i) => s + i.amount, 0);
    const totalDue = invoices
      .filter((i) => i.status !== 'PAID')
      .reduce((s, i) => s + i.amount, 0);

    res.json({
      success: true,
      data: {
        booking: {
          _id: booking._id,
          pgName: booking.pg?.name,
          city: booking.pg?.city,
          monthlyRent: booking.monthlyRent,
          nextDueDate: booking.nextDueDate,
          rentStatus: booking.rentStatus,
        },
        invoices: rows,
        summary: {
          months: invoices.length,
          paidMonths: invoices.filter((i) => i.status === 'PAID').length,
          totalPaid,
          totalDue,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/rent/invoice/:invoiceId/receipt — printable receipt data for a paid month
export async function getReceipt(req, res, next) {
  try {
    const { invoiceId } = req.params;
    const invoice = await RentInvoice.findById(invoiceId)
      .populate('user', 'name email phone')
      .populate('pg', 'name address city owner');
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const isTenant = invoice.user._id.toString() === req.user._id.toString();
    const isOwner =
      invoice.pg?.owner &&
      invoice.pg.owner.toString() === req.user._id.toString();
    if (!isTenant && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (invoice.status !== 'PAID') {
      return res
        .status(400)
        .json({ success: false, message: 'Receipt available only for paid months' });
    }

    res.json({
      success: true,
      data: {
        receiptNo: invoice.receiptNo,
        period: invoice.period,
        periodLabel: periodLabel(invoice.period),
        amount: invoice.amount,
        paidOn: invoice.paidOn,
        tenant: {
          name: invoice.user.name,
          email: invoice.user.email,
          phone: invoice.user.phone,
        },
        pg: {
          name: invoice.pg.name,
          address: invoice.pg.address,
          city: invoice.pg.city,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
