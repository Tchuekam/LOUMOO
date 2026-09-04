/**
 * LOUMOO Commerce Core — Server-Authoritative Pricing Engine
 * ---------------------------------------------------------------------------
 * Sole authoritative path for all financial calculations in Commerce Orders.
 * Operates strictly in integer minor units (XAF) to eliminate floating point errors.
 * Rejects any client-dictated price manipulation.
 */

const { ValidationError } = require('../../../shared/errors/AppError');
const { DELIVERY_METHOD } = require('./Order');

const DEFAULT_STANDARD_SHIPPING_XAF = 3000;

class PricingEngine {
  /**
   * Authoritatively calculates line totals, subtotal, shipping fee, and grand total.
   *
   * @param {Array<{quantity: number, unitPriceXaf: number, listing?: object}>} evaluatedItems
   * @param {object} options
   * @param {string} [options.deliveryMethod='HOME_DELIVERY']
   * @param {number|null} [options.clientSuppliedTotal=null]
   * @returns {{subtotalXaf: number, shippingFeeXaf: number, totalAmountXaf: number, lineItems: Array}}
   */
  static calculateOrderPricing(evaluatedItems, {
    deliveryMethod = DELIVERY_METHOD.HOME_DELIVERY,
    clientSuppliedTotal = null
  } = {}) {
    if (!Array.isArray(evaluatedItems) || evaluatedItems.length === 0) {
      throw new ValidationError('Cannot calculate pricing for an empty order.');
    }

    let subtotalXaf = 0;
    const lineItems = [];

    for (const item of evaluatedItems) {
      const quantity = item.quantity;
      const unitPriceXaf = item.unitPriceXaf;

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new ValidationError(`Invalid quantity: ${quantity}. Must be a positive integer.`);
      }
      if (!Number.isInteger(unitPriceXaf) || unitPriceXaf < 0) {
        throw new ValidationError(`Invalid unit price: ${unitPriceXaf}. Must be a non-negative integer.`);
      }

      // Safe integer arithmetic check
      const totalLineXaf = unitPriceXaf * quantity;
      if (!Number.isSafeInteger(totalLineXaf)) {
        throw new ValidationError('Order total exceeds maximum safe integer calculation limit.');
      }

      subtotalXaf += totalLineXaf;
      if (!Number.isSafeInteger(subtotalXaf)) {
        throw new ValidationError('Order subtotal exceeds maximum safe integer calculation limit.');
      }

      lineItems.push({
        ...item,
        totalLineXaf
      });
    }

    // Determine authoritative shipping fee
    let shippingFeeXaf = 0;
    if (deliveryMethod === DELIVERY_METHOD.STORE_PICKUP) {
      shippingFeeXaf = 0;
    } else {
      // Check if any listing defines custom fulfillment rules
      let maxCustomDeliveryFee = null;
      let freeDeliveryThreshold = null;

      for (const item of evaluatedItems) {
        const fulfillment = item.listing?.fulfillment || item.listing?.metadata?.fulfillment;
        if (fulfillment && typeof fulfillment === 'object') {
          if (Number.isInteger(fulfillment.deliveryFeeMinor)) {
            maxCustomDeliveryFee = Math.max(maxCustomDeliveryFee || 0, fulfillment.deliveryFeeMinor);
          }
          if (Number.isInteger(fulfillment.freeDeliveryOverMinor)) {
            freeDeliveryThreshold = fulfillment.freeDeliveryOverMinor;
          }
        }
      }

      if (freeDeliveryThreshold != null && subtotalXaf >= freeDeliveryThreshold) {
        shippingFeeXaf = 0;
      } else if (maxCustomDeliveryFee != null) {
        shippingFeeXaf = maxCustomDeliveryFee;
      } else {
        shippingFeeXaf = DEFAULT_STANDARD_SHIPPING_XAF;
      }
    }

    const totalAmountXaf = subtotalXaf + shippingFeeXaf;

    // Discrepancy check against client-supplied total
    if (clientSuppliedTotal != null && clientSuppliedTotal !== undefined) {
      const clientTotalNum = Number(clientSuppliedTotal);
      if (!Number.isFinite(clientTotalNum) || clientTotalNum !== totalAmountXaf) {
        throw new ValidationError(
          `Pricing mismatch: client requested total of XAF ${clientSuppliedTotal} ` +
          `does not match server authoritative total of XAF ${totalAmountXaf} ` +
          `(Subtotal: XAF ${subtotalXaf} + Shipping: XAF ${shippingFeeXaf}).`
        );
      }
    }

    return {
      subtotalXaf,
      shippingFeeXaf,
      totalAmountXaf,
      lineItems
    };
  }

  /**
   * Compares client-submitted item price against server price.
   * Throws ValidationError on mismatch.
   */
  static assertItemPriceMatch(clientItem, serverUnitPriceXaf, itemTitle = 'item') {
    const rawClientPrice = clientItem.unitPriceXaf ?? clientItem.unitPrice ?? clientItem.price ?? clientItem.unitPriceMinor;
    if (rawClientPrice != null && rawClientPrice !== undefined) {
      const parsedClientPrice = Number(rawClientPrice);
      if (!Number.isFinite(parsedClientPrice) || parsedClientPrice !== serverUnitPriceXaf) {
        throw new ValidationError(
          `Unit price mismatch on "${itemTitle}": client specified XAF ${rawClientPrice}, ` +
          `but server authoritative price is XAF ${serverUnitPriceXaf}.`
        );
      }
    }
  }
}

module.exports = {
  PricingEngine,
  DEFAULT_STANDARD_SHIPPING_XAF
};
