# Setup Guide — PG Room Booking System

## Prerequisites
- **Node.js** (v18+)
- **MongoDB** (local or Atlas cluster)
- **npm** or **yarn**

## 1. Clone / download the project
This structure assumes you're in the root `PGBOOKING/` folder with `server/` and `client/` subdirectories.

## 2. MongoDB setup
You can use:
- **Local MongoDB:** `mongodb://127.0.0.1:27017/pgbooking`
- **MongoDB Atlas:** Copy your connection string from the Atlas dashboard.

## 3. Server setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and fill in:
```env
MONGO_URI=mongodb://127.0.0.1:27017/pgbooking
JWT_SECRET=your-long-random-secret-here
CLIENT_URL=http://localhost:5173
```

Optional (for full production features):
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM`
- `TWILIO_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM`

> **Demo mode:** If you leave Razorpay/email/WhatsApp keys blank, the app runs in demo mode — payments auto-verify with mock signatures, and emails/WhatsApp are logged to console.

Install dependencies:
```bash
npm install
```

Seed demo data (optional but recommended):
```bash
npm run seed
```

This creates:
- **User:** `alice@example.com` / `password123`
- **Owner:** `raj@example.com` / `password123`
- **Owner:** `priya@example.com` / `password123`
- 5 demo PGs across Bangalore, Noida, Pune, Mumbai

Start the server:
```bash
npm run dev
```

Server runs on **http://localhost:5000**

## 4. Client setup

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=demo
```

If you have real Razorpay keys, replace `demo` with your actual `key_id` (the public one).

Install dependencies:
```bash
npm install
```

Start the dev server:
```bash
npm run dev
```

Client runs on **http://localhost:5173**

## 5. Open the app
Navigate to **http://localhost:5173** in your browser.

## Key flows to test

### As a User (alice@example.com)
1. **Explore PGs** on the home page with the interactive map
2. Apply filters (city, price, rating, distance, gender, availability)
3. Click a PG card to view details, reviews, facilities
4. Click **Book Now** → payment flow (demo mode auto-verifies)
5. Go to **My Bookings** to see your active booking
6. Click **Get Directions** to open Google Maps navigation
7. Add a **review** (1-5 stars + comment)
8. **Cancel** a booking to test the refund policy

### As an Owner (raj@example.com or priya@example.com)
1. **Dashboard** shows occupancy stats, per-PG breakdown, tenant list with rent status
2. **My PGs** — list your properties
3. Click **+ Add PG** to create a new listing (fill lat/lng, facilities, images)
4. **Delete** a PG

### Map interaction
- Hover a **PG card** → its marker highlights on the map
- Click a **map marker** → the card scrolls into view
- Grant location access to see nearby PGs and distance chips

## Production build

### Server
```bash
cd server
npm start
```

### Client
```bash
cd client
npm run build
npm run preview
```

Deploy `client/dist/` to a static host (Vercel, Netlify) and the server to a Node host (Render, Railway, AWS).

## Troubleshooting

**MongoDB connection failed**
- Ensure MongoDB is running locally or your Atlas IP whitelist includes your machine

**Razorpay checkout doesn't open**
- Check browser console for script load errors
- Ensure `VITE_RAZORPAY_KEY_ID` is set (or leave as `demo`)

**Map doesn't show**
- Check browser console — ensure Leaflet CSS loaded
- Grant location permission or use a city filter

**Emails/WhatsApp not sending**
- Check server console — demo mode logs instead of sending
- Verify SMTP/Twilio credentials in `server/.env`

**Rent reminders**
- The cron job runs daily at 9 AM (server time)
- Check server console for `[CRON]` logs

## Refund policy

Current policy (configurable in `server/utils/refund.js`):
- **Within 5 days** of booking start → 80% refund
- **Within 10 days** → 50% refund
- **After 10 days** → 0% refund

An alternate tiered policy (24h/3d) is implemented as `calculateRefundTiered` — swap the function name in `bookingController.cancelBooking` to change policy.

## Tech stack summary
- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, React-Leaflet
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT + bcrypt
- **Payments:** Razorpay (checkout + refund API)
- **Notifications:** Nodemailer (email), Twilio (WhatsApp)
- **Map:** Leaflet (markers), Google Maps (directions link)
- **Cron:** node-cron (daily rent reminders)

## Design notes
The visual language is **wayfinding** — deep indigo ink + marigold "home" accent, **Bricolage Grotesque** display against **Inter** body, with **JetBrains Mono** for data. The signature is the card↔marker two-way link: hovering a card lights its marker and vice-versa, with distance rendered as route-style chips.

---

Questions? Check the code comments or raise an issue in your repo.
