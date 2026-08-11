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

  const detailRows = details
    .filter((d) => d?.label && d?.value !== undefined && d?.value !== null)
    .map(
      (d) => `
        <tr>
          <td style="padding:10px 0;color:#475569;font-size:13px;font-weight:600;">${escapeHtml(d.label)}</td>
          <td style="padding:10px 0;color:#0f172a;font-size:13px;text-align:right;">${escapeHtml(d.value)}</td>
        </tr>`
    )
    .join('');

  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safeTitle} | ${safeCompanyName}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;margin:0;padding:28px 0;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px;background:#1d4ed8;background-image:linear-gradient(135deg,#1d4ed8 0%,#7c3aed 100%);">
              <div style="font-size:11px;letter-spacing:1px;color:#dbeafe;font-weight:700;">${safeCompanyName.toUpperCase()}</div>
              <div style="margin-top:10px;font-size:24px;line-height:1.35;font-weight:700;color:#ffffff;">${safeTitle}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 10px 0;font-size:15px;color:#0f172a;">Hi ${safeUserName},</p>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">${safeMessage}</p>
              ${
                detailRows
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;padding:0 14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
                       <tr><td style="padding:12px 0 2px 0;font-size:12px;color:#64748b;font-weight:700;letter-spacing:0.3px;">DETAIL SUMMARY</td></tr>
                       ${detailRows}
                     </table>`
                  : ''
              }
              ${
                ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:22px;">
                       <tr>
                         <td style="border-radius:8px;background:#0f172a;">
                           <a href="${safeCtaUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
                             ${safeCtaText}
                           </a>
                         </td>
                       </tr>
                     </table>`
                  : ''
              }
              <p style="margin:18px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;">${safeFooterNote}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                ${safeCompanyName}
                ${COMPANY_SUPPORT_EMAIL ? ` | Support: <a href="mailto:${safeSupportEmail}" style="color:#1d4ed8;text-decoration:none;">${safeSupportEmail}</a>` : ''}
                ${COMPANY_WEBSITE ? ` | <a href="${safeCompanyWebsite}" style="color:#1d4ed8;text-decoration:none;">Website</a>` : ''}
              </p>
              <p style="margin:4px 0 0 0;font-size:11px;color:#94a3b8;">&copy; ${year} ${safeCompanyName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export function createWhatsAppMessage({ userName = 'Customer', message, ctaUrl = '' }) {
  const lines = [
    `Hi ${userName},`,
    `${COMPANY_NAME} update: ${message}`,
    ctaUrl ? `Open: ${ctaUrl}` : '',
    `Thank you,`,
    `${COMPANY_NAME}`,
  ].filter(Boolean);
  return lines.join('\n');
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
