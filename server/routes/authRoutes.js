import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  provisionPayout,
} from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
    validate,
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  login
);

router.get('/me', authMiddleware, getMe);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email required'), validate],
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    validate,
  ],
  resetPassword
);

router.patch(
  '/profile',
  authMiddleware,
  [
    body('phone').optional().trim(),
    body('payout.method')
      .optional()
      .isIn(['BANK', 'UPI', 'NONE'])
      .withMessage('Invalid payout method'),
    body('payout.accountHolder').optional().trim(),
    body('payout.accountNumber').optional().trim(),
    body('payout.ifsc').optional().trim().toUpperCase(),
    body('payout.upiId').optional().trim(),
    validate,
  ],
  updateProfile
);

router.post('/payout/provision', authMiddleware, provisionPayout);

export default router;
