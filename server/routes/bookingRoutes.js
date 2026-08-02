import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  myBookings,
  cancelBooking,
  refundPreview,
} from '../controllers/bookingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  [
    body('pgId').notEmpty().withMessage('PG ID required'),
    validate,
  ],
  createBooking
);

router.get('/my', authMiddleware, myBookings);

router.get('/:bookingId/refund-preview', authMiddleware, refundPreview);

router.post(
  '/cancel',
  authMiddleware,
  [body('bookingId').notEmpty().withMessage('Booking ID required'), validate],
  cancelBooking
);

export default router;
