/**
 * Resend Transactional Email Client
 */

const config = require('../config');

let resendClient = null;

try {
  const { Resend } = require('resend');

  if (config.resend.apiKey) {
    resendClient = new Resend(config.resend.apiKey);
    console.log('[Resend] Client initialized.');
  } else {
    console.warn('[Resend] RESEND_API_KEY not configured — email sending is DISABLED.');
  }
} catch (err) {
  console.warn('[Resend] resend library not installed yet.');
}

/**
 * Helper to dispatch emails.
 * Returns Resend's send result; throws on API errors so callers never see a
 * fabricated success. With no key configured it returns an explicit
 * `sent: false` result and logs loudly.
 */
async function sendEmail({ to, subject, html, from = 'LOUMOO <noreply@loumoo.cm>' }) {
  if (resendClient) {
    const result = await resendClient.emails.send({ from, to, subject, html });
    return result;
  }

  // Fallback direct REST API (library unavailable but key present)
  if (config.resend.apiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.resend.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Resend API error HTTP ${response.status}: ${data.message || data.name || 'unknown'}`);
    }
    return data;
  }

  console.warn(`[Resend] Email NOT sent (no API key configured): ${subject}`);
  return { id: null, sent: false, reason: 'RESEND_API_KEY not configured', to, subject };
}

module.exports = {
  resendClient,
  sendEmail
};
