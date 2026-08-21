import { Router } from 'express';
import {
  getSettings,
  updateNotifications,
  updatePrivacy,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  exportData,
  deleteAccount,
} from '../controllers/userSettingsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// All user-account settings are private → every route requires auth.
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/notifications', updateNotifications);
router.put('/privacy', updatePrivacy);
router.post('/payment-methods', addPaymentMethod);
router.put('/payment-methods/:id/default', setDefaultPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);
router.get('/data', exportData);
router.post('/delete-account', deleteAccount);

export default router;