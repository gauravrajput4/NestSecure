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

    // ── User settings ─────────────────────────────────────────────────────
    // Notification preferences. Every key is an on/off switch for one kind of
    // message; `channel` picks EMAIL and/or WHATSAPP delivery. These gate the
    // send sites in notify.js (see utils/notify.js `notifyChannels`).
    notifications: {
      bookingUpdates: { type: Boolean, default: true }, // request / approval / cancel
      rentReminders: { type: Boolean, default: true }, // rent due + overdue alerts
      promotions: { type: Boolean, default: false }, // offers & news
      newRequests: { type: Boolean, default: true }, // owners: a tenant requested a booking
      channel: {
        type: String,
        enum: ['EMAIL', 'WHATSAPP', 'BOTH'],
        default: 'EMAIL',
      },
    },

    // Privacy preferences — what other users can see about this account.
    privacy: {
      // Share phone with the owner after a booking is approved (needed for
      // move-in coordination). Off = owner sees only the in-app messages.
      showContact: { type: Boolean, default: true },
      // Whether the profile is listed in owner views of applicants.
      profileVisibility: {
        type: String,
        enum: ['PRIVATE', 'PUBLIC'],
        default: 'PRIVATE',
      },
    },

    // Saved payment methods — METADATA ONLY. Full credentials are never stored
    // here; card details are tokenized by the payment gateway, and the token is
    // what we keep so checkout can be prefilled securely.
    paymentMethods: [
      {
        type: {
          type: String,
          enum: ['CARD', 'UPI'],
          required: true,
        },
        label: { type: String, trim: true, default: '' },
        // UPI
        upiId: { type: String, trim: true, default: '' },
        // Card metadata (network + last4 only)
        network: { type: String, default: '' },
        last4: { type: String, default: '' },
        // Gateway token id for real payments (empty in demo mode)
        token: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],

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

    // Razorpay customer id — enables remembered cards / one-tap checkout.
    razorpayCustomerId: { type: String, default: '' },

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
