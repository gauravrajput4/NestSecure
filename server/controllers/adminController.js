import User from '../models/User.js';
import PG from '../models/PG.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';

// GET /api/admin/stats — platform-wide moderation dashboard numbers
export async function getStats(req, res, next) {
  try {
    const [
      totalUsers,
      owners,
      bannedUsers,
      pendingVerifications,
      totalPGs,
      totalBookings,
      confirmedBookings,
      revenueAgg,
      refundAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'OWNER' }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ verificationStatus: 'PENDING' }),
      PG.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
      Payment.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'REFUNDED' } },
        { $group: { _id: null, total: { $sum: '$refundAmount' } } },
      ]),
    ]);

    // Bookings grouped by status for a quick health snapshot.
    const statusAgg = await Booking.aggregate([
      { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    ]);
    const bookingsByStatus = statusAgg.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          owners,
          banned: bannedUsers,
          pendingVerifications,
        },
        pgs: { total: totalPGs },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          byStatus: bookingsByStatus,
        },
        revenue: {
          gross: revenueAgg[0]?.total || 0,
          refunded: refundAgg[0]?.total || 0,
          net: (revenueAgg[0]?.total || 0) - (refundAgg[0]?.total || 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users — list users (optional ?role= & ?search=)
export async function listUsers(req, res, next) {
  try {
    const { role, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:userId/ban — toggle a user's ban state
export async function toggleBan(req, res, next) {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'ADMIN') {
      return res
        .status(403)
        .json({ success: false, message: 'Cannot ban an admin account' });
    }
    user.isBanned = !user.isBanned;
    await user.save();
    res.json({
      success: true,
      message: user.isBanned ? 'User banned' : 'User reinstated',
      data: { _id: user._id, isBanned: user.isBanned },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:userId/verify — manually verify/unverify a tenant
export async function setVerification(req, res, next) {
  try {
    const { userId } = req.params;
    const { status } = req.body; // VERIFIED | UNVERIFIED
    if (!['VERIFIED', 'UNVERIFIED'].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid verification status' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.verificationStatus = status;
    user.verifiedAt = status === 'VERIFIED' ? new Date() : undefined;
    await user.save();
    res.json({
      success: true,
      message: `User marked ${status.toLowerCase()}`,
      data: { _id: user._id, verificationStatus: user.verificationStatus },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/pgs — list every PG with owner info
export async function listPGs(req, res, next) {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
      ];
    }
    const pgs = await PG.find(filter)
      .populate('owner', 'name email isBanned')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: pgs.length, data: pgs });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/pgs/:pgId — take down a listing (moderation)
export async function deletePG(req, res, next) {
  try {
    const pg = await PG.findById(req.params.pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    await pg.deleteOne();
    res.json({ success: true, message: 'PG listing removed' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/bookings — recent bookings across the platform (dispute view)
export async function listBookings(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.bookingStatus = status;
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('pg', 'name city')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/reviews — moderation of reviews
export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find()
      .populate('user', 'name email')
      .populate('pg', 'name city')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/reviews/:reviewId — remove an abusive review
export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: 'Review not found' });
    }
    const pgId = review.pg;
    await review.deleteOne();

    // Recompute the PG's rating aggregate after removal.
    const remaining = await Review.find({ pg: pgId });
    const pg = await PG.findById(pgId);
    if (pg) {
      pg.reviewCount = remaining.length;
      pg.rating = remaining.length
        ? remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length
        : 0;
      await pg.save();
    }

    res.json({ success: true, message: 'Review removed' });
  } catch (err) {
    next(err);
  }
}
