import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPaymentOrder,
  verifyPayment,
  myPayments,
} from '../controllers/paymentController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/order',
  authMiddleware,
  [body('bookingId').notEmpty().withMessage('Booking ID required'), validate],
  createPaymentOrder
);

router.post(
  '/verify',
  authMiddleware,
  [
    body('paymentId').notEmpty().withMessage('Payment ID required'),
    body('razorpayOrderId').notEmpty(),
    body('razorpayPaymentId').notEmpty(),
    body('razorpaySignature').notEmpty(),
    validate,
  ],
  verifyPayment
);

router.get('/my', authMiddleware, myPayments);

export default router;
