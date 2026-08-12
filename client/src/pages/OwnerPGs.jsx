import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ownerPGs } from '../services/bookingService.js';
import { updatePG, deletePG } from '../services/pgService.js';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import Loader from '../components/Loader.jsx';
import Modal from '../components/Modal.jsx';
import ImageUploader from '../components/ImageUploader.jsx';

const Svg = ({ children, className = 'h-5 w-5', ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);
const IconPin = (p) => (
  <Svg {...p}>
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);
const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
const IconEye = (p) => (
  <Svg {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
const IconBuilding = (p) => (
  <Svg {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1.5" />
    <path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
  </Svg>
);
const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

const GENDER = {
  BOTH: { label: 'Unisex', cls: 'bg-indigo-brand/10 text-indigo-brand' },
  BOYS_ONLY: { label: 'Boys', cls: 'bg-info/10 text-info' },
  GIRLS_ONLY: { label: 'Girls', cls: 'bg-danger/10 text-danger' },
};

export default function OwnerPGs() {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPGs();
  }, []);

  const loadPGs = async () => {
    try {
      setLoading(true);
      const res = await ownerPGs();
      setPgs(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (pg) => {
    setEditingId(pg._id);
    setEditForm({
      name: pg.name || '',
      description: pg.description || '',
      address: pg.address || '',
      city: pg.city || '',
      latitude: pg.latitude ?? '',
      longitude: pg.longitude ?? '',
      genderType: pg.genderType || 'BOTH',
      facilities: (pg.facilities || []).join(', '),
      price: pg.price ?? '',
      securityDeposit: pg.securityDeposit ?? '',
      totalRooms: pg.totalRooms ?? '',
      availableRooms: pg.availableRooms ?? '',
    });
  };

  const changeEdit = (e) =>
    setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Save uses the existing updatePG (PUT /pg/:id, partial body). For room-level
  // PGs we deliberately do NOT send the rooms[] array or bed counts, so live
  // occupancy (availableBeds) is never clobbered by syncRoomAggregates.
  const saveEdit = async (pg) => {
    const isRoomLevel = (pg.rooms?.length || 0) > 0;
    try {
      setEditSaving(true);
      const payload = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        city: editForm.city,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
        genderType: editForm.genderType,
        facilities: editForm.facilities
          ? editForm.facilities.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      };
      if (!isRoomLevel) {
        payload.price = Number(editForm.price);
        payload.securityDeposit = Number(editForm.securityDeposit) || 0;
        payload.totalRooms = Number(editForm.totalRooms);
        payload.availableRooms = Number(editForm.availableRooms);
      }
      await updatePG(pg._id, payload);
      toast.success('Listing updated');
      setEditingId(null);
      setEditForm(null);
      await loadPGs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePG(deleteTarget._id);
      toast.success('PG deleted');
      setDeleteTarget(null);
      loadPGs();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader className="min-h-screen" />;

  const totalPGs = pgs.length;
  const totalUnits = pgs.reduce((sum, pg) => sum + Number(pg.totalRooms || 0), 0);
  const availableUnits = pgs.reduce(
    (sum, pg) => sum + Number(pg.availableRooms || 0),
    0
  );
  const occupancy =
    totalUnits > 0
      ? Math.round(((totalUnits - availableUnits) / totalUnits) * 100)
      : 0;

  return (
    <div className="page-shell py-10">
      <div className="page-container max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand">
              Owner · Listings
            </p>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
              Property Listings
            </h1>
            <p className="text-ink/60 mt-2">
              Manage your active and inactive PG accommodations.
            </p>
          </div>
          <Button onClick={() => navigate('/owner/pgs/new')}>
            <IconPlus className="h-5 w-5" /> Add New Listing
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
              Total listings
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{totalPGs}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
              Total units
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">{totalUnits}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
              Available now
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-success">
              {availableUnits}
            </p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-ink/50">
              Occupancy
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-indigo-brand">
              {occupancy}%
            </p>
          </div>
        </div>

        {pgs.length === 0 ? (
          <div className="surface-card p-12 text-center">
            <span className="mx-auto h-14 w-14 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
              <IconBuilding className="h-7 w-7" />
            </span>
            <p className="text-ink/70 mt-4">
              No PGs listed yet. Create your first listing to start receiving
              bookings.
            </p>
            <Button
              className="mt-5"
              onClick={() => navigate('/owner/pgs/new')}
            >
              <IconPlus className="h-5 w-5" /> Add New Listing
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pgs.map((pg) => {
              const total = pg.totalRooms || 0;
              const avail = pg.availableRooms || 0;
              const occupied = Math.max(0, total - avail);
              const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
              const unit = pg.rooms?.length > 0 ? 'Beds' : 'Rooms';
              const full = avail <= 0;
              const gender = GENDER[pg.genderType] || GENDER.BOTH;
              const isRoomLevel = (pg.rooms?.length || 0) > 0;
              const isEditing = editingId === pg._id;

              return (
                <div
                  key={pg._id}
                  className="surface-card overflow-hidden flex flex-col"
                >
                  {/* Image + status */}
                  <div className="relative aspect-[16/10] bg-paper-sunk">
                    {pg.images?.[0] ? (
                      <img
                        src={pg.images[0]}
                        alt={pg.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-indigo-brand/40">
                        <IconBuilding className="h-10 w-10" />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        full
                          ? 'bg-danger/15 text-danger'
                          : 'bg-success/15 text-success'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          full ? 'bg-danger' : 'bg-success'
                        }`}
                      />
                      {full ? 'Full' : 'Available'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-bold text-lg text-ink leading-tight">
                        {pg.name}
                      </h3>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${gender.cls}`}
                      >
                        {gender.label}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink/60">
                      <IconPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {[pg.address, pg.city].filter(Boolean).join(', ')}
                      </span>
                    </p>

                    {/* Occupancy */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
                        Occupancy
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <p className="font-display font-bold text-ink">
                          {occupied}/{total}{' '}
                          <span className="text-sm font-normal text-ink/50">
                            {unit}
                          </span>
                        </p>
                        <span className="text-xs font-semibold text-ink/50">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-surface-mid overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            full ? 'bg-danger' : 'bg-indigo-brand'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-ink/10 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          isEditing ? setEditingId(null) : startEdit(pg)
                        }
                      >
                        {isEditing ? 'Close' : 'Edit Listing'}
                      </Button>
                      <Link
                        to="/owner/financials"
                        className="h-control-sm w-9 shrink-0 rounded-xl border border-ink/15 flex items-center justify-center text-ink/60 hover:text-indigo-brand hover:border-indigo-brand/40 transition"
                        title="View financials"
                        aria-label="View financials"
                      >
                        <IconChart className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/pg/${pg._id}`}
                        className="h-control-sm w-9 shrink-0 rounded-xl border border-ink/15 flex items-center justify-center text-ink/60 hover:text-indigo-brand hover:border-indigo-brand/40 transition"
                        title="View public listing"
                        aria-label="View public listing"
                      >
                        <IconEye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Inline edit + photo management */}
                  {isEditing && editForm && (
                    <div className="border-t border-ink/10 p-5 bg-paper/60 space-y-5">
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          label="PG Name"
                          name="name"
                          value={editForm.name}
                          onChange={changeEdit}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="City"
                            name="city"
                            value={editForm.city}
                            onChange={changeEdit}
                          />
                          <div>
                            <label className="block text-sm font-semibold text-ink mb-2">
                              Category
                            </label>
                            <select
                              name="genderType"
                              value={editForm.genderType}
                              onChange={changeEdit}
                              className="w-full h-control rounded-xl border-2 border-ink/15 px-3 text-ink focus:border-indigo-brand focus:outline-none"
                            >
                              <option value="BOTH">Unisex</option>
                              <option value="BOYS_ONLY">Boys</option>
                              <option value="GIRLS_ONLY">Girls</option>
                            </select>
                          </div>
                        </div>
                        <Input
                          label="Address"
                          name="address"
                          value={editForm.address}
                          onChange={changeEdit}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Latitude"
                            type="number"
                            step="any"
                            name="latitude"
                            value={editForm.latitude}
                            onChange={changeEdit}
                          />
                          <Input
                            label="Longitude"
                            type="number"
                            step="any"
                            name="longitude"
                            value={editForm.longitude}
                            onChange={changeEdit}
                          />
                        </div>
                        <Input
                          label="Facilities (comma-separated)"
                          name="facilities"
                          value={editForm.facilities}
                          onChange={changeEdit}
                          placeholder="WiFi, Food, AC"
                        />
                        {!isRoomLevel && (
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Monthly Rent (₹)"
                              type="number"
                              name="price"
                              value={editForm.price}
                              onChange={changeEdit}
                            />
                            <Input
                              label="Security Deposit (₹)"
                              type="number"
                              name="securityDeposit"
                              value={editForm.securityDeposit}
                              onChange={changeEdit}
                            />
                            <Input
                              label="Total Rooms"
                              type="number"
                              name="totalRooms"
                              value={editForm.totalRooms}
                              onChange={changeEdit}
                            />
                            <Input
                              label="Available Rooms"
                              type="number"
                              name="availableRooms"
                              value={editForm.availableRooms}
                              onChange={changeEdit}
                            />
                          </div>
                        )}
                        {isRoomLevel && (
                          <p className="text-xs text-ink/50">
                            Room-level rent, beds and availability are managed
                            per room to protect live occupancy, so they're not
                            editable here.
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => saveEdit(pg)}
                          loading={editSaving}
                        >
                          Save changes
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(pg)}
                        >
                          Delete
                        </Button>
                      </div>

                      <div className="border-t border-ink/10 pt-4">
                        <p className="text-sm font-semibold text-ink mb-3">
                          Photos ({pg.images?.length || 0})
                        </p>
                        <ImageUploader
                          pgId={pg._id}
                          images={pg.images || []}
                          onChange={(images) =>
                            setPgs((prev) =>
                              prev.map((p) =>
                                p._id === pg._id ? { ...p, images } : p
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete this listing?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Keep listing
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>
              Delete listing
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/70">
          <span className="font-semibold text-ink">
            {deleteTarget?.name}
          </span>{' '}
          will be permanently removed, along with its rooms and photos. This
          can’t be undone.
        </p>
      </Modal>
    </div>
  );
}
