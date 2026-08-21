import Waitlist from '../models/Waitlist.js';
import PG from '../models/PG.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import {
  createInteractiveEmail,
  createWhatsAppMessage,
  sendEmail,
  sendWhatsApp,
  notifyChannels,
} from '../utils/notify.js';

// POST /api/waitlist — join waitlist for a room/PG
export async function joinWaitlist(req, res, next) {
  try {
    const { pgId, roomId, sharingType, maxOccupants = 1 } = req.body;
    const userId = req.user._id;

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    // Check if user already has active waitlist for this PG/room
    const existing = await Waitlist.findOne({
      user: userId,
      pg: pgId,
      ...(roomId ? { room: roomId } : {}),
      status: { $in: ['WAITING', 'NOTIFIED'] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already on the waitlist for this room/PG',
      });
    }

    // Check if user has active booking
    const activeBooking = await Booking.findOne({
      user: userId,
      pg: pgId,
      bookingStatus: { $in: ['REQUESTED', 'PENDING', 'CONFIRMED'] },
    });
    if (activeBooking) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active booking at this PG',
      });
    }

    // Gender restriction check
    if (pg.genderType !== 'BOTH') {
      const GENDER_MAP = { MALE: 'BOYS_ONLY', FEMALE: 'GIRLS_ONLY' };
      const required = GENDER_MAP[req.user.gender];
      if (required !== pg.genderType) {
        return res.status(403).json({
          success: false,
          message: `This PG is ${pg.genderType.replace('_', ' ').toLowerCase()}.`,
        });
      }
    }

    // Validate room if provided
    if (roomId) {
      const room = pg.rooms.id(roomId);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Room not found' });
      }
      if (sharingType && room.sharingType !== sharingType) {
        return res.status(400).json({ success: false, message: 'Sharing type mismatch' });
      }
      if (maxOccupants > room.totalBeds) {
        return res.status(400).json({
          success: false,
          message: `Max occupants cannot exceed room capacity (${room.totalBeds})`,
        });
      }
    }

    const waitlist = await Waitlist.create({
      user: userId,
      pg: pgId,
      room: roomId || null,
      sharingType: sharingType || '',
      maxOccupants,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.status(201).json({
      success: true,
      data: waitlist,
      message: 'Added to waitlist. You will be notified when a room becomes available.',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/waitlist/my — user's waitlist entries
export async function myWaitlist(req, res, next) {
  try {
    const entries = await Waitlist.find({ user: req.user._id })
      .populate('pg', 'name city address images')
      .populate('room', 'label sharingType totalBeds rent deposit')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
}

// POST /api/waitlist/:id/cancel — cancel waitlist entry
export async function cancelWaitlist(req, res, next) {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Waitlist entry not found' });
    }
    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (entry.status !== 'WAITING' && entry.status !== 'NOTIFIED') {
      return res.status(400).json({ success: false, message: 'Cannot cancel this entry' });
    }

    entry.status = 'CANCELLED';
    entry.cancelledAt = new Date();
    await entry.save();

    res.json({ success: true, message: 'Waitlist entry cancelled' });
  } catch (err) {
    next(err);
  }
}

// Internal: notify next user on waitlist when room becomes available
export async function notifyWaitlist(roomId, pgId) {
  try {
    // Build query for waiting users: either specific room or any room in PG
    const roomQuery = roomId ? { room: roomId } : { room: null };
    const waitlist = await Waitlist.find({
      pg: pgId,
      ...roomQuery,
      status: 'WAITING',
    })
      .populate('user', 'name email phone notifications')
      .sort({ createdAt: 1 });

    if (waitlist.length === 0) return;

    // Notify first user
    const nextUser = waitlist[0];
    nextUser.status = 'NOTIFIED';
    nextUser.notifiedAt = new Date();
    // Expire notification after 24 hours
    nextUser.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await nextUser.save();

    const pg = await PG.findById(pgId);
    const room = roomId ? pg?.rooms?.id(roomId) : null;

    const msg = `A room (${room?.label || 'a room'}) at ${pg?.name} is now available! Book within 24 hours to secure it.`;
    const channels = notifyChannels(nextUser.user, 'bookingUpdates');

    if (channels.email && nextUser.user.email) {
      await sendEmail(
        nextUser.user.email,
        'Room Available - Waitlist Notification',
        createInteractiveEmail({
          userName: nextUser.user.name,
          subject: 'Room Available - Waitlist',
          title: 'Your Waitlisted Room is Available!',
          message: msg,
          details: [
            { label: 'PG', value: pg?.name },
            { label: 'Room', value: room?.label },
            { label: 'Expires', value: '24 hours' },
          ],
          ctaText: 'Book Now',
          ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pg/${pgId}`,
        })
      );
    }
    if (channels.whatsapp && nextUser.user.phone) {
      await sendWhatsApp(
        nextUser.user.phone,
        createWhatsAppMessage({
          userName: nextUser.user.name,
          message: msg,
          ctaUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pg/${pgId}`,
        })
      );
    }

    // If there are more users, notify them about their position
    for (let i = 1; i < waitlist.length; i++) {
      const w = waitlist[i];
      w.notes = `Position in queue: ${i + 1}`;
      await w.save();
    }
  } catch (err) {
    console.error('Waitlist notification failed:', err);
  }
}

// Internal: check expired notifications and move to next user
export async function processExpiredWaitlists() {
  try {
    const expired = await Waitlist.find({
      status: 'NOTIFIED',
      expiresAt: { $lt: new Date() },
    });
    for (const entry of expired) {
      entry.status = 'EXPIRED';
      await entry.save();
      // Notify next in line
      await notifyWaitlist(entry.room, entry.pg);
    }
  } catch (err) {
    console.error('Expired waitlist processing failed:', err);
  }
}