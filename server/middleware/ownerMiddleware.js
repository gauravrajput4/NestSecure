/**
 * Restricts a route to OWNER role. Must run after authMiddleware.
 */
export default function ownerMiddleware(req, res, next) {
  if (req.user?.role !== 'OWNER') {
    return res
      .status(403)
      .json({ success: false, message: 'Owner access required' });
  }
  next();
}
