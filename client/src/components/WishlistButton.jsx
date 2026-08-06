import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Heart toggle used on cards and the detail page. Only meaningful for USER
// accounts; hidden otherwise. Stops click propagation so it works on top of a
// clickable card.
export default function WishlistButton({ pgId, className = '', size = 'md' }) {
  const { user } = useAuth();
  const wishlist = useWishlist();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!user || user.role !== 'USER' || !wishlist) return null;

  const saved = wishlist.isSaved(pgId);
  const dim = size === 'lg' ? 'h-11 w-11 text-2xl' : 'h-9 w-9 text-lg';

  const onClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    try {
      setBusy(true);
      const nowSaved = await wishlist.toggle(pgId);
      toast.success(nowSaved ? 'Saved to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`inline-flex items-center justify-center rounded-full bg-white/90 shadow-card backdrop-blur transition-all hover:scale-110 active:scale-95 ${dim} ${
        saved ? 'text-danger' : 'text-ink/40 hover:text-danger'
      } ${busy ? 'opacity-60' : ''} ${className}`}
    >
      {saved ? '♥' : '♡'}
    </button>
  );
}
