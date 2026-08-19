import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPG } from '../services/pgService.js';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import ImageUploader from '../components/ImageUploader.jsx';

// Beds per sharing type — auto-fills totalBeds when the type changes (same
// contract as the original OwnerPGs create form).
const BEDS_BY_SHARING = { SINGLE: 1, DOUBLE: 2, TRIPLE: 3 };

const emptyRoom = {
  label: '',
  sharingType: 'SINGLE',
  rent: '',
  deposit: '',
  totalBeds: '1',
};

const STEPS = [
  { n: 1, label: 'Basic Details' },
  { n: 2, label: 'Location' },
  { n: 3, label: 'Amenities' },
  { n: 4, label: 'Rooms & Pricing' },
  { n: 5, label: 'Images' },
];

// Common amenities → mapped straight into the real PG `facilities[]` array.
const AMENITY_OPTIONS = [
  'WiFi',
  'Food',
  'AC',
  'Laundry',
  'Parking',
  'Power Backup',
  'Housekeeping',
  'Security',
  'Hot Water',
  'Gym',
  'Study Area',
  'CCTV',
];

const CATEGORIES = [
  { value: 'BOYS_ONLY', label: 'Boys', glyph: '♂' },
  { value: 'GIRLS_ONLY', label: 'Girls', glyph: '♀' },
  { value: 'BOTH', label: 'Unisex', glyph: '⚥' },
];

