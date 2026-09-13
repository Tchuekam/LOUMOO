/**
 * LOUMOO Travel — Payment Verification Service
 * ---------------------------------------------------------------------------
 * A booking may only become PAID on the word of a payment provider, never on
 * the word of the client. This service is the single trust boundary for that
 * transition.
 *
 * PRODUCTION STATUS: **BLOCKED BY EXTERNAL DEPENDENCY.**
 * No mobile-money or card gateway is integrated in this codebase (no MTN MoMo,
 * Orange Money, Campay, Flutterwave or card processor configuration exists).
 * Until one is wired in, `verify()` refuses to attest any settlement in
 * production rather than fabricating one — which is what the previous
 * implementation did by generating its own `TXN-...` reference.
 *
 * To integrate a real provider, implement `_verifyWithProvider()` so it calls
 * the gateway's transaction-status API and confirms BOTH that the transaction
 * succeeded AND that its amount and currency match the booking total.
 */

const config = require('../../../config/env');
const { ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

/** Raised when settlement cannot be attested by a trusted source. */
class PaymentUnavailableError extends ValidationError {
  constructor(message) {
    super(message);
    this.name = 'PaymentUnavailableError';
    this.code = 'PAYMENT_GATEWAY_UNAVAILABLE';
    this.statusCode = 503;
  }
}

class PaymentVerificationService {
  constructor() {
    // Set only in development/test to exercise the post-payment flow without a
    // gateway. Deliberately ignored when NODE_ENV === 'production'.
    this.simulationEnabled =
      process.env.LOUMOO_ALLOW_SIMULATED_PAYMENTS === 'true' &&
      config.isProduction !== true;
  }

  get isGatewayConfigured() {
    // No provider adapter exists yet. Flipped on when one is implemented.
    return false;
  }

  /**
   * Attests that `transactionRef` represents a real, settled payment for
   * `expectedAmount`. Returns the attested settlement record, or throws.
   */
  async verify({ provider, transactionRef, expectedAmount, currency = 'XAF' } = {}) {
    if (!provider || typeof provider !== 'string') {
      throw new ValidationError('A payment provider identifier is required');
    }
    if (!transactionRef || typeof transactionRef !== 'string' || transactionRef.trim().length < 6) {
      throw new ValidationError(
        'A provider transaction reference is required to confirm payment. ' +
        'LOUMOO does not generate transaction references on the client\'s behalf.'
      );
    }

    if (this.isGatewayConfigured) {
      return this._verifyWithProvider({ provider, transactionRef, expectedAmount, currency });
    }

    if (this.simulationEnabled) {
      logger.warn(
        `[PaymentVerification] SIMULATED settlement accepted for ref '${transactionRef}' ` +
        `(${expectedAmount} ${currency}). This path is disabled in production.`
      );
      return {
        verified: true,
        simulated: true,
        provider,
        transactionRef: transactionRef.trim(),
        amount: expectedAmount,
        currency,
        confirmedAt: new Date().toISOString()
      };
    }

    logger.error(
      `[PaymentVerification] Refused to confirm booking payment: no gateway configured ` +
      `(provider='${provider}', ref='${transactionRef}').`
    );
    throw new PaymentUnavailableError(
      'Online payment is not available yet: no payment provider is connected to this deployment. ' +
      'Your reservation is held as unpaid — please complete payment through an agent. ' +
      'No money has been taken.'
    );
  }

  /* eslint-disable-next-line no-unused-vars */
  async _verifyWithProvider({ provider, transactionRef, expectedAmount, currency }) {
    // Intentionally unimplemented — see file header.
    throw new PaymentUnavailableError('Payment provider adapter is not implemented.');
  }
}

const paymentVerificationService = new PaymentVerificationService();

module.exports = {
  PaymentVerificationService,
  paymentVerificationService,
  PaymentUnavailableError
};
