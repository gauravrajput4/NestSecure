import PG from '../models/PG.js';
import Booking from '../models/Booking.js';
import { sendEmail, sendWhatsApp } from '../utils/notify.js';

// GET /api/owner/dashboard — aggregate stats for the logged-in owner
export async function getDashboard(req, res, next) {
  try {
    const ownerId = req.user._id;
    const pgs = await PG.find({ owner: ownerId });
    const pgIds = pgs.map((p) => p._id);

    const totalRooms = pgs.reduce((s, p) => s + p.totalRooms, 0);
    const availableRooms = pgs.reduce((s, p) => s + p.availableRooms, 0);
    const occupiedRooms = totalRooms - availableRooms;

    // Active bookings across all owner PGs, with tenant + rent info
    const bookings = await Booking.find({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
    })
      .populate('user', 'name email phone gender verificationStatus verifiedAt')
      .populate('pg', 'name city')
      .sort({ nextDueDate: 1 });

    // Per-PG breakdown
    const perPG = pgs.map((p) => {
      const pgBookings = bookings.filter(
        (b) => b.pg._id.toString() === p._id.toString()
      );
      return {
        _id: p._id,
        name: p.name,
        city: p.city,
        totalRooms: p.totalRooms,
        availableRooms: p.availableRooms,
        occupiedRooms: p.totalRooms - p.availableRooms,
        occupancyRate:
          p.totalRooms > 0
            ? Math.round(((p.totalRooms - p.availableRooms) / p.totalRooms) * 100)
            : 0,
        tenants: pgBookings.map((b) => ({
          bookingId: b._id,
          name: b.user.name,
          phone: b.user.phone,
          verified: b.user.verificationStatus === 'VERIFIED',
          roomLabel: b.roomLabel,
          rentStatus: b.rentStatus,
          nextDueDate: b.nextDueDate,
          lastRentPaidOn: b.lastRentPaidOn,
          monthlyRent: b.monthlyRent,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalPGs: pgs.length,
          totalRooms,
          occupiedRooms,
          availableRooms,
          activeTenants: bookings.length,
        },
        perPG,
        bookings,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/owner/pgs — owner's own PGs
export async function getOwnerPGs(req, res, next) {
  try {
    const pgs = await PG.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: pgs });
  } catch (err) {
    next(err);
  }
}

// Confirm a booking's PG belongs to this owner. Returns the populated booking
// or null.
async function ownerBooking(bookingId, ownerId) {
  const booking = await Booking.findById(bookingId)
    .populate('user', 'name email phone gender verificationStatus verificationPhoto verifiedAt')
    .populate('pg', 'name city owner availableRooms');
  if (!booking) return { error: 'notfound' };
  if (booking.pg.owner.toString() !== ownerId.toString())
    return { error: 'forbidden' };
  return { booking };
}

// GET /api/owner/requests — pending booking requests across the owner's PGs.
// Includes the requester's verification status so owners can prefer verified
// tenants.
export async function getBookingRequests(req, res, next) {
  try {
    const pgs = await PG.find({ owner: req.user._id }).select('_id');
    const pgIds = pgs.map((p) => p._id);
    const requests = await Booking.find({
      pg: { $in: pgIds },
      bookingStatus: 'REQUESTED',
    })
      .populate('user', 'name email phone gender verificationStatus verificationPhoto verifiedAt')
      .populate('pg', 'name city availableRooms')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

// POST /api/owner/requests/:bookingId/approve — approve a request (tenant then pays)
export async function approveBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { booking, error } = await ownerBooking(bookingId, req.user._id);
    if (error === 'notfound')
      return res.status(404).json({ success: false, message: 'Booking not found' });
    if (error === 'forbidden')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.bookingStatus !== 'REQUESTED')
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${booking.bookingStatus.toLowerCase()} booking.`,
      });

    booking.bookingStatus = 'PENDING'; // approved → awaiting payment
    booking.approvedAt = new Date();
    await booking.save();

    const msg = `Good news! Your booking request at ${booking.pg.name} was approved. Log in to pay and reserve your room.`;
    await sendEmail(booking.user.email, 'Booking approved', `<p>${msg}</p>`);
    if (booking.user.phone) await sendWhatsApp(booking.user.phone, msg);

    res.json({ success: true, message: 'Booking approved', booking });
  } catch (err) {
    next(err);
  }
}

// POST /api/owner/requests/:bookingId/reject — decline a request
export async function rejectBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const { booking, error } = await ownerBooking(bookingId, req.user._id);
    if (error === 'notfound')
      return res.status(404).json({ success: false, message: 'Booking not found' });
    if (error === 'forbidden')
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.bookingStatus !== 'REQUESTED')
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${booking.bookingStatus.toLowerCase()} booking.`,
      });

    booking.bookingStatus = 'REJECTED';
    booking.rejectedAt = new Date();
    booking.rejectionReason = reason || '';
    await booking.save();

    const msg = `Your booking request at ${booking.pg.name} was declined${
      reason ? `: ${reason}` : '.'
    }`;
    await sendEmail(booking.user.email, 'Booking request declined', `<p>${msg}</p>`);
    if (booking.user.phone) await sendWhatsApp(booking.user.phone, msg);

    res.json({ success: true, message: 'Booking rejected', booking });
  } catch (err) {
    next(err);
  }
}
