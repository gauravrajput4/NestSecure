import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWishlistIds, toggleWishlist } from '../services/wishlistService.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

// Tracks the set of saved PG ids app-wide so the heart on every card stays in
// sync without each card fetching on its own. Only USERs have a wishlist.
export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState(() => new Set());

  const load = useCallback(async () => {
    try {
      const res = await fetchWishlistIds();
      setIds(new Set(res.data.map(String)));
    } catch {
      setIds(new Set());
    }
  }, []);

  // Hydrate when a USER logs in; clear on logout / owner accounts
  useEffect(() => {
    if (user?.role === 'USER') load();
    else setIds(new Set());
  }, [user, load]);

  const isSaved = useCallback((pgId) => ids.has(String(pgId)), [ids]);

  // Optimistic toggle, rolled back if the request fails
  const toggle = useCallback(async (pgId) => {
    const key = String(pgId);
    setIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    try {
      const res = await toggleWishlist(pgId);
      setIds(new Set(res.wishlist.map(String)));
      return res.saved;
    } catch (err) {
      // revert
      setIds((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });
      throw err;
    }
  }, []);

  return (
    <WishlistContext.Provider value={{ isSaved, toggle, count: ids.size, reload: load }}>
      {children}
    </WishlistContext.Provider>
  );
};
