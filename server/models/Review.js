import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

// One review per user per PG
reviewSchema.index({ pg: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
