import { Router } from 'express';
import {
  uploadPgImages,
  removePgImage,
  uploadVerification,
} from '../controllers/uploadController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import ownerMiddleware from '../middleware/ownerMiddleware.js';
import {
  uploadPgImages as multerPgImages,
  uploadVerificationPhoto,
  handleUploadError,
} from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Owner PG gallery
router.post(
  '/pg/:id/images',
  authMiddleware,
  ownerMiddleware,
  uploadLimiter,
  multerPgImages,
  handleUploadError,
  uploadPgImages
);

router.delete('/pg/:id/images', authMiddleware, ownerMiddleware, removePgImage);

// User identity verification (live selfie)
router.post(
  '/verify',
  authMiddleware,
  uploadLimiter,
  uploadVerificationPhoto,
  handleUploadError,
  uploadVerification
);

export default router;
