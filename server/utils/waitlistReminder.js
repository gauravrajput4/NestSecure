import cron from 'node-cron';
import { processExpiredWaitlists } from '../controllers/waitlistController.js';

/**
 * Waitlist expiry cron job — runs every hour.
 * Marks expired waitlist entries as EXPIRED and notifies the next user in line.
 */
export function startWaitlistExpiryJob() {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Processing expired waitlist entries...');
      await processExpiredWaitlists();
    } catch (err) {
      console.error('[CRON] Waitlist expiry job failed:', err);
    }
  });
}