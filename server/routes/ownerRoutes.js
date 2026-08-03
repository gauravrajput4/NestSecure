import { Router } from 'express';
import {
  getDashboard,
  getOwnerPGs,
  getBookingRequests,
  approveBooking,
  rejectBooking,
} from '../controllers/ownerController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import ownerMiddleware from '../middleware/ownerMiddleware.js';

const router = Router();

router.get('/dashboard', authMiddleware, ownerMiddleware, getDashboard);
router.get('/pgs', authMiddleware, ownerMiddleware, getOwnerPGs);
router.get('/requests', authMiddleware, ownerMiddleware, getBookingRequests);
router.post(
  '/requests/:bookingId/approve',
  authMiddleware,
  ownerMiddleware,
  approveBooking
);
router.post(
  '/requests/:bookingId/reject',
  authMiddleware,
  ownerMiddleware,
  rejectBooking
);

export default router;
