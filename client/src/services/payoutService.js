import api from './api.js';

// PATCH /api/auth/profile — update profile fields including payout details
export async function updateProfile(data) {
  const res = await api.patch('/auth/profile', data);
  return res.data;
}

// POST /api/auth/payout/provision — create Razorpay linked account for owner payouts
export async function provisionPayout() {
  const res = await api.post('/auth/payout/provision');
  return res.data;
}
