import { Router } from 'express';
import {
  getStats,
  listUsers,
  toggleBan,
  setVerification,
  listPGs,
  deletePG,
  listBookings,
  listReviews,
  deleteReview,
} from '../controllers/adminController.js';
import {
  getAdminSettings,
  updateSection,
  resetSection,
  createTheme,
  updateTheme,
  deleteTheme,
  activateTheme,
  uploadBrandingImage,
  removeBrandingImage,
  getAuditLog,
} from '../controllers/settingsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import { uploadSettingsImage, handleUploadError } from '../middleware/upload.js';

const router = Router();

router.get('/stats', authMiddleware, adminMiddleware, getStats);
router.get('/users', authMiddleware, adminMiddleware, listUsers);
router.patch('/users/:userId/ban', authMiddleware, adminMiddleware, toggleBan);
router.patch(
  '/users/:userId/verify',
  authMiddleware,
  adminMiddleware,
  setVerification
);
router.get('/pgs', authMiddleware, adminMiddleware, listPGs);
router.delete('/pgs/:pgId', authMiddleware, adminMiddleware, deletePG);
router.get('/bookings', authMiddleware, adminMiddleware, listBookings);
router.get('/reviews', authMiddleware, adminMiddleware, listReviews);
router.delete(
  '/reviews/:reviewId',
  authMiddleware,
  adminMiddleware,
  deleteReview
);

// ── Site Settings (admin-only) ────────────────────────────────────────────
// All gated by authMiddleware + adminMiddleware, matching the convention above.
const admin = [authMiddleware, adminMiddleware];

router.get('/settings', admin, getAdminSettings);
router.get('/settings/audit', admin, getAuditLog);
router.patch('/settings/:section', admin, updateSection);
router.post('/settings/reset/:section', admin, resetSection);
router.post(
  '/settings/branding/:slot',
  admin,
  uploadSettingsImage,
  handleUploadError,
  uploadBrandingImage
);
router.delete('/settings/branding/:slot', admin, removeBrandingImage);

router.post('/themes', admin, createTheme);
router.patch('/themes/:id', admin, updateTheme);
router.delete('/themes/:id', admin, deleteTheme);
router.post('/themes/:id/activate', admin, activateTheme);

export default router;
