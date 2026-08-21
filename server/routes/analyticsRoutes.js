import { Router } from 'express';
import {
  getOccupancyTrends,
  getRevenueStats,
  getTenantTurnover,
  getRentRoll,
  getAnalyticsSummary,
} from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import ownerMiddleware from '../middleware/ownerMiddleware.js';

const router = Router();

router.get('/summary', authMiddleware, ownerMiddleware, getAnalyticsSummary);
router.get('/trends', authMiddleware, ownerMiddleware, getOccupancyTrends);
router.get('/revenue', authMiddleware, ownerMiddleware, getRevenueStats);
router.get('/turnover', authMiddleware, ownerMiddleware, getTenantTurnover);
router.get('/rent-roll', authMiddleware, ownerMiddleware, getRentRoll);

export default router;