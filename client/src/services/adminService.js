import api from './api.js';

export const adminStats = () => api.get('/admin/stats').then((r) => r.data);

export const adminUsers = (params) =>
  api.get('/admin/users', { params }).then((r) => r.data);
export const adminToggleBan = (userId) =>
  api.patch(`/admin/users/${userId}/ban`).then((r) => r.data);
export const adminSetVerification = (userId, status) =>
  api.patch(`/admin/users/${userId}/verify`, { status }).then((r) => r.data);

export const adminPGs = (params) =>
  api.get('/admin/pgs', { params }).then((r) => r.data);
export const adminDeletePG = (pgId) =>
  api.delete(`/admin/pgs/${pgId}`).then((r) => r.data);

export const adminBookings = (params) =>
  api.get('/admin/bookings', { params }).then((r) => r.data);

export const adminReviews = () => api.get('/admin/reviews').then((r) => r.data);
export const adminDeleteReview = (reviewId) =>
  api.delete(`/admin/reviews/${reviewId}`).then((r) => r.data);
