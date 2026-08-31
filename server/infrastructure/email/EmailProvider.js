/**
 * Email Provider Interface & Resend Implementation
 * Handles transactional emails, welcome flows, and security alerts
 */

const { Resend } = require('resend');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');
const { ExternalServiceError } = require('../../shared/errors/AppError');

let resendInstance = null;

if (config.resend.apiKey) {
  try {
    resendInstance = new Resend(config.resend.apiKey);
    logger.info('[EmailProvider] Resend client initialized.');
  } catch (err) {
    logger.error('[EmailProvider] Failed to initialize Resend client', err);
  }
}

class EmailProvider {
  /**
   * Dispatch transactional email
   */
  async send({ to, subject, html, text = '', from = 'LOUMOO <noreply@loumoo.cm>' }) {
    if (!to || !subject) {
      throw new Error('Recipient and subject are required for sending email');
    }

    if (!config.resend.apiKey) {
      // In production a missing key is a failure, not a quiet no-op: an order
      // confirmation that was never sent must not report itself as sent.
      if (config.isProduction) {
        throw new ExternalServiceError('Resend', 'RESEND_API_KEY is not configured', { subject });
      }
      logger.warn(`[EmailProvider] RESEND_API_KEY not set — email to ${to} was NOT sent: ${subject}`);
      return { id: null, sent: false, reason: 'RESEND_API_KEY not configured' };
    }

    try {
      if (resendInstance) {
        const result = await resendInstance.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || undefined
        });
        logger.info(`[EmailProvider] Email sent to ${to} (${result.id || 'ok'})`);
        return result;
      }
    } catch (err) {
      logger.error(`[EmailProvider] Failed sending email to ${to}`, err);
      throw new ExternalServiceError('Resend', err.message, { to, subject });
    }
  }

  /**
   * Standard Welcome Email Template
   */
  async sendWelcomeEmail(userEmail, userName = 'Valued Member') {
    return this.send({
      to: userEmail,
      subject: 'Welcome to LOUMOO — Universal Commerce Ecosystem',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #111;">
          <h1 style="color: #007aff; font-size: 24px;">Welcome to LOUMOO, ${userName}!</h1>
          <p style="font-size: 15px; line-height: 1.6;">Your universal digital commerce account is ready. Explore physical goods, verified hotel suites, intercity transit, and services across Central Africa.</p>
          <div style="margin: 24px 0;">
            <a href="${config.baseUrl}/app" style="background: #007aff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open LOUMOO App</a>
          </div>
          <p style="font-size: 12px; color: #888;">LOUMOO Support · Douala & Yaoundé, Cameroon</p>
        </div>
      `
    });
  }
}

module.exports = new EmailProvider();
