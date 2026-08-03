import Review from '../models/Review.js';
import PG from '../models/PG.js';

async function recomputeRating(pgId) {
  const stats = await Review.aggregate([
    { $match: { pg: (await import('mongoose')).default.Types.ObjectId.createFromHexString(String(pgId)) } },
    { $group: { _id: '$pg', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await PG.findByIdAndUpdate(pgId, {
    rating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

// POST /api/review — add or update a review
export async function addReview(req, res, next) {
  try {
    const { pgId, rating, comment } = req.body;
    const pg = await PG.findById(pgId);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    const review = await Review.findOneAndUpdate(
      { pg: pgId, user: req.user._id },
      { rating, comment },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await recomputeRating(pgId);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

// GET /api/review/:pgId — list reviews for a PG
export async function getReviews(req, res, next) {
  try {
    const reviews = await Review.find({ pg: req.params.pgId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    next(err);
  }
}
