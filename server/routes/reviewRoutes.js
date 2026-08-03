import { Router } from 'express';
import { body } from 'express-validator';
import { addReview, getReviews } from '../controllers/reviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  [
    body('pgId').notEmpty().withMessage('PG ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5'),
    validate,
  ],
  addReview
);

router.get('/:pgId', getReviews);

export default router;
