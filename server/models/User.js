import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['USER', 'OWNER', 'ADMIN'],
      default: 'USER',
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: true,
    },

    // Identity verification (live selfie)
    verificationPhoto: { type: String, default: '' },
    verificationPhotoId: { type: String, default: '' }, // Cloudinary public id
    verificationStatus: {
      type: String,
      enum: ['UNVERIFIED', 'PENDING', 'VERIFIED'],
      default: 'UNVERIFIED',
    },
    verifiedAt: { type: Date },

    // Saved PGs (wishlist / favorites)
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PG' }],

    // ── Owner payout details ──────────────────────────────────────────────
    // Where rent/booking money is settled for OWNER accounts. Captured once on
    // the owner's profile and reused for every PG they list. Razorpay Route
    // needs a linked account id; we create one from these details and store it.
    payout: {
      method: {
        type: String,
        enum: ['BANK', 'UPI', 'NONE'],
        default: 'NONE',
      },
      accountHolder: { type: String, trim: true, default: '' },
      // Bank transfer
      accountNumber: { type: String, trim: true, default: '' },
      ifsc: { type: String, trim: true, uppercase: true, default: '' },
      // UPI
      upiId: { type: String, trim: true, default: '' },
      // Razorpay Route linked account (fund account) id, once provisioned
      razorpayAccountId: { type: String, default: '' },
      razorpayFundAccountId: { type: String, default: '' },
      status: {
        type: String,
        enum: ['NONE', 'PENDING', 'ACTIVE'],
        default: 'NONE',
      },
    },

    // Admin moderation
    isBanned: { type: Boolean, default: false },

    // Password reset (hashed token + expiry)
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
