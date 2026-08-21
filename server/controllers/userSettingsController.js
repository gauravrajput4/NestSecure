import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import PG from '../models/PG.js';

const UPI_RE = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
const CARD_NETWORKS = ['VISA', 'MASTERCARD', 'RUPAY', 'AMEX', 'OTHER'];

// Settings a user actually sees depend on role; these are the stored keys.
const NOTIFICATION_KEYS = [
  'bookingUpdates',
  'rentReminders',
  'promotions',
  'newRequests',
];

// GET /api/settings — current prefs + saved payment methods
export async function getSettings(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select(
      'notifications privacy paymentMethods role'
    );
    res.json({
      success: true,
      data: {
        role: user.role,
        notifications: user.notifications || {},
        privacy: user.privacy || {},
        paymentMethods: (user.paymentMethods || []).map((m) => m.toObject()),
      },
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/settings/notifications — update notification preferences
export async function updateNotifications(req, res, next) {
  try {
    const body = req.body || {};
    const patch = {};
    for (const key of NOTIFICATION_KEYS) {
      if (typeof body[key] === 'boolean') patch[key] = body[key];
    }
    if (['EMAIL', 'WHATSAPP', 'BOTH'].includes(body.channel)) {
      patch.channel = body.channel;
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.notifications = { ...(user.notifications || {}), ...patch };
    await user.save();
    res.json({ success: true, data: user.notifications });
  } catch (err) {
    next(err);
  }
}

// PUT /api/settings/privacy — update privacy preferences
export async function updatePrivacy(req, res, next) {
  try {
    const body = req.body || {};
    const patch = {};
    if (typeof body.showContact === 'boolean') patch.showContact = body.showContact;
    if (['PRIVATE', 'PUBLIC'].includes(body.profileVisibility)) {
      patch.profileVisibility = body.profileVisibility;
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.privacy = { ...(user.privacy || {}), ...patch };
    await user.save();
    res.json({ success: true, data: user.privacy });
  } catch (err) {
    next(err);
  }
}

// POST /api/settings/payment-methods — add a saved payment method (metadata)
export async function addPaymentMethod(req, res, next) {
  try {
    const { type, upiId, network, last4, token, label } = req.body || {};
    if (type !== 'UPI' && type !== 'CARD') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid payment method type' });
    }

    let entry;
    if (type === 'UPI') {
      if (!upiId || !UPI_RE.test(upiId)) {
        return res
          .status(400)
          .json({ success: false, message: 'Enter a valid UPI ID (e.g. name@bank)' });
      }
      const dup = await User.findOne({
        _id: req.user._id,
        'paymentMethods.upiId': { $regex: `^${upiId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (dup) {
        return res
          .status(409)
          .json({ success: false, message: 'This UPI ID is already saved' });
      }
      entry = {
        type: 'UPI',
        upiId,
        label: label || upiId,
        network: 'UPI',
        last4: '',
        token: token || '',
      };
    } else {
      if (!CARD_NETWORKS.includes(network)) {
        return res
          .status(400)
          .json({ success: false, message: 'Select the card network' });
      }
      if (last4 && !/^\d{4}$/.test(last4)) {
        return res
          .status(400)
          .json({ success: false, message: 'Card number must end in 4 digits' });
      }
      entry = {
        type: 'CARD',
        upiId: '',
        label: label || `${network} •••• ${last4 || 'XXXX'}`,
        network,
        last4: last4 || '',
        token: token || '',
      };
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const methods = user.paymentMethods || [];
    const isFirst = methods.length === 0;
    user.paymentMethods.push({ ...entry, isDefault: isFirst });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Payment method saved',
      data: user.paymentMethods[user.paymentMethods.length - 1].toObject(),
    });
  } catch (err) {
    next(err);
  }
}

// PUT /api/settings/payment-methods/:id/default — mark a method as default
export async function setDefaultPaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const target = (user.paymentMethods || []).id(id);
    if (!target) {
      return res
        .status(404)
        .json({ success: false, message: 'Payment method not found' });
    }

    user.paymentMethods.forEach((m) => (m.isDefault = false));
    target.isDefault = true;
    await user.save();

    res.json({ success: true, message: 'Default payment method updated' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/settings/payment-methods/:id — remove a saved method
export async function deletePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const removed = (user.paymentMethods || []).id(id);
    if (!removed) {
      return res
        .status(404)
        .json({ success: false, message: 'Payment method not found' });
    }

    const wasDefault = removed.isDefault;
    user.paymentMethods.pull(id);
    if (wasDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }
    await user.save();

    res.json({ success: true, message: 'Payment method removed' });
  } catch (err) {
    next(err);
  }
}

// GET /api/settings/data — export everything this account has on record
export async function exportData(req, res, next) {
  try {
    const [user, bookings, payments, reviews] = await Promise.all([
      User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpires'),
      Booking.find({ user: req.user._id })
        .populate('pg', 'name city address')
        .select('-__v'),
      Payment.find({ user: req.user._id }).select('-__v'),
      Review.find({ user: req.user._id }).populate('pg', 'name').select('-__v'),
    ]);

    const wishlist =
      user?.wishlist?.length > 0
        ? await PG.find({ _id: { $in: user.wishlist } }).select('name city price')
        : [];

    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        name: user?.name,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        gender: user?.gender,
        verificationStatus: user?.verificationStatus,
        createdAt: user?.createdAt,
      },
      settings: {
        notifications: user?.notifications,
        privacy: user?.privacy,
        paymentMethods: (user?.paymentMethods || []).map((m) => ({
          type: m.type,
          label: m.label,
          network: m.network,
          last4: m.last4,
          upiId: m.type === 'UPI' ? m.upiId : undefined,
          isDefault: m.isDefault,
        })),
      },
      bookings,
      payments,
      reviews,
      wishlist,
    };

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nestsecure-data-${req.user._id}.json"`
    );
    res.json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
}

// POST /api/settings/delete-account — self-service account deletion
export async function deleteAccount(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Admin accounts can’t be deleted from the app.',
      });
    }

    // Owners must clear their listings first so tenants aren’t left stranded.
    if (user.role === 'OWNER') {
      const ownedPGs = await PG.countDocuments({ owner: user._id });
      if (ownedPGs > 0) {
        return res.status(409).json({
          success: false,
          message: `You still have ${ownedPGs} listing${
            ownedPGs > 1 ? 's' : ''
          }. Remove or transfer them before deleting your account.`,
        });
      }
    }

    // An active CONFIRMED booking holds a room and may involve paid money — force
    // the normal cancel+refund flow so nothing is silently abandoned.
    const confirmed = await Booking.findOne({
      user: user._id,
      bookingStatus: 'CONFIRMED',
    });
    if (confirmed) {
      return res.status(409).json({
        success: false,
        message:
          'You have a confirmed booking. Cancel it (and receive any refund) before deleting your account.',
      });
    }

    // Auto-cancel anything still in flight — REQUESTED/PENDING hold no room and
    // haven't been paid, so this is a clean close-out.
    await Booking.updateMany(
      { user: user._id, bookingStatus: { $in: ['REQUESTED', 'PENDING'] } },
      { $set: { bookingStatus: 'CANCELLED', cancelledAt: new Date() } }
    );

    // Anonymize instead of hard-deleting so bookings, payments and reviews keep
    // their referential integrity for the owner’s records and audits.
    user.name = 'Deleted User';
    user.email = `deleted-${user._id}@removed.local`;
    user.phone = '';
    user.password = `${user._id}-${Date.now()}-deleted`; // invalidates login
    user.wishlist = [];
    user.verificationPhoto = '';
    user.verificationPhotoId = '';
    user.verificationStatus = 'UNVERIFIED';
    user.payout = {
      method: 'NONE',
      accountHolder: '',
      accountNumber: '',
      ifsc: '',
      upiId: '',
      razorpayAccountId: '',
      razorpayFundAccountId: '',
      status: 'NONE',
    };
    user.paymentMethods = [];
    user.isBanned = true; // hard block: no re-login with any stale token
    await user.save();

    res.json({
      success: true,
      message: 'Your account has been deleted. Goodbye, and thanks for staying with us.',
    });
  } catch (err) {
    next(err);
  }
}