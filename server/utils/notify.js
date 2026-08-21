import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const COMPANY_NAME = process.env.COMPANY_NAME || 'PG Booking';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const COMPANY_SUPPORT_EMAIL = process.env.COMPANY_SUPPORT_EMAIL || process.env.MAIL_FROM || '';
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || CLIENT_URL;

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

export function createInteractiveEmail({
  userName = 'Customer',
  subject = 'Update',
  title = subject,
  message,
  details = [],
  ctaText = 'Open PG Booking',
  ctaUrl = CLIENT_URL,
  footerNote = 'If you need help, reply to this email and our team will assist you.',
}) {
  const year = new Date().getFullYear();
  const safeUserName = escapeHtml(userName);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = escapeHtml(ctaUrl);
  const safeFooterNote = escapeHtml(footerNote);
  const safeCompanyName = escapeHtml(COMPANY_NAME);
  const safeCompanyWebsite = escapeHtml(COMPANY_WEBSITE);
  const safeSupportEmail = escapeHtml(COMPANY_SUPPORT_EMAIL);

  // Email-client-safe font stack (Inter where available, graceful system fallback).
  const FONT =
    "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const detailList = details.filter(
    (d) => d?.label && d?.value !== undefined && d?.value !== null
  );
  const detailRows = detailList
    .map(
      (d) => `
        <tr>
          <td style="padding:11px 20px;border-top:1px solid #ECEEF6;color:#6b7280;font-size:13px;font-weight:600;font-family:${FONT};">${escapeHtml(
            d.label
          )}</td>
          <td style="padding:11px 20px;border-top:1px solid #ECEEF6;color:#151c27;font-size:13px;font-weight:600;text-align:right;font-family:${FONT};">${escapeHtml(
            d.value
          )}</td>
        </tr>`
    )
    .join('');

  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safeTitle} — ${safeCompanyName}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f3ff;margin:0;padding:32px 0;">
    <tr>
      <td align="center" style="padding:0 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e7f2;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:30px 32px;background:#4f46e5;">
              <div style="font-size:11px;letter-spacing:1.5px;color:#c7d2fe;font-weight:700;text-transform:uppercase;font-family:${FONT};">${safeCompanyName}</div>
              <div style="margin-top:10px;font-size:23px;line-height:1.3;font-weight:700;color:#ffffff;font-family:${FONT};">${safeTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 12px 0;font-size:15px;color:#151c27;font-weight:600;font-family:${FONT};">Hi ${safeUserName},</p>
              <p style="margin:0;font-size:14.5px;line-height:1.7;color:#3f4656;font-family:${FONT};">${safeMessage}</p>
              ${
                detailRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border:1px solid #e4e7f2;border-radius:12px;background:#f9f9ff;overflow:hidden;">
                       <tr><td colspan="2" style="padding:14px 20px 2px 20px;font-size:11px;color:#7a8194;font-weight:700;letter-spacing:0.8px;font-family:${FONT};">DETAILS</td></tr>
                       ${detailRows}
                     </table>`
                  : ''
              }
              ${
                ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
                       <tr>
                         <td align="center" bgcolor="#4f46e5" style="border-radius:10px;">
                           <a href="${safeCtaUrl}" target="_blank" style="display:inline-block;padding:13px 26px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:10px;font-family:${FONT};">
                             ${safeCtaText}
                           </a>
                         </td>
                       </tr>
                     </table>`
                  : ''
              }
              <p style="margin:22px 0 0 0;font-size:12.5px;line-height:1.6;color:#7a8194;font-family:${FONT};">${safeFooterNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#f9f9ff;border-top:1px solid #e4e7f2;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;font-family:${FONT};">
                ${safeCompanyName}${
    COMPANY_SUPPORT_EMAIL
      ? ` &nbsp;·&nbsp; <a href="mailto:${safeSupportEmail}" style="color:#4f46e5;text-decoration:none;">${safeSupportEmail}</a>`
      : ''
  }${
    COMPANY_WEBSITE
      ? ` &nbsp;·&nbsp; <a href="${safeCompanyWebsite}" style="color:#4f46e5;text-decoration:none;">Visit website</a>`
      : ''
  }
              </p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#9aa1b2;font-family:${FONT};">&copy; ${year} ${safeCompanyName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function createWhatsAppMessage({ userName = 'Customer', message, ctaUrl = '' }) {
  const parts = [
    `Hi ${userName},`,
    '',
    `*${COMPANY_NAME}*`,
    `${message}`,
  ];
  if (ctaUrl) {
    parts.push('', `View: ${ctaUrl}`);
  }
  parts.push('', 'Thank you,', `Team ${COMPANY_NAME}`);
  return parts.join('\n');
}

/**
 * Decide which channels a notification should use for a given user, honoring
 * their saved notification preferences (User.notifications).
 *
 * @param {object} user  Mongoose User doc (or a plain object with `.notifications`)
 * @param {string} pref  preference key, e.g. 'bookingUpdates' | 'rentReminders'
 * @returns {{email: boolean, whatsapp: boolean}}
 */
export function notifyChannels(user, pref) {
  const n = user?.notifications || {};
  const enabled = n[pref] !== false;
  if (!enabled) return { email: false, whatsapp: false };
  const channel = n.channel || 'EMAIL';
  return {
    email: channel !== 'WHATSAPP',
    whatsapp: channel !== 'EMAIL',
  };
}

// ---------- Email ----------
const smtpReady =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

let transporter = null;
if (smtpReady) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendEmail(to, subject, html) {
  if (!smtpReady) {
    console.log(`[EMAIL:demo] to=${to} subject="${subject}"`);
    return { demo: true };
  }
  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@pgbooking.app',
    to,
    subject,
    html,
  });
}

// ---------- WhatsApp (Twilio) ----------
const twilioReady = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN;
let twilioClient = null;
if (twilioReady) {
  twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendWhatsApp(toPhone, message) {
  if (!twilioReady || !toPhone) {
    console.log(`[WHATSAPP:demo] to=${toPhone} message="${message}"`);
    return { demo: true };
  }
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  const from = process.env.TWILIO_WHATSAPP_FROM?.startsWith('whatsapp:')
    ? process.env.TWILIO_WHATSAPP_FROM
    : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
  return twilioClient.messages.create({
    from,
    to,
    body: message,
  });
}
