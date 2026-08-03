import { Router } from 'express';
import {
  getWishlist,
  getWishlistIds,
  toggleWishlist,
} from '../controllers/wishlistController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, getWishlist);
router.get('/ids', authMiddleware, getWishlistIds);
router.post('/:pgId/toggle', authMiddleware, toggleWishlist);

export default router;
