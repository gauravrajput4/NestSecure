import { Router } from 'express';
import { body } from 'express-validator';
import authMiddleware from '../middleware/authMiddleware.js';
import validate from '../middleware/validate.js';
import {
  joinWaitlist,
  myWaitlist,
  cancelWaitlist,
} from '../controllers/waitlistController.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  [
    body('pgId').notEmpty().withMessage('PG ID required'),
    validate,
  ],
  joinWaitlist
);

router.get('/my', authMiddleware, myWaitlist);

router.post('/:id/cancel', authMiddleware, cancelWaitlist);

export default router;