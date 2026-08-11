import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

// Cloudinary is optional. When keys are absent we run in DEMO mode:
// uploads resolve to deterministic placeholder URLs so the whole flow
// (owner adds PG photos, user uploads a verification selfie) still works
// end-to-end without a paid account.
export const cloudinaryEnabled = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '⚠ Cloudinary keys not set — image uploads run in DEMO mode (placeholder URLs).'
  );
}

/**
 * Upload a single in-memory file buffer to Cloudinary.
 * @param {Buffer} buffer  raw file bytes (from multer memoryStorage)
 * @param {object} opts    { folder, publicId, transformation }
 * @returns {Promise<{url:string, publicId:string, width?:number, height?:number}>}
 */
export function uploadBuffer(buffer, opts = {}) {
  const { folder = 'roomward', publicId, transformation } = opts;

  if (!cloudinaryEnabled) {
    // Deterministic placeholder keyed off byte length + time.
    const seed = `${folder}-${buffer.length}-${Date.now()}`;
    return Promise.resolve({
      url: `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/800`,
      publicId: `demo/${seed}`,
      width: 1200,
      height: 800,
      demo: true,
    });
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation,
        overwrite: true,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    stream.end(buffer);
  });
}

/** Remove an image by its Cloudinary public id (no-op in demo mode). */
export async function destroyImage(publicId) {
  if (!cloudinaryEnabled || !publicId || publicId.startsWith('demo/')) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary destroy failed:', err.message);
  }
}

export default cloudinary;
