# PG Room Booking System

A full-stack MERN application for discovering, booking, and managing PG (paying-guest)
accommodations — with an interactive map, room-availability tracking, gender rules,
Razorpay payments + refunds, reviews, an owner dashboard, and automated rent reminders.

## Tech stack
- **Frontend:** React (Vite), Tailwind CSS, React Router, Axios, Context API, React-Leaflet
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT + bcrypt
- **Integrations:** Razorpay (payment + refund), Nodemailer (email), Twilio (WhatsApp),
  Leaflet (map), Google Maps (directions link only), node-cron (rent reminders)

## Repository layout
```
/client        React app (Vite)
  /src
    /components
    /pages
    /context
    /services
/server        Express API
  /config
  /controllers
  /routes
  /models
  /middleware
  /utils
```

## Quick start

### 1. Backend
```bash
cd server
cp .env.example .env      # fill in your secrets (see below)
npm install
npm run seed              # optional: load demo PGs + users
npm run dev               # starts on http://localhost:5000
```

### 2. Frontend
```bash
cd client
cp .env.example .env      # set VITE_API_URL + VITE_RAZORPAY_KEY_ID
npm install
npm run dev               # starts on http://localhost:5173
```

## Environment variables (`server/.env`)
| Key | Purpose | Required? |
|-----|---------|-----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Signs auth tokens | Yes |
| `CLIENT_URL` | CORS origin (e.g. http://localhost:5173) | Yes |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments + refunds | Optional* |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Email | Optional* |
| `TWILIO_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | WhatsApp | Optional* |

\* **Demo mode:** if a provider's keys are absent the app degrades gracefully —
payments are auto-verified with a mock signature, emails/WhatsApp are logged to the
console instead of sent. This lets you run the whole flow with only Mongo + JWT set.

## Cancellation / refund policy
Configured in one place: `server/utils/refund.js`.

| Time since booking start | Refund |
|--------------------------|--------|
| within 5 days            | 80%    |
| within 10 days           | 50%    |
| after 10 days            | 0%     |

> The original brief also mentioned a 24h/3-day tiered policy. Both rule sets live in
> `refund.js` as named functions — swap `calculateRefund` in `bookingController` to
> change policy in a single line.

## Key routes
- `GET  /api/pg` — public listing (filters: price, rating, gender, availability, city, distance)
- `GET  /api/pg/:id` — public PG detail
- `POST /api/auth/register` · `POST /api/auth/login`
- `POST /api/booking` — book a room (auth required, gender + availability validated)
- `POST /api/payment/order` · `POST /api/payment/verify`
- `POST /api/booking/cancel` — refund per policy, releases the room
- `POST /api/review` — add a rating
- `GET  /api/owner/dashboard` — owner stats + per-room occupancy

## Security notes
JWT middleware guards private routes, passwords are bcrypt-hashed, all write endpoints
run input validation, and every secret is read from `.env` (never committed —
`.env.example` is the template).
