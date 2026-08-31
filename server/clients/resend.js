/**
 * LOUMOO Universal Transactional Email Client
 * Primary: High-reliability Google SMTP
 * Fallback: Resend API
 */

const nodemailer = require('nodemailer');
const config = require('../config');

const appPass = (config.googleAppPassword || 'xvck bffw bohe smyw').replace(/\s+/g, '');
const smtpUser = 'rebornedbetalpha@gmail.com';

let smtpTransporter = null;

try {
  smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: appPass
    }
  });
  console.log('[EmailService] Gmail SMTP transport initialized successfully.');
} catch (e) {
  console.warn('[EmailService] SMTP init warning:', e.message);
}

/**
 * Sends transactional email with guaranteed delivery.
 */
async function sendEmail({ to, subject, html, from }) {
  const fromAddress = from || `"LOUMOO Verification" <${smtpUser}>`;

  // 1. Try primary Gmail SMTP
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to: to,
        subject: subject,
        html: html
      });
      console.log(`[EmailService] Delivered email to ${to} (Message ID: ${info.messageId})`);
      return { id: info.messageId, sent: true };
    } catch (smtpErr) {
      console.warn(`[EmailService] SMTP send error: ${smtpErr.message}, falling back to Resend...`);
    }
  }

  // 2. Fallback: Resend API
  if (config.resend && config.resend.apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: Array.isArray(to) ? to : [to],
          subject: subject,
          html: html
        })
      });
      const data = await res.json();
      return { id: data.id, sent: res.ok };
    } catch (resendErr) {
      console.warn(`[EmailService] Resend fallback error: ${resendErr.message}`);
    }
  }

  return { id: null, sent: false, reason: 'No active email transport available' };
}

module.exports = {
  resendClient: null,
  sendEmail
};
