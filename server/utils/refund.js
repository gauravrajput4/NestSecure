/**
 * Refund / cancellation policy.
 *
 * The project brief contained two different tier definitions. Both are implemented
 * here as pure functions so the policy can be swapped in ONE place
 * (see bookingController.cancelBooking -> `calculateRefund`).
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(from, to) {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * ACTIVE POLICY (from the user's elaboration):
 *   within 5 days  -> 80%
 *   within 10 days -> 50%
 *   after 10 days  -> 0%
 */
export function calculateRefund(amountPaid, startDate, now = new Date()) {
  const days = daysBetween(new Date(startDate), now);
  let percent = 0;
  if (days <= 5) percent = 80;
  else if (days <= 10) percent = 50;
  else percent = 0;
  return {
    percent,
    amount: Math.round((amountPaid * percent) / 100),
    daysSinceStart: days,
  };
}

/**
 * ALTERNATE POLICY (original Step 10 tiers). Kept for easy switching.
 *   within 24h  -> 100%
 *   within 3 days -> 50%
 *   after 3 days  -> 0%
 */
export function calculateRefundTiered(amountPaid, startDate, now = new Date()) {
  const hours = (now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60);
  let percent = 0;
  if (hours <= 24) percent = 100;
  else if (hours <= 72) percent = 50;
  else percent = 0;
  return {
    percent,
    amount: Math.round((amountPaid * percent) / 100),
    hoursSinceStart: Math.floor(hours),
  };
}
