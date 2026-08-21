import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { myWaitlist, cancelWaitlist } from '../services/waitlistService.js';
import { useToast } from '../context/ToastContext.jsx';
import Loader from '../components/Loader.jsx';
import Button from '../components/Button.jsx';

function StatusBadge({ status }) {
  const colors = {
    WAITING: 'bg-warning/10 text-warning',
    NOTIFIED: 'bg-success/10 text-success',
    EXPIRED: 'bg-danger/10 text-danger',
    FULFILLED: 'bg-indigo-brand/10 text-indigo-brand',
    CANCELLED: 'bg-ink/10 text-ink/60',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-ink/10'}`}>
      {status}
   </span>
  );
}

export default function MyWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadWaitlist();
  }, []);

  async function loadWaitlist() {
    try {
      const res = await myWaitlist();
      setEntries(res.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this waitlist entry?')) return;
    try {
      await cancelWaitlist(id);
      toast.success('Waitlist entry cancelled');
      loadWaitlist();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Loader className="min-h-screen" />;

  return (
    <div className="page-shell py-12">
      <div className="page-container max-w-4xl">
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-3xl text-ink">My Waitlist</h1>
          <p className="text-ink/60">
            Rooms you are waiting for. We will notify you when one becomes available.
         </p>
       </div>

        {entries.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <p className="text-ink/60 mb-4">You have not joined any waitlists yet</p>
            <Link to="/">
              <Button>Browse PGs</Button>
           </Link>
         </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry._id} className="surface-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={entry.status} />
                      {entry.sharingType && (
                        <span className="text-xs text-ink/60">{entry.sharingType} sharing</span>
                      )}
                   </div>
                    <h3 className="font-display font-bold text-lg text-ink">{entry.pg?.name</h3>
                    <p className="text-sm text-ink/60">
                      {entry.pg?.address}, {entry.pg?.city}
                   </p>
                    {entry.room && (
                      <p className="text-sm text-ink/70 mt-1">
                        Room: {entry.room.label} (Capacity: {entry.room.totalBeds} people)
                     </p>
                    )}
                    <p className="text-xs text-ink/50 mt-2">
                      Joined: {new Date(entry.createdAt).toLocaleDateString('en-IN')}
                   </p>
                    {entry.notifiedAt && (
                      <p className="text-xs text-success mt-1">
                        Notified: {new Date(entry.notifiedAt).toLocaleString('en-IN')}
                        {entry.expiresAt &&
                          ` (expires ${new Date(entry.expiresAt).toLocaleString('en-IN')})`}
                     </p>
                    )}
                    {entry.notes && (
                      <p className="text-xs text-ink/60 mt-1">{entry.notes</p>
                    )}
                 </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {entry.status === 'NOTIFIED' && (
                      <Link to={`/pg/${entry.pg?._id}`}>
                        <Button size="sm">Book Now</Button>
                     </Link>
                    )}
                    {(entry.status === 'WAITING' || entry.status === 'NOTIFIED') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(entry._id)}
                      >
                        Cancel
                     </Button>
                    )}
                 </div>
               </div>
             </div>
            ))}
         </div>
        )}
     </div>
   </div>
  );
}