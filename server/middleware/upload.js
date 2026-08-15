import multer from 'multer';

// Keep files in memory — we stream the buffer straight to Cloudinary,
// so nothing ever touches disk.
const storage = multer.memoryStorage();

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per image

function fileFilter(req, file, cb) {
  if (!ALLOWED.has(file.mimetype)) {
    const err = new Error('Only JPG, PNG, WebP, or AVIF images are allowed');
    err.status = 415;
    return cb(err);
  }
  cb(null, true);
}

const base = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES, files: 8 },
});

// Owner PG gallery: up to 8 images under the field name "images".
export const uploadPgImages = base.array('images', 8);

// User verification: exactly one live selfie under "photo".
export const uploadVerificationPhoto = base.single('photo');

// Site branding: a single logo/favicon/etc. image under "image".
export const uploadSettingsImage = base.single('image');

// Translate multer's own errors into clean JSON instead of a 500.
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const map = {
      LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller',
      LIMIT_FILE_COUNT: 'You can upload up to 8 images',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field',
    };
    return res
      .status(413)
      .json({ success: false, message: map[err.code] || 'Upload failed' });
  }
  if (err && err.status === 415) {
    return res.status(415).json({ success: false, message: err.message });
  }
  next(err);
}

export { MAX_BYTES };
