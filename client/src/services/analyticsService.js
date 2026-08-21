import api from './api.js';

export const getAnalyticsSummary = () =>
  api.get('/owner/analytics/summary').then((r) => r.data);
export const getOccupancyTrends = (months = 6) =>
  api.get('/owner/analytics/trends', { params: { months } }).then((r) => r.data);
export const getRevenueStats = () =>
  api.get('/owner/analytics/revenue').then((r) => r.data);
export const getTenantTurnover = () =>
  api.get('/owner/analytics/turnover').then((r) => r.data);
export const getRentRoll = () =>
  api.get('/owner/analytics/rent-roll').then((r) => r.data);