/**
 * Resend Transactional Email Client
 */

const config = require('../config');

let resendClient = null;

try {
  const { Resend } = require('resend');

  if (config.resend.apiKey) {
    resendClient = new Resend(config.resend.apiKey);
  }
} catch (err) {
  console.warn('[Resend] resend library not installed yet.');
}

/**
 * Helper to dispatch emails with graceful fallback
 */
async function sendEmail({ to, subject, html, from = 'LOUMOO <noreply@loumoo.cm>' }) {
  if (resendClient) {
    return await resendClient.emails.send({
      from,
      to,
      subject,
      html
    });
  }

  // Fallback direct REST API
  if (config.resend.apiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    return await response.json();
  }

  console.warn('[Resend] Skipping email send (no API key configured):', subject);
  return { simulated: true, to, subject };
}

module.exports = {
  resendClient,
  sendEmail
};
