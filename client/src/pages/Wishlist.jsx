import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlist } from '../services/wishlistService.js';
import PGCard from '../components/PGCard.jsx';
import { PGCardSkeletonList } from '../components/Skeleton.jsx';
import Button from '../components/Button.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

// The saved-PGs page. Reads the full populated list once on mount, then leans on
// WishlistContext so a heart tap anywhere keeps this grid honest — a PG the user
// un-saves elsewhere drops out here without a refetch.
export default function Wishlist() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const wishlist = useWishlist();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchWishlist();
        if (alive) setPgs(res.data);
      } catch (err) {
        if (alive) toast.error(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the grid in step with the app-wide set — drop anything un-saved.
  const visible = pgs.filter((pg) => wishlist?.isSaved(pg._id));

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <section className="bg-gradient-to-br from-ink via-ink-soft to-indigo-brand text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-info-soft mb-3">
            ♥ Saved
          </p>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mb-3">
            Your wishlist
          </h1>
          <p className="text-lg text-white/80">
            {loading
              ? 'Gathering your saved rooms…'
              : visible.length === 0
              ? 'Nothing saved yet — tap the heart on any PG to keep it here.'
              : `${visible.length} ${
                  visible.length === 1 ? 'room' : 'rooms'
                } you're keeping an eye on.`}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <PGCardSkeletonList count={6} />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="text-6xl mb-4">🏚️</div>
            <h2 className="font-display font-bold text-2xl text-ink mb-2">
              No saved rooms
            </h2>
            <p className="text-ink/60 max-w-md mb-6">
              Browse listings and tap the heart to save the ones you like. They'll
              wait for you right here.
            </p>
            <Link to="/">
              <Button>Explore PGs</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((pg) => (
              <PGCard key={pg._id} pg={pg} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
