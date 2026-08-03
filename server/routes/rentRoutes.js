import { Router } from 'express';
import { getLedger, getReceipt } from '../controllers/rentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

router.get('/booking/:bookingId', authMiddleware, getLedger);
router.get('/invoice/:invoiceId/receipt', authMiddleware, getReceipt);

export default router;
