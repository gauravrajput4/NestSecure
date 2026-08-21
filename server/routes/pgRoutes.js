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

// Room-level listings send rooms[] and derive aggregates server-side; legacy
// listings still require totalRooms / availableRooms on the body.
const hasRooms = (_value, { req }) =>
  Array.isArray(req.body.rooms) && req.body.rooms.length > 0;

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
    body('totalRooms')
      .if((value, meta) => !hasRooms(value, meta))
      .isInt({ min: 1 })
      .withMessage('Total rooms >= 1'),
    body('availableRooms')
      .if((value, meta) => !hasRooms(value, meta))
      .isInt({ min: 0 })
      .withMessage('Available rooms >= 0'),
    body('rooms')
      .optional()
      .isArray()
      .withMessage('Rooms must be an array'),
    body('rooms.*.label')
      .if(hasRooms)
      .trim()
      .notEmpty()
      .withMessage('Each room needs a label'),
    body('rooms.*.sharingType')
      .if(hasRooms)
      .isIn(['SINGLE', 'DOUBLE', 'TRIPLE'])
      .withMessage('Invalid sharing type'),
    body('rooms.*.rent')
      .if(hasRooms)
      .isFloat({ min: 0 })
      .withMessage('Each room needs a rent >= 0'),
    body('rooms.*.deposit')
      .optional({ values: 'null' })
      .isFloat({ min: 0 })
      .withMessage('Deposit must be >= 0'),
    body('rooms.*.totalBeds')
      .if(hasRooms)
      .isInt({ min: 1 })
      .withMessage('Each room needs at least 1 bed'),
    validate,
  ],
  createPG
);

router.put('/:id', authMiddleware, ownerMiddleware, updatePG);
router.delete('/:id', authMiddleware, ownerMiddleware, deletePG);

export default router;
