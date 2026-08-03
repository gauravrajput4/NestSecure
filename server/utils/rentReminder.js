import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import PG from '../models/PG.js';
import RentInvoice from '../models/RentInvoice.js';
import { sendEmail, sendWhatsApp } from './notify.js';

/**
 * Rent reminder cron job — runs daily at 9 AM.
 * Sends reminders 3 days before due, and overdue alerts 2 days after due.
 */
export function startRentReminderJob() {
  // Runs daily at 09:00
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[CRON] Running rent reminder job...');
      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      // 1. Find bookings with rent due in 3 days (reminder)
      const upcoming = await Booking.find({
        bookingStatus: 'CONFIRMED',
        rentStatus: 'DUE',
        nextDueDate: {
          $gte: today,
          $lte: threeDaysFromNow,
        },
      })
        .populate('user')
        .populate('pg');

      for (const b of upcoming) {
        await sendRentReminder(b, 'upcoming');
      }

      // 2. Find overdue bookings (due date was 2+ days ago, not yet paid)
      const overdue = await Booking.find({
        bookingStatus: 'CONFIRMED',
        rentStatus: { $in: ['DUE', 'OVERDUE'] },
        nextDueDate: { $lte: twoDaysAgo },
      })
        .populate('user')
        .populate('pg');

      for (const b of overdue) {
        b.rentStatus = 'OVERDUE';
        await b.save();
        await sendRentReminder(b, 'overdue');
      }

      // Flip any past-due ledger invoices to OVERDUE so the tenant's ledger and
      // the booking status stay consistent.
      const overdueInvoices = await RentInvoice.updateMany(
        { status: 'DUE', dueDate: { $lt: today } },
        { $set: { status: 'OVERDUE' } }
      );

      console.log(
        `[CRON] Sent ${upcoming.length} reminders, ${overdue.length} overdue alerts, flagged ${overdueInvoices.modifiedCount} overdue invoices.`
      );
    } catch (err) {
      console.error('[CRON] Rent reminder error:', err);
    }
  });

  console.log('✓ Rent reminder cron job started (daily at 09:00)');
}

async function sendRentReminder(booking, type) {
  const user = booking.user;
  const pg = booking.pg;
  const dueDate = new Date(booking.nextDueDate).toLocaleDateString('en-IN');

  const subject =
    type === 'overdue' ? 'Rent Overdue — Action Required' : 'Rent Due Soon';

  const message =
    type === 'overdue'
      ? `Hi ${user.name}, your rent for ${pg.name} was due on ${dueDate} and is now overdue. Please pay at the earliest to avoid late fees.`
      : `Hi ${user.name}, your rent for ${pg.name} is due on ${dueDate}. Please ensure timely payment.`;

  const html = `
    <h3>${subject}</h3>
    <p>${message}</p>
    <p><strong>PG:</strong> ${pg.name}<br/>
    <strong>Monthly Rent:</strong> ₹${booking.monthlyRent}<br/>
    <strong>Due Date:</strong> ${dueDate}</p>
  `;

  await sendEmail(user.email, subject, html);
  if (user.phone) {
    await sendWhatsApp(user.phone, message);
  }
}
