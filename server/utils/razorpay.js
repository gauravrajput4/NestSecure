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
}

// Real payments only: without credentials every gateway call fails loudly rather
// than silently succeeding with mock data, so nobody mistakes a demo run for a
// real charge.
function gateway() {
  if (!razorpayEnabled) {
    throw new Error(
      'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real payments.'
    );
  }
  return instance;
}

/**
 * Create an order. Amount is in rupees.
 * @param {number} amountRupees
 * @param {string} receipt
 */
export async function createOrder(amountRupees, receipt) {
  const amountPaise = Math.round(amountRupees * 100);
  return gateway().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
  });
}

/**
 * Verify the Razorpay checkout signature (HMAC-SHA256 over
 * `orderId|paymentId`). Throws when payments are not configured.
 */
export function verifySignature({ orderId, paymentId, signature }) {
  gateway(); // throws when payments are not configured
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Fetch a captured payment's details (used to persist the customer's card/UPI
 * method metadata after a successful charge).
 * @param {string} paymentId razorpay_payment_id
 */
export async function fetchPayment(paymentId) {
  return gateway().payments.fetch(paymentId);
}

/**
 * Ensure every user has a Razorpay customer so cards can be remembered for
 * one-tap checkout. Reuses an existing id when present.
 * @param {{ customerId?: string, name: string, email?: string, contact?: string }} u
 */
export async function ensureCustomer({ customerId, name, email, contact }) {
  if (customerId) return customerId;
  const customer = await gateway().customers.create({
    name: name || 'Customer',
    email: email || undefined,
    contact: contact || undefined,
    fail_existing: true,
    notes: { source: 'nestsecure' },
  });
  return customer.id;
}

/**
 * Verify a Razorpay webhook signature. Requires RAZORPAY_WEBHOOK_SECRET to be
 * set; without it webhooks are rejected (never trusted blindly).
 * @param {string} rawBody  the raw request body exactly as received
 * @param {string} signature  the X-Razorpay-Signature header
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Issue a refund. Throws when payments are not configured.
 * @param {string} paymentId
 * @param {number} amountRupees
 */
export async function createRefund(paymentId, amountRupees) {
  const amountPaise = Math.round(amountRupees * 100);
  return gateway().payments.refund(paymentId, { amount: amountPaise });
}

/**
 * Create a Razorpay Route linked account + fund account for an owner so we can
 * transfer their share.
 * @param {object} details - { method: 'BANK'|'UPI', accountHolder, accountNumber?, ifsc?, upiId? }
 */
export async function createLinkedAccount(details) {
  const g = gateway();
  // Check if Route APIs are available (contacts, fundAccounts, transfers)
  if (!g.contacts || !g.fundAccounts || !g.transfers) {
    const err = new Error('Razorpay Route (transfers/linked accounts) is not enabled on this account. Contact Razorpay support to enable it, or use a live account with Route access.');
    err.code = 'ROUTE_NOT_ENABLED';
    throw err;
  }
  const contact = await g.contacts.create({
    name: details.accountHolder,
    type: 'vendor',
  });
  const fundAccount =
    details.method === 'UPI'
      ? await g.fundAccounts.create({
          contact_id: contact.id,
          account_type: 'vpa',
          vpa: { address: details.upiId },
        })
      : await g.fundAccounts.create({
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
 * Idempotent via `notes.paymentId`.
 * @param {string} fundAccountId
 * @param {number} amountRupees
 * @param {string} paymentId - used for idempotency key
 */
export async function createTransfer(fundAccountId, amountRupees, paymentId) {
  const g = gateway();
  if (!g.transfers) {
    const err = new Error('Razorpay Route (transfers) is not enabled on this account.');
    err.code = 'ROUTE_NOT_ENABLED';
    throw err;
  }
  const amountPaise = Math.round(amountRupees * 100);
  return g.transfers.create({
    account: fundAccountId,
    amount: amountPaise,
    currency: 'INR',
    notes: { paymentId }, // idempotency: multiple calls with same paymentId won't double-pay
  });
}

/**
 * Reverse a transfer (e.g. on refund).
 * @param {string} transferId
 */
export async function reverseTransfer(transferId) {
  const g = gateway();
  if (!g.transfers) {
    const err = new Error('Razorpay Route (transfers) is not enabled on this account.');
    err.code = 'ROUTE_NOT_ENABLED';
    throw err;
  }
  return g.transfers.reverse(transferId);
}