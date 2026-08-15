import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const router = Router();

// Public, unauthenticated, cached — safe subset only (branding, active theme,
// navigation, footer, contact, homepage copy). Consumed once by the client's
// SiteSettingsProvider and shared app-wide.
router.get('/public', getPublicSettings);

export default router;
