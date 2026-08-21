import mongoose from 'mongoose';

// An individual rentable room within a PG. Sharing type drives how many beds it
// has; each room carries its own rent, deposit and photos so listings match how
// PGs are actually rented.
const roomSchema = new mongoose.Schema({
  label: { type: String, required: true }, // e.g. "Room 2B"
  sharingType: {
    type: String,
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'],
    default: 'SINGLE',
  },
  rent: { type: Number, required: true, min: 0 },
  deposit: { type: Number, default: 0, min: 0 },
  totalBeds: { type: Number, required: true, min: 1 }, // maximum occupancy capacity
  isBooked: { type: Boolean, default: false }, // room is booked as a whole unit
  images: [{ type: String }],
  imageIds: [{ type: String }],
});

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Pricing (monthly rent, INR) — for room-based PGs this is the "from" price
    // (the cheapest room); kept for listing cards + backward compatibility.
    price: { type: Number, required: true, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },

    // Location
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },

    // Gender policy
    genderType: {
      type: String,
      enum: ['BOYS_ONLY', 'GIRLS_ONLY', 'BOTH'],
      default: 'BOTH',
    },

    // Room availability (aggregate). When `rooms` is populated these are kept in
    // sync as the count of physical rooms; legacy PGs use them directly.
    totalRooms: { type: Number, required: true, min: 1 },
    availableRooms: { type: Number, required: true, min: 0 },

    // Individual rooms (optional — legacy PGs may have none)
    rooms: { type: [roomSchema], default: [] },

    // Media + amenities
    images: [{ type: String }], // Cloudinary secure URLs (consumed by the gallery)
    imageIds: [{ type: String }], // parallel Cloudinary public ids, for cleanup
    facilities: [{ type: String }], // e.g. ["WiFi", "Food", "AC", "Laundry"]

    // Ratings (denormalized for fast listing)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Recompute aggregate room counts + "from" price from the rooms array.
// Call before saving a PG whose rooms changed.
// totalRooms = number of physical rooms
// availableRooms = number of rooms where isBooked === false
pgSchema.methods.syncRoomAggregates = function () {
  if (this.rooms && this.rooms.length > 0) {
    this.totalRooms = this.rooms.length;
    this.availableRooms = this.rooms.filter((r) => !r.isBooked).length;
    this.price = Math.min(...this.rooms.map((r) => r.rent));
    this.securityDeposit = Math.min(...this.rooms.map((r) => r.deposit));
  }
  return this;
};

// Geospatial-friendly compound index for listing filters
pgSchema.index({ city: 1, price: 1, rating: -1 });

export default mongoose.model('PG', pgSchema);
