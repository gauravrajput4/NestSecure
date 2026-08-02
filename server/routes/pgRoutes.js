import { Router } from 'express';
import { body } from 'express-validator';
import {
  listPGs,
  getPGById,
  createPG,
  updatePG,
  deletePG,
} from '../controllers/pgController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import ownerMiddleware from '../middleware/ownerMiddleware.js';
import validate from '../middleware/validate.js';

const router = Router();

// Public
router.get('/', listPGs);
router.get('/:id', getPGById);

// Owner only
router.post(
  '/',
  authMiddleware,
  ownerMiddleware,
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be >= 0'),
    body('address').notEmpty().withMessage('Address required'),
    body('city').notEmpty().withMessage('City required'),
    body('latitude').isFloat().withMessage('Latitude required'),
    body('longitude').isFloat().withMessage('Longitude required'),
    body('totalRooms').isInt({ min: 1 }).withMessage('Total rooms >= 1'),
    body('availableRooms').isInt({ min: 0 }).withMessage('Available rooms >= 0'),
    validate,
  ],
  createPG
);

router.put('/:id', authMiddleware, ownerMiddleware, updatePG);
router.delete('/:id', authMiddleware, ownerMiddleware, deletePG);

export default router;
