import api from './api.js';

export const fetchWishlist = () => api.get('/wishlist').then((r) => r.data);
export const fetchWishlistIds = () =>
  api.get('/wishlist/ids').then((r) => r.data);
export const toggleWishlist = (pgId) =>
  api.post(`/wishlist/${pgId}/toggle`).then((r) => r.data);
