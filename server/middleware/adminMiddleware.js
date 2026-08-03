/**
 * Restricts a route to ADMIN role. Must run after authMiddleware.
 */
export default function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ success: false, message: 'Admin access required' });
  }
  next();
}
