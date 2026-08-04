import api from './api.js';

export const fetchPGs = (params) => api.get('/pg', { params }).then((r) => r.data);
export const fetchPGById = (id) => api.get(`/pg/${id}`).then((r) => r.data);
export const createPG = (data) => api.post('/pg', data).then((r) => r.data);
export const updatePG = (id, data) => api.put(`/pg/${id}`, data).then((r) => r.data);
export const deletePG = (id) => api.delete(`/pg/${id}`).then((r) => r.data);

export const fetchReviews = (pgId) => api.get(`/review/${pgId}`).then((r) => r.data);
export const addReview = (data) => api.post('/review', data).then((r) => r.data);
