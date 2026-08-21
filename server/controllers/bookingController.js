import Booking from '../models/Booking.js';
import PG from '../models/PG.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { calculateRefund } from '../utils/refund.js';
import { createRefund, reverseTransfer } from '../utils/razorpay.js';
import {
  createInteractiveEmail,
  createWhatsAppMessage,
  sendEmail,
  sendWhatsApp,
  notifyChannels,
} from '../utils/notify.js';

const GENDER_MAP = { MALE: 'BOYS_ONLY', FEMALE: 'GIRLS_ONLY' };

// Human-readable version of the ACTIVE policy in utils/refund.js — sent to the
// client so the cancel modal can show the tier table without hard-coding it.
const REFUND_TIERS = [
  { label: 'Within 5 days of start', percent: 80 },
  { label: 'Within 10 days of start', percent: 50 },
  { label: 'After 10 days', percent: 0 },
];

function addMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// POST /api/booking — create a booking request (owner approval + payment confirm)
export async function createBooking(req, res, next) {
  try {
    const { pgId, startDate, roomLabel, roomId } = req.body;
    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    // One active booking per user — a tenant can hold a single allocation.
    // REQUESTED (awaiting owner approval) and PENDING (awaiting payment) count
    // as active, so a user can't stack up multiple requests on the same or
    // different PGs. They must cancel their current booking first.
    const activeBooking = await Booking.findOne({
      user: req.user._id,
      bookingStatus: { $in: ['REQUESTED', 'PENDING', 'CONFIRMED'] },
    }).populate('pg', 'name');
    if (activeBooking) {
      return res.status(409).json({
        success: false,
        message: `You already have an active booking at ${
          activeBooking.pg?.name || 'a PG'
        }. Please cancel it before booking another PG.`,
      });
    }

    // Gender restriction check
    if (pg.genderType !== 'BOTH') {
      const required = GENDER_MAP[req.user.gender];
      if (required !== pg.genderType) {
        return res.status(403).json({
          success: false,
          message: `This PG is ${pg.genderType.replace('_', ' ').toLowerCase()}.`,
        });
      }
    }

    // Room-level PG: a specific room must be chosen and have a free bed.
    let room = null;
    if (pg.rooms && pg.rooms.length > 0) {
      if (!roomId) {
        return res
          .status(400)
          .json({ success: false, message: 'Please select a room.' });
      }
      room = pg.rooms.id(roomId);
      if (!room) {
        return res
          .status(404)
          .json({ success: false, message: 'Room not found' });
      }
      if (room.availableBeds <= 0) {
        return res
          .status(409)
          .json({ success: false, message: 'No beds available in this room' });
      }
    } else if (pg.availableRooms <= 0) {
      // Legacy count-based PG
      return res
        .status(409)
        .json({ success: false, message: 'No rooms available' });
    }

    const monthlyRent = room ? room.rent : pg.price;
    const securityDeposit = room ? room.deposit : pg.securityDeposit;

    const start = startDate ? new Date(startDate) : new Date();
    const booking = await Booking.create({
      user: req.user._id,
      pg: pg._id,
      room: room ? room._id : null,
      sharingType: room ? room.sharingType : '',
      roomLabel: room ? room.label : roomLabel || '',
      startDate: start,
      nextDueDate: addMonth(start),
      monthlyRent,
      securityDeposit,
      bookingStatus: 'REQUESTED',
    });

    // Let the owner know a request is waiting for approval (respecting their
    // notification preferences).
    try {
      const owner = await User.findById(pg.owner);
      if (owner?.email || owner?.phone) {
        const channels = notifyChannels(owner, 'bookingUpdates');
        const info = room
          ? `${room.label}, ${room.sharingType.toLowerCase()} sharing`
          : 'Room details available in dashboard';
        const ownerMessage = `${req.user.name} has requested to book ${pg.name}. Please review the request and approve or reject it from your dashboard.`;
        if (channels.email) {
          await sendEmail(
            owner.email,
            'New booking request',
            createInteractiveEmail({
              userName: owner.name || 'Owner',
              subject: 'New booking request',
              title: 'New Booking Request',
              message: ownerMessage,
              details: [
                { label: 'Tenant', value: req.user.name },
                { label: 'PG', value: pg.name },
                { label: 'Room', value: info },
              ],
              ctaText: 'Review Request',
              ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/owner/requests`,
            })
          );
        }
        if (channels.whatsapp && owner.phone) {
          await sendWhatsApp(
            owner.phone,
            createWhatsAppMessage({
              userName: owner.name || 'Owner',
              message: ownerMessage,
              ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/owner/requests`,
            })
          );
        }
      }
    } catch (notifyErr) {
      console.error('Owner notify failed:', notifyErr);
    }

    res.status(201).json({
      success: true,
      data: booking,
      payable: monthlyRent + securityDeposit,
      message: 'Request sent — the owner will review and approve your booking.',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/booking/my — user's bookings
export async function myBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('pg', 'name city address images price genderType latitude longitude')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/booking/:bookingId/refund-preview — what a cancellation would refund
// *right now*, without touching anything. Powers the confirm modal.
export async function refundPreview(req, res, next) {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    const payment = await Payment.findOne({
      booking: booking._id,
      type: 'BOOKING',
      status: 'PAID',
    });

    // Nothing paid yet (e.g. still PENDING) → clean cancel, no money in play.
    if (!payment) {
      return res.json({
        success: true,
        paid: false,
        amountPaid: 0,
        refund: { percent: 0, amount: 0, daysSinceStart: 0 },
        tiers: REFUND_TIERS,
      });
    }

    const refund = calculateRefund(payment.amount, booking.startDate);
    res.json({
      success: true,
      paid: true,
      amountPaid: payment.amount,
      refund,
      tiers: REFUND_TIERS,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/booking/cancel — cancel + refund
export async function cancelBooking(req, res, next) {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('user').populate('pg');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    // Find the booking payment
    const payment = await Payment.findOne({
      booking: booking._id,
      type: 'BOOKING',
      status: 'PAID',
    });

    let refund = { amount: 0, percent: 0 };
    if (payment) {
      refund = calculateRefund(payment.amount, booking.startDate);
      if (refund.amount > 0) {
        try {
          const rz = await createRefund(payment.razorpayPaymentId, refund.amount);
          payment.status = 'REFUNDED';
          payment.refundId = rz.id;
          payment.refundAmount = refund.amount;
          payment.refundedAt = new Date();

          // Claw back the owner's payout so the refund isn't funded by the
          // platform. Non-fatal: the tenant refund already succeeded, so a
          // reversal problem is logged for reconciliation rather than failing.
          if (payment.transferId && payment.payoutStatus === 'PROCESSED') {
            try {
              await reverseTransfer(payment.transferId);
              payment.payoutStatus = 'REVERSED';
            } catch (revErr) {
              console.error('Transfer reversal failed:', revErr);
            }
          }

          await payment.save();
        } catch (refundErr) {
          console.error('Refund failed:', refundErr);
          return res.status(502).json({
            success: false,
            message: 'Refund could not be processed. Please contact support.',
          });
        }
      }
    }

    // Release the room/bed ONLY if this booking had reserved one (CONFIRMED).
    if (booking.bookingStatus === 'CONFIRMED') {
      if (booking.room) {
        // Room-level: increment that room's beds + aggregate.
        await PG.updateOne(
          { _id: booking.pg._id, 'rooms._id': booking.room },
          { $inc: { 'rooms.$.availableBeds': 1, availableRooms: 1 } }
        );
      } else {
        await PG.updateOne({ _id: booking.pg._id }, { $inc: { availableRooms: 1 } });
      }
    }

    booking.bookingStatus = 'CANCELLED';
    booking.cancelledAt = new Date();
    booking.refundAmount = refund.amount;
    await booking.save();

    // Notify (respecting the tenant's notification preferences)
    const channels = notifyChannels(booking.user, 'bookingUpdates');
    const msg = `Your booking at ${booking.pg.name} is cancelled. Refund amount: ₹${refund.amount} (${refund.percent}%).`;
    if (channels.email) {
      await sendEmail(
        booking.user.email,
        'Booking Cancelled',
        createInteractiveEmail({
          userName: booking.user.name,
          subject: 'Booking Cancelled',
          title: 'Booking Cancellation Confirmed',
          message: msg,
          details: [
            { label: 'PG', value: booking.pg.name },
            { label: 'Refund', value: `₹${refund.amount}` },
            { label: 'Refund Percent', value: `${refund.percent}%` },
          ],
          ctaText: 'View My Bookings',
          ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/bookings`,
        })
      );
    }
    if (channels.whatsapp && booking.user.phone) {
      await sendWhatsApp(
        booking.user.phone,
        createWhatsAppMessage({
          userName: booking.user.name,
          message: msg,
          ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/bookings`,
        })
      );
    }

    res.json({
      success: true,
      message: 'Booking cancelled',
      refund,
      booking,
    });
  } catch (err) {
    next(err);
  }
}
