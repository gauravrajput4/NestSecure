import PG from '../models/PG.js';
import { haversineKm } from '../utils/geo.js';

// GET /api/pg — public listing with filters
export async function listPGs(req, res, next) {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      minRating,
      gender,
      availableOnly,
      lat,
      lng,
      maxDistance, // km
    } = req.query;

    const filter = {};

    if (city) filter.city = new RegExp(city, 'i');
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (gender && gender !== 'BOTH') {
      filter.genderType = { $in: [gender, 'BOTH'] };
    }
    if (availableOnly === 'true') {
      filter.availableRooms = { $gt: 0 };
    }

    // Pagination — clamp to sane bounds (default 9 per page for a 3-col grid)
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 9));
    const skip = (page - 1) * limit;
    const sort = { rating: -1, price: 1 };

    const wantsDistance = lat && lng && maxDistance;

    let data;
    let total;

    if (wantsDistance) {
      // Distance is computed post-query, so filter the full set, then page it.
      const userLat = Number(lat);
      const userLng = Number(lng);
      const maxKm = Number(maxDistance);
      const all = (await PG.find(filter).sort(sort))
        .map((pg) => ({
          ...pg.toObject(),
          distance: haversineKm(userLat, userLng, pg.latitude, pg.longitude),
        }))
        .filter((pg) => pg.distance <= maxKm)
        .sort((a, b) => a.distance - b.distance);
      total = all.length;
      data = all.slice(skip, skip + limit);
    } else {
      // DB-level pagination — count and page in parallel.
      [total, data] = await Promise.all([
        PG.countDocuments(filter),
        PG.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      ]);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      success: true,
      count: data.length,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pg/:id — public detail
export async function getPGById(req, res, next) {
  try {
    const pg = await PG.findById(req.params.id).populate('owner', 'name email phone');
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    res.json({ success: true, data: pg });
  } catch (err) {
    next(err);
  }
}

// Normalize an incoming rooms array: default isBooked to false for
// rooms that don't specify it (i.e. brand-new rooms).
function normalizeRooms(rooms) {
  if (!Array.isArray(rooms)) return rooms;
  return rooms.map((r) => ({
    ...r,
    isBooked: r.isBooked === undefined || r.isBooked === null ? false : r.isBooked,
  }));
}

// POST /api/pg — owner creates PG (auth + owner role required)
export async function createPG(req, res, next) {
  try {
    const body = { ...req.body, owner: req.user._id };
    if (Array.isArray(body.rooms) && body.rooms.length > 0) {
      body.rooms = normalizeRooms(body.rooms);
    }
    const pg = new PG(body);
    pg.syncRoomAggregates();
    await pg.save();
    res.status(201).json({ success: true, data: pg });
  } catch (err) {
    next(err);
  }
}

// PUT /api/pg/:id — owner updates PG
export async function updatePG(req, res, next) {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const body = { ...req.body };
    if (Array.isArray(body.rooms)) {
      body.rooms = normalizeRooms(body.rooms);
    }
    Object.assign(pg, body);
    pg.syncRoomAggregates();
    await pg.save();
    res.json({ success: true, data: pg });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/pg/:id — owner deletes PG
export async function deletePG(req, res, next) {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await pg.deleteOne();
    res.json({ success: true, message: 'PG deleted' });
  } catch (err) {
    next(err);
  }
}
