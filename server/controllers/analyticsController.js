import PG from '../models/PG.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

// Get the owner IDs PGs once for reuse
async function getOwnerPGsAndIds(ownerId) {
  const pgs = await PG.find({ owner: ownerId });
  return { pgs, pgIds: pgs.map((p) => p._id) };
}

// GET /api/owner/analytics/trends — occupancy trends over last N months
export async function getOccupancyTrends(req, res, next) {
  try {
    const { months = 6 } = req.query;
    const monthsNum = Math.min(24, Math.max(1, Number(months) || 6));
    const { pgIds } = await getOwnerPGsAndIds(req.user._id);

    const trends = [];
    const now = new Date();

    for (let i = monthsNum - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      // Bookings confirmed during or active in this month
      const activeBookings = await Booking.find({
        pg: { $in: pgIds },
        bookingStatus: { $in: ['CONFIRMED'] },
        startDate: { $lte: monthEnd },
        $or: [{ cancelledAt: { $exists: false } }, { cancelledAt: { $gt: monthEnd } }],
      });

      const totalRooms = await PG.aggregate([
        { $match: { _id: { $in: pgIds } } },
        { $group: { _id: null, total: { $sum: '$totalRooms' } } },
      ]);
      const totalRoomsCount = totalRooms[0]?.total || 0;

      const occupiedRooms = activeBookings.length;
      const occupancyRate =
        totalRoomsCount > 0 ? Math.round((occupiedRooms / totalRoomsCount) * 100) : 0;

      // Revenue for this month (booking payments + rent payments during the month)
      const revenueAgg = await Payment.aggregate([
        {
          $match: {
            user: { $exists: true },
            status: 'PAID',
            type: { $in: ['BOOKING', 'RENT'] },
            createdAt: { $gte: monthStart, $lte: monthEnd },
            booking: { $exists: true },
          },
        },
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'bookingDoc',
          },
        },
        { $unwind: '$bookingDoc' },
        { $match: { 'bookingDoc.pg': { $in: pgIds } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const revenue = revenueAgg[0]?.total || 0;

      trends.push({
        month: monthStart.toISOString().slice(0, 7),
        monthLabel: monthStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        totalRooms: totalRoomsCount,
        occupiedRooms,
        occupancyRate,
        revenue,
      });
    }

    res.json({ success: true, data: trends });
  } catch (err) {
    next(err);
  }
}

// GET /api/owner/analytics/revenue — detailed revenue breakdown
export async function getRevenueStats(req, res, next) {
  try {
    const { pgIds } = await getOwnerPGsAndIds(req.user._id);

    // Lifetime revenue
    const lifetimeAgg = await Payment.aggregate([
      {
        $match: { status: 'PAID', type: { $in: ['BOOKING', 'RENT'] }, booking: { $exists: true } },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      { $match: { 'bookingDoc.pg': { $in: pgIds } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const lifetime = {
      bookings: lifetimeAgg.find((x) => x._id === 'BOOKING')?.total || 0,
      rent: lifetimeAgg.find((x) => x._id === 'RENT')?.total || 0,
      bookingsCount: lifetimeAgg.find((x) => x._id === 'BOOKING')?.count || 0,
      rentCount: lifetimeAgg.find((x) => x._id === 'RENT')?.count || 0,
    };
    lifetime.total = lifetime.bookings + lifetime.rent;

    // This month vs last month
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    async function revenueBetween(start, end) {
      const agg = await Payment.aggregate([
        {
          $match: {
            status: 'PAID',
            type: { $in: ['BOOKING', 'RENT'] },
            createdAt: { $gte: start, $lte: end },
            booking: { $exists: true },
          },
        },
        {
          $lookup: {
            from: 'bookings',
            localField: 'booking',
            foreignField: '_id',
            as: 'bookingDoc',
          },
        },
        { $unwind: '$bookingDoc' },
        { $match: { 'bookingDoc.pg': { $in: pgIds } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return agg[0]?.total || 0;
    }

    const thisMonth = await revenueBetween(thisMonthStart, now);
    const lastMonth = await revenueBetween(lastMonthStart, lastMonthEnd);
    const monthOverMonth =
      lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    // Refunds
    const refundsAgg = await Payment.aggregate([
      {
        $match: { status: 'REFUNDED', booking: { $exists: true } },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      { $match: { 'bookingDoc.pg': { $in: pgIds } } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);
    const totalRefunded = refundsAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        lifetime,
        thisMonth,
        lastMonth,
        monthOverMonth,
        totalRefunded,
        netRevenue: lifetime.total - totalRefunded,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/owner/analytics/turnover — tenant turnover metrics
export async function getTenantTurnover(req, res, next) {
  try {
    const { pgIds } = await getOwnerPGsAndIds(req.user._id);
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // New tenants this month
    const newThisMonth = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
      startDate: { $gte: monthAgo },
    });

    // Cancellations this month
    const cancelledThisMonth = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CANCELLED',
      cancelledAt: { $gte: monthAgo },
    });

    // Active tenants
    const activeTenants = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
    });

    // New this year
    const newThisYear = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
      startDate: { $gte: yearAgo },
    });

    // Cancelled this year
    const cancelledThisYear = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CANCELLED',
      cancelledAt: { $gte: yearAgo },
    });

    // Average stay duration (for cancelled bookings)
    const completedBookings = await Booking.find({
      pg: { $in: pgIds },
      bookingStatus: 'CANCELLED',
      cancelledAt: { $exists: true },
    }).select('startDate cancelledAt');

    let avgStayDays = 0;
    if (completedBookings.length > 0) {
      const totalDays = completedBookings.reduce((sum, b) => {
        const days = (new Date(b.cancelledAt) - new Date(b.startDate)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgStayDays = Math.round(totalDays / completedBookings.length);
    }

    const turnoverRate =
      activeTenants > 0
        ? Math.round((cancelledThisMonth / activeTenants) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        activeTenants,
        newThisMonth,
        cancelledThisMonth,
        netGrowth: newThisMonth - cancelledThisMonth,
        newThisYear,
        cancelledThisYear,
        avgStayDays,
        turnoverRate,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/owner/analytics/rent-roll — current rent roll with payment status
export async function getRentRoll(req, res, next) {
  try {
    const { pgIds } = await getOwnerPGsAndIds(req.user._id);

    const bookings = await Booking.find({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
    })
      .populate('user', 'name email phone')
      .populate('pg', 'name city')
      .sort({ nextDueDate: 1 });

    const now = new Date();
    const rentRoll = bookings.map((b) => ({
      bookingId: b._id,
      tenant: b.user?.name,
      tenantEmail: b.user?.email,
      tenantPhone: b.user?.phone,
      pg: b.pg?.name,
      roomLabel: b.roomLabel,
      occupants: b.occupants,
      monthlyRent: b.monthlyRent,
      securityDeposit: b.securityDeposit,
      nextDueDate: b.nextDueDate,
      daysUntilDue: Math.ceil((new Date(b.nextDueDate) - now) / (1000 * 60 * 60 * 24)),
      rentStatus: b.rentStatus,
      lastRentPaidOn: b.lastRentPaidOn,
      startDate: b.startDate,
    }));

    const summary = {
      totalTenants: rentRoll.length,
      totalMonthlyRent: rentRoll.reduce((s, t) => s + Number(t.monthlyRent || 0), 0),
      totalDepositsHeld: rentRoll.reduce((s, t) => s + Number(t.securityDeposit || 0), 0),
      overdue: rentRoll.filter((t) => t.rentStatus === 'OVERDUE').length,
      dueSoon: rentRoll.filter((t) => t.daysUntilDue <= 7 && t.daysUntilDue >= 0).length,
    };

    res.json({ success: true, data: { summary, entries: rentRoll } });
  } catch (err) {
    next(err);
  }
}

// GET /api/owner/analytics/summary — combined snapshot for dashboard
export async function getAnalyticsSummary(req, res, next) {
  try {
    const ownerId = req.user._id;
    const pgs = await PG.find({ owner: ownerId });
    const pgIds = pgs.map((p) => p._id);

    const totalRooms = pgs.reduce((s, p) => s + p.totalRooms, 0);
    const availableRooms = pgs.reduce((s, p) => s + p.availableRooms, 0);
    const occupiedRooms = totalRooms - availableRooms;

    // This month revenue
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'PAID',
          type: { $in: ['BOOKING', 'RENT'] },
          createdAt: { $gte: thisMonthStart },
          booking: { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'bookings',
          localField: 'booking',
          foreignField: '_id',
          as: 'bookingDoc',
        },
      },
      { $unwind: '$bookingDoc' },
      { $match: { 'bookingDoc.pg': { $in: pgIds } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Expected monthly rent (from active bookings)
    const activeBookings = await Booking.find({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
    }).select('monthlyRent');

    const expectedMonthlyRent = activeBookings.reduce(
      (s, b) => s + Number(b.monthlyRent || 0),
      0
    );

    // Pending rent (DUE status)
    const dueBookings = activeBookings.length;
    const overdueBookings = await Booking.countDocuments({
      pg: { $in: pgIds },
      bookingStatus: 'CONFIRMED',
      rentStatus: { $in: ['DUE', 'OVERDUE'] },
    });

    res.json({
      success: true,
      data: {
        totalPGs: pgs.length,
        totalRooms,
        occupiedRooms,
        availableRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        expectedMonthlyRent,
        activeTenants: activeBookings.length,
        dueBookings,
        overdueBookings,
      },
    });
  } catch (err) {
    next(err);
  }
}