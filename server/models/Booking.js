import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
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
    roomLabel: { type: String, default: '' }, // e.g. "Room 3B"
    // Which specific room within the PG (for room-level PGs). Null for legacy
    // count-based PGs.
    room: { type: mongoose.Schema.Types.ObjectId, default: null },
    sharingType: { type: String, default: '' },

    // Number of occupants staying in the room (1 to room capacity)
    occupants: { type: Number, default: 1, min: 1 },

    startDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true }, // next rent due date

    monthlyRent: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },

    bookingStatus: {
      type: String,
      // REQUESTED → owner must approve; PENDING → approved, awaiting payment;
      // CONFIRMED → paid + room reserved; REJECTED → owner declined;
      // CANCELLED → tenant cancelled.
      enum: ['REQUESTED', 'PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
      default: 'REQUESTED',
    },

    // Owner approval workflow
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, default: '' },

    // Rent payment tracking
    lastRentPaidOn: { type: Date },
    rentStatus: {
      type: String,
      enum: ['DUE', 'PAID', 'OVERDUE'],
      default: 'DUE',
    },

    // Refund bookkeeping (set on cancellation)
    refundAmount: { type: Number, default: 0 },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, bookingStatus: 1 });
bookingSchema.index({ pg: 1, bookingStatus: 1 });

export default mongoose.model('Booking', bookingSchema);
