import User from '../models/User.js';
import crypto from 'crypto';
import generateToken from '../utils/generateToken.js';
import { createInteractiveEmail, sendEmail } from '../utils/notify.js';
import { createLinkedAccount } from '../utils/razorpay.js';

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  gender: u.gender,
  verificationStatus: u.verificationStatus,
  verificationPhoto: u.verificationPhoto,
  verifiedAt: u.verifiedAt,
  payout: u.payout, // include owner payout details
});

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const { name, email, phone, password, role, gender } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(409)
        .json({ success: false, message: 'Email already registered' });
    }

    // One account per phone number — stops the same person from registering a
    // second profile (different email) to bypass the one-active-booking rule.
    // Skipped when no phone is provided, so optional registration still works.
    if (phone && phone.trim()) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already registered',
        });
      }
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role === 'OWNER' ? 'OWNER' : 'USER',
      gender,
    });

    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
    }
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Contact support.',
      });
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ success: true, user: publicUser(req.user) });
}

// Hash a raw token the same way for storage + lookup.
const hashToken = (raw) =>
  crypto.createHash('sha256').update(raw).digest('hex');

// POST /api/auth/forgot-password — email a reset link (always 200 to avoid
// leaking which emails are registered).
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Respond identically whether or not the account exists.
    const generic = {
      success: true,
      message: 'If that email is registered, a reset link is on its way.',
    };
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save({ validateBeforeSave: false });

    const base = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${base}/reset-password/${rawToken}`;
    const html = createInteractiveEmail({
      userName: user.name,
      subject: 'Reset your PG Booking password',
      title: 'Password Reset Request',
      message:
        'You requested a password reset. Please use the button below to reset your password. This link is valid for 1 hour.',
      details: [{ label: 'Reset Link', value: link }],
      ctaText: 'Reset Password',
      ctaUrl: link,
    });

    try {
      await sendEmail(user.email, 'Reset your PG Booking password', html);
    } catch (mailErr) {
      // Roll back the token if we couldn't actually send the mail.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Reset email failed:', mailErr);
      return res
        .status(502)
        .json({ success: false, message: 'Could not send reset email.' });
    }

    // In demo mode (no SMTP) expose the link so the flow is testable.
    const demo = !process.env.SMTP_HOST;
    res.json(demo ? { ...generic, demo: true, resetLink: link } : generic);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/reset-password/:token — set a new password
export async function resetPassword(req, res, next) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired.',
      });
    }

    user.password = password; // pre-save hook re-hashes
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id);
    res.json({ success: true, token: authToken, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/profile — update profile fields (phone, payout details)
export async function updateProfile(req, res, next) {
  try {
    const { phone, payout } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (phone !== undefined) user.phone = phone;
    if (payout !== undefined) {
      // Merge payout fields — this lets the client send just the changed fields.
      user.payout = { ...user.payout.toObject(), ...payout };
    }

    await user.save();
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/payout/provision — create a Razorpay linked account from the
// owner's saved payout details so they can receive transfers. Idempotent: if
// already provisioned, returns the existing ids. OWNER-only.
export async function provisionPayout(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'OWNER') {
      return res.status(403).json({ success: false, message: 'Owner accounts only' });
    }
    if (user.payout.method === 'NONE') {
      return res.status(400).json({
        success: false,
        message: 'Payout details not configured. Add them in your profile first.',
      });
    }

    // Already provisioned? Return existing.
    if (user.payout.razorpayAccountId && user.payout.razorpayFundAccountId) {
      return res.json({
        success: true,
        message: 'Payout account already active.',
        accountId: user.payout.razorpayAccountId,
        fundAccountId: user.payout.razorpayFundAccountId,
      });
    }

    // Provision now.
    let result;
    try {
      result = await createLinkedAccount({
        method: user.payout.method,
        accountHolder: user.payout.accountHolder,
        accountNumber: user.payout.accountNumber,
        ifsc: user.payout.ifsc,
        upiId: user.payout.upiId,
      });
    } catch (provisionErr) {
      console.error('Razorpay linked account creation failed:', provisionErr);
      // Check if it's a Razorpay Route not enabled error
      const msg = provisionErr.message || String(provisionErr);
      if (msg.includes('Route') || msg.includes('route') || msg.includes('not enabled') || msg.includes('permission') || msg.includes('unauthorized')) {
        return res.status(400).json({
          success: false,
          message: 'Razorpay Route (transfers) is not enabled on this account. Contact Razorpay support to enable payouts, or use a live account with Route access.',
        });
      }
      throw provisionErr;
    }

    user.payout.razorpayAccountId = result.accountId;
    user.payout.razorpayFundAccountId = result.fundAccountId;
    user.payout.status = 'ACTIVE';
    await user.save();

    res.json({
      success: true,
      message: 'Payout account created. You can now receive transfers.',
      accountId: result.accountId,
      fundAccountId: result.fundAccountId,
    });
  } catch (err) {
    next(err);
  }
}
