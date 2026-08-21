import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getCachedSettings } from '../utils/settingsCache.js';

// Paths that must stay reachable even in maintenance mode so that:
//  - an admin can still authenticate and reach the admin panel, and
//  - the maintenance screen can fetch branding/theme to render itself.
const ALWAYS_ALLOWED = [
  '/api/health',
  '/api/settings/public',
  '/api/auth/login',
  '/api/auth/me',
  '/api/admin', // entire admin surface (already admin-gated downstream)
  '/api/payment/webhook', // gateway callbacks carry their own signature
];

function isAllowlisted(path) {
  return ALWAYS_ALLOWED.some((p) => path === p || path.startsWith(`${p}/`));
}

// Best-effort role lookup from the Bearer token WITHOUT failing the request:
// real auth still happens in authMiddleware on protected routes. We only need
// to know whether to wave this request through the maintenance gate.
async function roleFromToken(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role');
    return user?.role || null;
  } catch {
    return null;
  }
}

// Additive gate: when maintenance is ON, non-admins get a 503 for API calls.
// Leaves all existing route logic untouched — it simply short-circuits earlier.
export default async function maintenanceMiddleware(req, res, next) {
  try {
    const settings = await getCachedSettings();
    const m = settings?.maintenance;
    const restrictionsOn = settings?.security?.enableMaintenanceRestrictions !== false;
    if (!m?.enabled || !restrictionsOn) return next();
    if (isAllowlisted(req.path)) return next();

    const role = await roleFromToken(req);
    if (role === 'ADMIN') return next();
    if (role === 'OWNER' && m.allowOwnerAccess) return next();

    return res.status(503).json({
      success: false,
      maintenance: true,
      message: m.message || 'Service temporarily unavailable for maintenance.',
      title: m.title || undefined,
      estimatedReturn: m.estimatedReturn || undefined,
    });
  } catch {
    // If the settings lookup fails, never hard-block the API.
    return next();
  }
}
