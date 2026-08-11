import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { createOrder, verifySignature, createTransfer } from '../utils/razorpay.js';
import {
  createInteractiveEmail,
  createWhatsAppMessage,
  sendEmail,
  sendWhatsApp,
} from '../utils/notify.js';
import { ensureInvoice, settleInvoice } from '../utils/rentLedger.js';

// Platform commission (percent of each payment kept by Roomward). Defaults to 0
// so the full amount reaches the owner; set PLATFORM_FEE_PERCENT to take a cut.
const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 0);

// Route the owner's share of a verified payment to their linked account.
// Non-fatal: the tenant has already paid and the booking is confirmed, so any
// payout problem is recorded on the Payment for retry/reconciliation rather than
// failing the request. Mutates + saves `payment`.
async function routeOwnerPayout(payment, booking) {
  try {
    // Resolve the owner who listed this PG.
    const ownerId = booking.pg?.owner;
    const owner = ownerId ? await User.findById(ownerId) : null;

    const fee = Math.round((payment.amount * PLATFORM_FEE_PERCENT) / 100);
    const ownerAmount = Math.max(0, payment.amount - fee);
    payment.platformFee = fee;
    payment.ownerAmount = ownerAmount;

    // Owner hasn't finished payout onboarding — hold the funds (platform keeps
    // them for now) and flag PENDING so it can be settled once they provision.
    if (!owner || owner.payout?.status !== 'ACTIVE' || !owner.payout?.razorpayFundAccountId) {
      payment.payoutStatus = 'PENDING';
      await payment.save();
      return;
    }

    const transfer = await createTransfer(
      owner.payout.razorpayFundAccountId,
      ownerAmount,
      payment.razorpayPaymentId || String(payment._id) // idempotency key
    );
    payment.transferId = transfer.id;
    payment.payoutStatus = transfer.status === 'failed' ? 'FAILED' : 'PROCESSED';
    await payment.save();
  } catch (payoutErr) {
    console.error('Owner payout failed:', payoutErr);
    payment.payoutStatus = 'FAILED';
    await payment.save().catch(() => {});
  }
}

// POST /api/payment/order — create a Razorpay order for a booking
export async function createPaymentOrder(req, res, next) {
  try {
    const { bookingId, type = 'BOOKING' } = req.body;
    const booking = await Booking.findById(bookingId).populate('pg');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Booking payment is only unlocked once the owner has approved the request.
    if (type === 'BOOKING' && booking.bookingStatus !== 'PENDING') {
      const msg =
        booking.bookingStatus === 'REQUESTED'
          ? 'This booking is still awaiting owner approval.'
          : booking.bookingStatus === 'REJECTED'
          ? 'This booking request was declined by the owner.'
          : 'This booking cannot be paid for.';
      return res.status(409).json({ success: false, message: msg });
    }

    const amount =
      type === 'RENT'
        ? booking.monthlyRent
        : booking.monthlyRent + booking.securityDeposit;

    const order = await createOrder(amount, `rcpt_${booking._id}`);

    const payment = await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount,
      type,
      razorpayOrderId: order.id,
      status: 'CREATED',
    });

    res.json({
      success: true,
      order,
      paymentId: payment._id,
      keyId: process.env.RAZORPAY_KEY_ID || 'demo',
      demo: Boolean(order.demo),
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payment/verify — verify signature, confirm booking, decrement room atomically
export async function verifyPayment(req, res, next) {
  try {
    const {
      paymentId, // our Payment _id
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const valid = verifySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (!valid) {
      payment.status = 'FAILED';
      await payment.save();
      return res
        .status(400)
        .json({ success: false, message: 'Payment verification failed' });
    }

    payment.status = 'PAID';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    await payment.save();

    const booking = await Booking.findById(payment.booking)
      .populate('pg')
      .populate('user');

    // Route the owner's share to their linked account (non-fatal — booking is
    // already confirmed; any payout problem is logged for later reconciliation).
    await routeOwnerPayout(payment, booking);

    if (payment.type === 'BOOKING') {
      // ATOMIC availability decrement — only succeeds if a bed/room is free.
      // Prevents overbooking under concurrent requests.
      let updated;
      if (booking.room) {
        // Room-level PG: decrement the specific room's beds AND the aggregate,
        // guarded by availableBeds > 0 via arrayFilters.
        updated = await PG.findOneAndUpdate(
          { _id: booking.pg._id, 'rooms._id': booking.room },
          {
            $inc: { 'rooms.$[r].availableBeds': -1, availableRooms: -1 },
          },
          {
            new: true,
            arrayFilters: [{ 'r._id': booking.room, 'r.availableBeds': { $gt: 0 } }],
          }
        );
        // arrayFilters no-match still returns the doc; confirm a bed actually moved.
        const room = updated?.rooms?.id(booking.room);
        if (!updated || !room || room.availableBeds < 0) {
          updated = null;
        }
      } else {
        updated = await PG.findOneAndUpdate(
          { _id: booking.pg._id, availableRooms: { $gt: 0 } },
          { $inc: { availableRooms: -1 } },
          { new: true }
        );
      }

      if (!updated) {
        // Room got taken between order + verify — mark for refund path
        payment.status = 'FAILED';
        await payment.save();
        return res.status(409).json({
          success: false,
          message: 'Rooms sold out during payment. A refund will be issued.',
        });
      }

      booking.bookingStatus = 'CONFIRMED';
      booking.rentStatus = 'PAID';
      booking.lastRentPaidOn = new Date();
      await booking.save();

      // Ledger: the booking payment covers the first rent month. Create that
      // month's invoice already settled, then open the next month as DUE.
      try {
        const firstInvoice = await ensureInvoice(booking, booking.startDate);
        await settleInvoice(booking, payment, firstInvoice.period);
        await ensureInvoice(booking, booking.nextDueDate);
      } catch (ledgerErr) {
        console.error('Ledger init failed:', ledgerErr);
      }

      const msg = `Booking confirmed at ${booking.pg.name}! Room reserved. Next rent due ${new Date(
        booking.nextDueDate
      ).toLocaleDateString('en-IN')}.`;
      await sendEmail(
        booking.user.email,
        'Booking Confirmed',
        createInteractiveEmail({
          userName: booking.user.name,
          subject: 'Booking Confirmed',
          title: 'Your Room Is Confirmed',
          message: msg,
          details: [
            { label: 'PG', value: booking.pg.name },
            {
              label: 'Next Rent Due',
              value: new Date(booking.nextDueDate).toLocaleDateString('en-IN'),
            },
          ],
          ctaText: 'View Booking',
          ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/bookings`,
        })
      );
      if (booking.user.phone) {
        await sendWhatsApp(
          booking.user.phone,
          createWhatsAppMessage({
            userName: booking.user.name,
            message: msg,
            ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/ookings`,
          })
        );
      }
    } else {
      // RENT payment — settle the oldest open month, then advance the cycle and
      // open the next month's invoice.
      booking.lastRentPaidOn = new Date();
      booking.rentStatus = 'PAID';
      const next = new Date(booking.nextDueDate);
      next.setMonth(next.getMonth() + 1);
      booking.nextDueDate = next;
      await booking.save();

      try {
        await settleInvoice(booking, payment);
        await ensureInvoice(booking, booking.nextDueDate);
      } catch (ledgerErr) {
        console.error('Ledger settle failed:', ledgerErr);
      }
    }

    res.json({ success: true, message: 'Payment verified', booking });
  } catch (err) {
    next(err);
  }
}

// GET /api/payment/my — payment history
export async function myPayments(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate({ path: 'booking', populate: { path: 'pg', select: 'name city' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
}
