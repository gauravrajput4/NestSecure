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
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';

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

export default router;
