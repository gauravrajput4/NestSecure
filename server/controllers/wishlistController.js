import User from '../models/User.js';

// GET /api/wishlist — the signed-in user's saved PGs (populated)
export async function getWishlist(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select:
        'name city address price rating reviewCount genderType availableRooms images',
    });
    res.json({ success: true, data: user?.wishlist || [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/wishlist/:pgId/toggle — add if absent, remove if present
export async function toggleWishlist(req, res, next) {
  try {
    const { pgId } = req.params;
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex((id) => id.toString() === pgId);

    let saved;
    if (idx === -1) {
      user.wishlist.push(pgId);
      saved = true;
    } else {
      user.wishlist.splice(idx, 1);
      saved = false;
    }
    await user.save();

    res.json({
      success: true,
      saved,
      wishlist: user.wishlist,
      message: saved ? 'Added to wishlist' : 'Removed from wishlist',
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/wishlist/ids — lightweight list of saved PG ids (for hydrating hearts)
export async function getWishlistIds(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select('wishlist');
    res.json({ success: true, data: user?.wishlist || [] });
  } catch (err) {
    next(err);
  }
}
