import mongoose from 'mongoose';

// One invoice per rent month per booking. The booking still carries the
// "current" nextDueDate for quick reads and the cron; this collection is the
// full ledger the tenant and owner can browse, with a receipt per paid month.
const rentInvoiceSchema = new mongoose.Schema(
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
    pg: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PG',
      required: true,
    },

    // The rent month this invoice covers, e.g. "2026-08" (YYYY-MM). Unique per
    // booking so we never double-bill a month.
    period: { type: String, required: true }, // YYYY-MM
    periodStart: { type: Date, required: true },
    dueDate: { type: Date, required: true },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['DUE', 'PAID', 'OVERDUE'],
      default: 'DUE',
    },

    // Set when paid
    paidOn: { type: Date },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    receiptNo: { type: String }, // human-facing receipt id
  },
  { timestamps: true }
);

// A booking can only have one invoice per period.
rentInvoiceSchema.index({ booking: 1, period: 1 }, { unique: true });
rentInvoiceSchema.index({ user: 1, status: 1 });
rentInvoiceSchema.index({ pg: 1, status: 1 });

export default mongoose.model('RentInvoice', rentInvoiceSchema);
