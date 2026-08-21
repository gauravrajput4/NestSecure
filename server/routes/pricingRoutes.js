import { Router } from 'express';
import {
  suggestPricing,
  getMarketOverview,
} from '../controllers/pricingController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import ownerMiddleware from '../middleware/ownerMiddleware.js';

const router = Router();

router.get('/suggest', authMiddleware, ownerMiddleware, suggestPricing);
router.get('/market-overview', authMiddleware, ownerMiddleware, getMarketOverview);

export default router;