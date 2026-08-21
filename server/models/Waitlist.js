import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // null = any room in PG, specific room if provided
    },
    sharingType: { type: String, default: '' }, // e.g., 'DOUBLE', 'TRIPLE'
    maxOccupants: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: ['WAITING', 'NOTIFIED', 'EXPIRED', 'FULFILLED', 'CANCELLED'],
      default: 'WAITING',
    },
    notifiedAt: { type: Date },
    expiresAt: { type: Date },
    fulfilledAt: { type: Date },
    cancelledAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

waitlistSchema.index({ user: 1, pg: 1, status: 1 });
waitlistSchema.index({ pg: 1, room: 1, status: 1 });
waitlistSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model('Waitlist', waitlistSchema);