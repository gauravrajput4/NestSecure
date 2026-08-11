import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

export const razorpayEnabled = Boolean(KEY_ID && KEY_SECRET);

let instance = null;
if (razorpayEnabled) {
  instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
} else {
  console.warn('⚠ Razorpay keys not set — running payments in DEMO mode (mock orders/refunds).');
}

/**
 * Create an order. In demo mode returns a synthetic order object.
 * @param {number} amountRupees
 */
export async function createOrder(amountRupees, receipt) {
  const amountPaise = Math.round(amountRupees * 100);
  if (!razorpayEnabled) {
    return {
      id: `order_demo_${Date.now()}`,
      amount: amountPaise,
      currency: 'INR',
      receipt,
      demo: true,
    };
  }
  return instance.orders.create({ amount: amountPaise, currency: 'INR', receipt });
}

/**
 * Verify the Razorpay checkout signature.
 * In demo mode any signature starting with "demo_" is accepted.
 */
export function verifySignature({ orderId, paymentId, signature }) {
  if (!razorpayEnabled) {
    return typeof signature === 'string' && signature.startsWith('demo_');
  }
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Issue a refund. Demo mode returns a synthetic refund object.
 * @param {string} paymentId
 * @param {number} amountRupees
 */
export async function createRefund(paymentId, amountRupees) {
  const amountPaise = Math.round(amountRupees * 100);
  if (!razorpayEnabled) {
    return { id: `rfnd_demo_${Date.now()}`, amount: amountPaise, status: 'processed', demo: true };
  }
  return instance.payments.refund(paymentId, { amount: amountPaise });
}

/**
 * Create a Razorpay Route linked account + fund account for an owner so we can
 * transfer their share. In demo mode returns synthetic IDs.
 * @param {object} details - { method: 'BANK'|'UPI', accountHolder, accountNumber?, ifsc?, upiId? }
 */
export async function createLinkedAccount(details) {
  if (!razorpayEnabled) {
    return {
      accountId: `acc_demo_${Date.now()}`,
      fundAccountId: `fa_demo_${Date.now()}`,
      demo: true,
    };
  }
  // Real flow: create a contact, then a fund account under that contact.
  const contact = await instance.contacts.create({
    name: details.accountHolder,
    type: 'vendor',
  });
  const fundAccount =
    details.method === 'UPI'
      ? await instance.fundAccounts.create({
          contact_id: contact.id,
          account_type: 'vpa',
          vpa: { address: details.upiId },
        })
      : await instance.fundAccounts.create({
          contact_id: contact.id,
          account_type: 'bank_account',
          bank_account: {
            name: details.accountHolder,
            account_number: details.accountNumber,
            ifsc: details.ifsc,
          },
        });
  return {
    accountId: contact.id,
    fundAccountId: fundAccount.id,
  };
}

/**
 * Transfer funds from the platform to an owner's linked account (Route transfer).
 * Idempotent via `notes.paymentId`. In demo mode returns a synthetic transfer.
 * @param {string} fundAccountId
 * @param {number} amountRupees
 * @param {string} paymentId - used for idempotency key
 */
export async function createTransfer(fundAccountId, amountRupees, paymentId) {
  const amountPaise = Math.round(amountRupees * 100);
  if (!razorpayEnabled) {
    return {
      id: `trf_demo_${Date.now()}`,
      amount: amountPaise,
      status: 'processed',
      demo: true,
    };
  }
  return instance.transfers.create({
    account: fundAccountId,
    amount: amountPaise,
    currency: 'INR',
    notes: { paymentId }, // idempotency: multiple calls with same paymentId won't double-pay
  });
}

/**
 * Reverse a transfer (e.g. on refund). In demo mode returns a synthetic reversal.
 * @param {string} transferId
 */
export async function reverseTransfer(transferId) {
  if (!razorpayEnabled || transferId.startsWith('trf_demo_')) {
    return {
      id: `rev_demo_${Date.now()}`,
      amount: 0,
      status: 'processed',
      demo: true,
    };
  }
  return instance.transfers.reverse(transferId);
}
