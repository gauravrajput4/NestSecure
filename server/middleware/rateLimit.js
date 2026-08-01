import rateLimit from 'express-rate-limit';

const json = (msg) => ({ success: false, message: msg });

// Image uploads are the most abusable endpoints — cap them tightly.
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many uploads. Please wait a few minutes and try again.'),
});

// Login/register — slow down credential stuffing without blocking real users.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many attempts. Please wait 15 minutes and try again.'),
});

// A gentle ceiling for the whole API.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: json('Too many requests. Please slow down.'),
});
