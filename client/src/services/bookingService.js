import api from './api.js';

export const createBooking = (data) =>
  api.post('/booking', data).then((r) => r.data);
export const myBookings = () => api.get('/booking/my').then((r) => r.data);
export const cancelBooking = (bookingId) =>
  api.post('/booking/cancel', { bookingId }).then((r) => r.data);
export const refundPreview = (bookingId) =>
  api.get(`/booking/${bookingId}/refund-preview`).then((r) => r.data);

export const createOrder = (data) =>
  api.post('/payment/order', data).then((r) => r.data);
export const verifyPayment = (data) =>
  api.post('/payment/verify', data).then((r) => r.data);
export const myPayments = () => api.get('/payment/my').then((r) => r.data);

export const ownerDashboard = () =>
  api.get('/owner/dashboard').then((r) => r.data);
export const ownerPGs = () => api.get('/owner/pgs').then((r) => r.data);

export const ownerRequests = () =>
  api.get('/owner/requests').then((r) => r.data);
export const approveRequest = (bookingId) =>
  api.post(`/owner/requests/${bookingId}/approve`).then((r) => r.data);
export const rejectRequest = (bookingId, reason) =>
  api.post(`/owner/requests/${bookingId}/reject`, { reason }).then((r) => r.data);

export const rentLedger = (bookingId) =>
  api.get(`/rent/booking/${bookingId}`).then((r) => r.data);
export const rentReceipt = (invoiceId) =>
  api.get(`/rent/invoice/${invoiceId}/receipt`).then((r) => r.data);
