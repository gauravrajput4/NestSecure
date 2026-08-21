import api from './api.js';

export const suggestPricing = (params) =>
  api.get('/pricing/suggest', { params }).then((r) => r.data);
export const getMarketOverview = () =>
  api.get('/pricing/market-overview').then((r) => r.data);