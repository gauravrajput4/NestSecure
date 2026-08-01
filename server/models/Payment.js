import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: { type: Number, required: true }, // in INR (rupees)

    type: {
      type: String,
      enum: ['BOOKING', 'RENT'],
      default: 'BOOKING',
    },

    // Razorpay identifiers
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
    },

    // Refund details
    refundId: { type: String },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },

    // Owner payout (Route transfer) — set after payment is verified and money is
    // split between platform and owner. Only populated for PAID payments.
    transferId: { type: String }, // Razorpay Route transfer id
    ownerAmount: { type: Number, default: 0 }, // rupees sent to owner
    platformFee: { type: Number, default: 0 }, // rupees kept by platform
    payoutStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PROCESSED', 'FAILED', 'REVERSED'],
      default: 'NONE',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
