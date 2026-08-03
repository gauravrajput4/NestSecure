import PG from '../models/PG.js';
import User from '../models/User.js';
import { uploadBuffer, destroyImage } from '../utils/cloudinary.js';

// POST /api/upload/pg/:id/images  (owner only, multipart field "images")
// Appends uploaded images to the PG gallery, capped at 8 total.
export async function uploadPgImages(req, res, next) {
  try {
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only edit your own PGs' });
    }
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Choose at least one image to upload' });
    }
    if (pg.images.length + req.files.length > 8) {
      return res.status(400).json({
        success: false,
        message: `This PG can hold 8 images — it already has ${pg.images.length}`,
      });
    }

    const uploaded = await Promise.all(
      req.files.map((f) =>
        uploadBuffer(f.buffer, { folder: `roomward/pg/${pg._id}` })
      )
    );

    pg.images.push(...uploaded.map((u) => u.url));
    pg.imageIds.push(...uploaded.map((u) => u.publicId));
    await pg.save();

    res.status(201).json({ success: true, images: pg.images });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/upload/pg/:id/images  (owner only, body { url })
export async function removePgImage(req, res, next) {
  try {
    const { url } = req.body;
    const pg = await PG.findById(req.params.id);
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }
    if (pg.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'You can only edit your own PGs' });
    }
    const idx = pg.images.indexOf(url);
    if (idx === -1) {
      return res
        .status(404)
        .json({ success: false, message: 'That image is not on this PG' });
    }
    const publicId = pg.imageIds[idx];
    pg.images.splice(idx, 1);
    if (idx < pg.imageIds.length) pg.imageIds.splice(idx, 1);
    await pg.save();
    await destroyImage(publicId);

    res.json({ success: true, images: pg.images });
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/verify  (any signed-in user, multipart field "photo")
// Stores the live selfie and marks the account VERIFIED.
export async function uploadVerification(req, res, next) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'Capture a photo to verify your identity' });
    }
    const result = await uploadBuffer(req.file.buffer, {
      folder: `roomward/verify/${req.user._id}`,
      publicId: 'selfie',
    });

    // Replace any previous selfie.
    if (req.user.verificationPhotoId) {
      await destroyImage(req.user.verificationPhotoId);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        verificationPhoto: result.url,
        verificationPhotoId: result.publicId,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      verificationStatus: user.verificationStatus,
      verificationPhoto: user.verificationPhoto,
      verifiedAt: user.verifiedAt,
    });
  } catch (err) {
    next(err);
  }
}
