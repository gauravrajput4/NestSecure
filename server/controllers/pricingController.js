import PG from '../models/PG.js';
import Booking from '../models/Booking.js';

// GET /api/pricing/suggest — suggest optimal rent for a PG/room
export async function suggestPricing(req, res, next) {
  try {
    const { pgId, sharingType, amenities } = req.query;

    if (!pgId) {
      return res.status(400).json({ success: false, message: 'PG ID required' });
    }

    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    // 1. Find comparable PGs in same city (exclude current PG)
    const comparables = await PG.find({
      _id: { $ne: pgId },
      city: new RegExp(`^${pg.city}$`, 'i'),
      'rooms.0': { $exists: true }, // only room-level PGs
    }).select('rooms price facilities rating city');

    // 2. Extract room-level comparables matching sharing type if provided
    let roomData = [];
    for (const cpg of comparables) {
      if (cpg.rooms && cpg.rooms.length > 0) {
        for (const room of cpg.rooms) {
          if (
            !sharingType ||
            room.sharingType === sharingType
          ) {
            roomData.push({
              rent: room.rent,
              deposit: room.deposit,
              sharingType: room.sharingType,
              totalBeds: room.totalBeds,
              amenities: cpg.facilities || [],
              rating: cpg.rating || 0,
            });
          }
        }
      }
    }

    // 3. Compute market stats
    let marketStats = {
      sampleSize: 0,
      minRent: 0,
      maxRent: 0,
      avgRent: 0,
      medianRent: 0,
      p25Rent: 0,
      p75Rent: 0,
    };

    if (roomData.length > 0) {
      const rents = roomData.map((r) => r.rent).sort((a, b) => a - b);
      const sum = rents.reduce((s, r) => s + r, 0);
      marketStats = {
        sampleSize: rents.length,
        minRent: rents[0],
        maxRent: rents[rents.length - 1],
        avgRent: Math.round(sum / rents.length),
        medianRent: rents[Math.floor(rents.length / 2)],
        p25Rent: rents[Math.floor(rents.length * 0.25)] || rents[0],
        p75Rent: rents[Math.floor(rents.length * 0.75)] || rents[rents.length - 1],
      };
    }

    // 4. Factor in PG's own qualities
    const ownAmenities = new Set((pg.facilities || []).map((a) => a.toLowerCase()));
    const amenityBonusMap = {
      ac: 1000,
      wifi: 200,
      food: 800,
      laundry: 300,
      'power backup': 200,
      gym: 500,
      parking: 300,
      cctv: 200,
    };
    let amenityBonus = 0;
    for (const [key, value] of Object.entries(amenityBonusMap)) {
      if (ownAmenities.has(key)) amenityBonus += value;
    }

    // 5. Factor in rating vs market
    const marketAvgRating =
      roomData.length > 0
        ? roomData.reduce((s, r) => s + r.rating, 0) / roomData.length
        : 4;
    const ratingDelta = (pg.rating || 4) - marketAvgRating;
    const ratingMultiplier = 1 + (ratingDelta * 0.05); // ±5% per rating point

    // 6. Factor in own occupancy (high demand = can charge more)
    const occupancyRate =
      pg.totalRooms > 0
        ? (pg.totalRooms - pg.availableRooms) / pg.totalRooms
        : 0;
    let occupancyMultiplier = 1;
    if (occupancyRate > 0.9) occupancyMultiplier = 1.1; // 90%+ occupied, +10%
    else if (occupancyRate > 0.7) occupancyMultiplier = 1.05; // 70%+ occupied, +5%
    else if (occupancyRate < 0.3) occupancyMultiplier = 0.9; // <30% occupied, -10%
    else if (occupancyRate < 0.5) occupancyMultiplier = 0.95; // <50% occupied, -5%

    // 7. Compute recommended rent
    let recommendedRent = marketStats.avgRent || 5000; // fallback
    let confidence = 'low';
    if (marketStats.sampleSize >= 5) confidence = 'high';
    else if (marketStats.sampleSize >= 2) confidence = 'medium';

    if (marketStats.sampleSize > 0) {
      // Base: market average, adjusted by amenities + rating + occupancy
      recommendedRent = Math.round(
        marketStats.avgRent * ratingMultiplier * occupancyMultiplier + amenityBonus / 2
      );
    }

    // 8. Compute price range
    const priceRange = {
      budget: Math.round((marketStats.p25Rent || recommendedRent * 0.85) + amenityBonus / 2),
      recommended: recommendedRent,
      premium: Math.round((marketStats.p75Rent || recommendedRent * 1.15) + amenityBonus / 2),
    };

    // 9. Demand analysis
    const bookingCount = await Booking.countDocuments({
      pg: pgId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    const demand =
      bookingCount >= 10 ? 'high' : bookingCount >= 3 ? 'medium' : 'low';

    // 10. Insights
    const insights = [];
    if (occupancyRate > 0.9) {
      insights.push({
        type: 'positive',
        text: `Your occupancy is ${Math.round(occupancyRate * 100)}% — strong demand. You can charge a premium.`,
      });
    } else if (occupancyRate < 0.4) {
      insights.push({
        type: 'warning',
        text: `Low occupancy (${Math.round(occupancyRate * 100)}%). Consider competitive pricing to attract tenants.`,
      });
    }
    if (marketStats.sampleSize > 0 && recommendedRent > pg.price * 1.15) {
      insights.push({
        type: 'opportunity',
        text: `Your current price (₹${pg.price}) is below market rate. You could increase rent by ₹${recommendedRent - pg.price}.`,
      });
    }
    if (amenityBonus > 1000) {
      insights.push({
        type: 'positive',
        text: `Your amenities (AC, Food, etc.) justify a premium of ~₹${Math.round(amenityBonus / 2)}.`,
      });
    }

    res.json({
      success: true,
      data: {
        city: pg.city,
        sharingType: sharingType || 'ALL',
        currentRent: pg.price,
        recommendedRent,
        priceRange,
        marketStats,
        demand,
        recentBookings: bookingCount,
        occupancyRate: Math.round(occupancyRate * 100),
        insights,
        confidence,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pricing/market-overview — overall market stats for owner's city
export async function getMarketOverview(req, res, next) {
  try {
    const ownerId = req.user._id;
    const ownerPGs = await PG.find({ owner: ownerId });

    if (ownerPGs.length === 0) {
      return res.json({ success: true, data: { message: 'No PGs listed yet' } });
    }

    // Group by city
    const cities = {};
    for (const pg of ownerPGs) {
      const key = pg.city.toLowerCase();
      if (!cities[key]) cities[key] = { city: pg.city, pgCount: 0, rooms: [] };
      cities[key].pgCount++;
      if (pg.rooms) {
        for (const room of pg.rooms) {
          cities[key].rooms.push({ rent: room.rent, sharingType: room.sharingType });
        }
      }
    }

    const overview = Object.values(cities).map((c) => {
      const rents = c.rooms.map((r) => r.rent);
      if (rents.length === 0) return { ...c, stats: null };
      const sorted = [...rents].sort((a, b) => a - b);
      return {
        city: c.city,
        pgCount: c.pgCount,
        roomCount: rents.length,
        stats: {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: Math.round(rents.reduce((s, r) => s + r, 0) / rents.length),
          median: sorted[Math.floor(sorted.length / 2)],
        },
      };
    });

    res.json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}