export default function AddListing() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [createdImages, setCreatedImages] = useState([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    genderType: 'BOYS_ONLY',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    price: '',
    securityDeposit: '',
    totalRooms: '',
    availableRooms: '',
  });
  const [facilities, setFacilities] = useState([]);
  const [customFacility, setCustomFacility] = useState('');
  const [useRooms, setUseRooms] = useState(false);
  const [rooms, setRooms] = useState([]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleFacility = (name) =>
    setFacilities((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );

  const addCustomFacility = () => {
    const v = customFacility.trim();
    if (v && !facilities.includes(v)) setFacilities((p) => [...p, v]);
    setCustomFacility('');
  };

  // ---- Room builder helpers (identical logic to the original form) --------
  const addRoom = () => setRooms((prev) => [...prev, { ...emptyRoom }]);
  const removeRoom = (idx) =>
    setRooms((prev) => prev.filter((_, i) => i !== idx));
  const changeRoom = (idx, field, value) =>
    setRooms((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, [field]: value };
        if (field === 'sharingType')
          next.totalBeds = String(BEDS_BY_SHARING[value] || 1);
        return next;
      })
    );

  // ---- Per-step validation ------------------------------------------------
  const validateStep = (s) => {
    if (s === 1) {
      if (!form.name.trim()) return 'Give your PG a name to continue.';
    }
    if (s === 2) {
      if (!form.address.trim() || !form.city.trim())
        return 'Address and city are required.';
      if (form.latitude === '' || form.longitude === '')
        return 'Add map coordinates (latitude & longitude).';
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  // ---- Publish (create) — preserves the exact original payload contract ---
  const handlePublish = async () => {
    if (useRooms) {
      if (rooms.length === 0) {
        toast.error('Add at least one room, or switch off room-level mode.');
        return;
      }
      const bad = rooms.find(
        (r) => !r.label.trim() || !Number(r.rent) || !Number(r.totalBeds)
      );
      if (bad) {
        toast.error('Every room needs a label, rent, and bed count.');
        return;
      }
    } else if (!Number(form.price) || form.totalRooms === '' || form.availableRooms === '') {
      toast.error('Monthly rent, total rooms and available rooms are required.');
      return;
    }

    try {
      setSaving(true);
      const roomPayload = rooms.map((r) => ({
        label: r.label.trim(),
        sharingType: r.sharingType,
        rent: Number(r.rent),
        deposit: Number(r.deposit) || 0,
        totalBeds: Number(r.totalBeds),
      }));

      const payload = {
        name: form.name,
        description: form.description,
        genderType: form.genderType,
        address: form.address,
        city: form.city,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        price: useRooms ? 0 : Number(form.price),
        securityDeposit: useRooms ? 0 : Number(form.securityDeposit) || 0,
        totalRooms: useRooms ? 0 : Number(form.totalRooms),
        availableRooms: useRooms ? 0 : Number(form.availableRooms),
        facilities,
        ...(useRooms ? { rooms: roomPayload } : { rooms: [] }),
      };

      const res = await createPG(payload);
      toast.success('PG listed — now add some photos');
      if (res?.data?._id) {
        setCreatedId(res.data._id);
        setCreatedImages(res.data.images || []);
        setStep(5);
      } else {
        navigate('/owner/pgs');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const published = Boolean(createdId);

  return (
    <div className="min-h-screen bg-paper py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand mb-2">
            Owner · New listing
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            Add a new PG listing
          </h1>
          <p className="text-ink/60 mt-2">
            Complete the details below to publish your property.
          </p>
        </div>

        {/* Step indicator */}
        <ol className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const state =
              s.n < step ? 'done' : s.n === step ? 'current' : 'todo';
            return (
              <li key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => !published && s.n < step && setStep(s.n)}
                    disabled={published || s.n >= step}
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                      state === 'current'
                        ? 'bg-indigo-brand text-white ring-4 ring-indigo-brand/15'
                        : state === 'done'
                        ? 'bg-indigo-brand text-white'
                        : 'bg-surface-mid text-ink/40'
                    } ${!published && s.n < step ? 'cursor-pointer' : ''}`}
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    {state === 'done' ? '✓' : s.n}
                  </button>
                  <span
                    className={`text-[11px] font-semibold text-center hidden sm:block ${
                      state === 'current' ? 'text-indigo-brand' : 'text-ink/40'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 sm:mx-2 -mt-5 rounded ${
                      s.n < step ? 'bg-indigo-brand' : 'bg-surface-mid'
                    }`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* Card */}
        <div className="bg-white rounded-xl2 shadow-card p-6 sm:p-8">
          {/* STEP 1 — Basic Details */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-5">
                1. Basic details
              </h2>
              <div className="space-y-5">
                <Input
                  label="PG Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Sunrise Enclave PG"
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, genderType: c.value }))
                        }
                        className={`h-control-lg rounded-xl border-2 font-semibold flex flex-col items-center justify-center gap-0.5 transition ${
                          form.genderType === c.value
                            ? 'border-indigo-brand bg-indigo-brand text-white'
                            : 'border-ink/15 text-ink hover:border-indigo-brand/50'
                        }`}
                      >
                        <span className="text-lg leading-none">{c.glyph}</span>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">
                    Short Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the atmosphere and key highlights…"
                    className="w-full rounded-xl border-2 border-ink/15 px-4 py-3 text-ink placeholder:text-ink/40 focus:border-indigo-brand focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-5">
                2. Location
              </h2>
              <div className="space-y-5">
                <Input
                  label="Street Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Building, street, area"
                  required
                />
                <Input
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Bangalore"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="12.9716"
                    required
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="77.5946"
                    required
                  />
                </div>
                <p className="text-sm text-ink/50">
                  Coordinates place your PG on the map for nearby searches. You
                  can copy them from Google Maps by right-clicking your building.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 — Amenities */}
          {step === 3 && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-2">
                3. Amenities
              </h2>
              <p className="text-sm text-ink/60 mb-5">
                Pick everything your property offers. These appear as facilities
                on your listing.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITY_OPTIONS.map((a) => {
                  const on = facilities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleFacility(a)}
                      className={`h-control px-3 rounded-xl border-2 text-sm font-semibold transition ${
                        on
                          ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-brand'
                          : 'border-ink/15 text-ink/70 hover:border-indigo-brand/40'
                      }`}
                    >
                      {on ? '✓ ' : ''}
                      {a}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2">
                <Input
                  label="Add a custom amenity"
                  value={customFacility}
                  onChange={(e) => setCustomFacility(e.target.value)}
                  placeholder="e.g. Rooftop lounge"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomFacility();
                    }
                  }}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomFacility}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {facilities.filter((f) => !AMENITY_OPTIONS.includes(f)).length >
                0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {facilities
                    .filter((f) => !AMENITY_OPTIONS.includes(f))
                    .map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-brand/10 text-indigo-brand text-sm font-semibold"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => toggleFacility(f)}
                          className="text-indigo-brand/60 hover:text-indigo-brand"
                          aria-label={`Remove ${f}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — Rooms & Pricing */}
          {step === 4 && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-5">
                4. Rooms &amp; pricing
              </h2>

              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-ink/10 p-4">
                <input
                  type="checkbox"
                  checked={useRooms}
                  onChange={(e) => setUseRooms(e.target.checked)}
                  className="w-5 h-5 rounded border-ink/20 text-indigo-brand focus:ring-indigo-brand"
                />
                <div>
                  <p className="font-semibold text-ink">
                    Define individual rooms
                  </p>
                  <p className="text-sm text-ink/60">
                    Create room-level listings with per-room rent, sharing type
                    and bed counts.
                  </p>
                </div>
              </label>

              {useRooms ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-ink">
                      Rooms
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRoom}
                    >
                      + Add Room
                    </Button>
                  </div>
                  {rooms.length === 0 && (
                    <p className="text-sm text-ink/50 py-4">
                      No rooms defined yet. Click "Add Room" to create your
                      first room.
                    </p>
                  )}
                  <div className="space-y-4">
                    {rooms.map((room, idx) => (
                      <div
                        key={idx}
                        className="border border-ink/10 rounded-xl p-4 bg-paper"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-ink text-sm">
                            Room {idx + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeRoom(idx)}
                            className="text-danger hover:text-danger/80 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Input
                            label="Label"
                            value={room.label}
                            onChange={(e) =>
                              changeRoom(idx, 'label', e.target.value)
                            }
                            placeholder="e.g. Room 101"
                            required
                          />
                          <div>
                            <label className="block text-sm font-semibold text-ink mb-2">
                              Sharing Type
                            </label>
                            <select
                              value={room.sharingType}
                              onChange={(e) =>
                                changeRoom(idx, 'sharingType', e.target.value)
                              }
                              className="w-full h-control rounded-xl border-2 border-ink/15 px-3 text-ink focus:border-indigo-brand focus:outline-none"
                            >
                              <option value="SINGLE">Single sharing</option>
                              <option value="DOUBLE">Double sharing</option>
                              <option value="TRIPLE">Triple sharing</option>
                            </select>
                          </div>
                          <Input
                            label="Monthly Rent (₹)"
                            type="number"
                            value={room.rent}
                            onChange={(e) =>
                              changeRoom(idx, 'rent', e.target.value)
                            }
                            required
                          />
                          <Input
                            label="Security Deposit (₹)"
                            type="number"
                            value={room.deposit}
                            onChange={(e) =>
                              changeRoom(idx, 'deposit', e.target.value)
                            }
                          />
                          <Input
                            label="Total Beds"
                            type="number"
                            value={room.totalBeds}
                            onChange={(e) =>
                              changeRoom(idx, 'totalBeds', e.target.value)
                            }
                            required
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Rent (₹)"
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Security Deposit (₹)"
                    type="number"
                    name="securityDeposit"
                    value={form.securityDeposit}
                    onChange={handleChange}
                  />
                  <Input
                    label="Total Rooms"
                    type="number"
                    name="totalRooms"
                    value={form.totalRooms}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Available Rooms"
                    type="number"
                    name="availableRooms"
                    value={form.availableRooms}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — Images */}
          {step === 5 && (
            <div>
              <h2 className="font-display font-bold text-xl text-ink mb-2">
                5. Images
              </h2>
              {published ? (
                <>
                  <p className="text-sm text-ink/60 mb-5">
                    Your listing is live. Add up to 8 photos to help tenants
                    picture the place.
                  </p>
                  <ImageUploader
                    pgId={createdId}
                    images={createdImages}
                    onChange={setCreatedImages}
                  />
                  <div className="mt-8 flex justify-end">
                    <Button onClick={() => navigate('/owner/pgs')}>
                      Finish
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-ink/60 py-6">
                  Publish your listing on the previous step to start adding
                  photos.
                </p>
              )}
            </div>
          )}

          {/* Footer nav (hidden once published — step 5 owns its own action) */}
          {!published && (
            <div className="mt-8 flex items-center justify-between border-t border-ink/10 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={step === 1 ? () => navigate('/owner/pgs') : goBack}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </Button>
              {step < 4 && (
                <Button type="button" onClick={goNext}>
                  Next Step
                </Button>
              )}
              {step === 4 && (
                <Button type="button" onClick={handlePublish} loading={saving}>
                  Publish Listing
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
