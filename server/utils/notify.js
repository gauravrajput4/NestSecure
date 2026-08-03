import nodemailer from 'nodemailer';
import twilio from 'twilio';

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
  return twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body: message,
  });
}
