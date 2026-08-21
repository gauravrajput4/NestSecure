import api from './api.js';

export const joinWaitlist = (data) =>
  api.post('/waitlist', data).then((r) => r.data);
export const myWaitlist = () => api.get('/waitlist/my').then((r) => r.data);
export const cancelWaitlist = (id) =>
  api.post(`/waitlist/${id}/cancel`).then((r) => r.data);