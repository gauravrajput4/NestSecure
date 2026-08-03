import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import PG from '../models/PG.js';

dotenv.config();

const users = [
  {
    name: 'Site Admin',
    email: 'admin@roomward.com',
    phone: '+919000000000',
    password: 'admin123',
    role: 'ADMIN',
    gender: 'OTHER',
  },
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+919876543210',
    password: 'password123',
    role: 'USER',
    gender: 'FEMALE',
  },
  {
    name: 'Raj Kumar',
    email: 'raj@example.com',
    phone: '+919876543211',
    password: 'password123',
    role: 'OWNER',
    gender: 'MALE',
  },
  {
    name: 'Priya Singh',
    email: 'priya@example.com',
    phone: '+919876543212',
    password: 'password123',
    role: 'OWNER',
    gender: 'FEMALE',
  },
];

const pgs = [
  {
    name: 'Sunrise Residency',
    description:
      'Cozy PG near IT park with 24x7 WiFi, food, and laundry. Walking distance to major companies.',
    price: 8000,
    securityDeposit: 8000,
    address: 'MG Road, Koramangala, Bangalore',
    city: 'Bangalore',
    latitude: 12.9352,
    longitude: 77.6245,
    genderType: 'BOTH',
    totalRooms: 20,
    availableRooms: 12,
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
    facilities: ['WiFi', 'Food', 'AC', 'Laundry', 'Power Backup'],
    rating: 4.5,
    reviewCount: 23,
  },
  {
    name: 'Green Valley PG',
    description: 'Boys-only PG with spacious rooms, gym, and rooftop terrace.',
    price: 6500,
    securityDeposit: 6500,
    address: 'Sector 62, Noida',
    city: 'Noida',
    latitude: 28.6271,
    longitude: 77.3714,
    genderType: 'BOYS_ONLY',
    totalRooms: 15,
    availableRooms: 5,
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
    facilities: ['WiFi', 'Food', 'Gym', 'Parking'],
    rating: 4.2,
    reviewCount: 18,
  },
  {
    name: 'Shanti Niwas Ladies Hostel',
    description:
      'Safe and comfortable girls-only accommodation with CCTV, mess, and housekeeping.',
    price: 7000,
    securityDeposit: 7000,
    address: 'Viman Nagar, Pune',
    city: 'Pune',
    latitude: 18.5679,
    longitude: 73.9143,
    genderType: 'GIRLS_ONLY',
    totalRooms: 18,
    availableRooms: 8,
    images: ['https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800'],
    facilities: ['WiFi', 'Food', 'AC', 'Laundry', 'CCTV', 'Warden'],
    rating: 4.7,
    reviewCount: 31,
  },
  {
    name: 'Urban Stay',
    description: 'Modern co-living space with community events and work-from-home desks.',
    price: 9500,
    securityDeposit: 9500,
    address: 'Bandra West, Mumbai',
    city: 'Mumbai',
    latitude: 19.0596,
    longitude: 72.8295,
    genderType: 'BOTH',
    totalRooms: 25,
    availableRooms: 0, // FULL
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    facilities: ['WiFi', 'Food', 'AC', 'Workspace', 'Events', 'Gym'],
    rating: 4.8,
    reviewCount: 42,
  },
  {
    name: 'Lakeside Homes',
    description: 'Peaceful PG near lake with garden and meditation area.',
    price: 7500,
    securityDeposit: 5000,
    address: 'Ulsoor, Bangalore',
    city: 'Bangalore',
    latitude: 12.9816,
    longitude: 77.6163,
    genderType: 'BOTH',
    totalRooms: 12,
    availableRooms: 7,
    images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
    facilities: ['WiFi', 'Food', 'Garden', 'Power Backup'],
    rating: 4.3,
    reviewCount: 15,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await PG.deleteMany({});
    console.log('Cleared old data');

    // Insert users one-by-one so the pre('save') password-hash hook runs
    // (insertMany bypasses document middleware).
    const createdUsers = [];
    for (const u of users) {
      createdUsers.push(await User.create(u));
    }
    console.log(`Created ${createdUsers.length} users`);

    // Assign owners to PGs (array is now: admin, alice, raj, priya)
    const [, , owner1, owner2] = createdUsers;
    pgs[0].owner = owner1._id;
    pgs[1].owner = owner1._id;
    pgs[2].owner = owner2._id;
    pgs[3].owner = owner2._id;
    pgs[4].owner = owner1._id;

    const createdPGs = await PG.insertMany(pgs);
    console.log(`Created ${createdPGs.length} PGs`);

    console.log('\n✓ Seed complete!');
    console.log('\nDemo accounts:');
    console.log('  Admin: admin@roomward.com / admin123');
    console.log('  User:  alice@example.com / password123');
    console.log('  Owner: raj@example.com   / password123');
    console.log('  Owner: priya@example.com / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
