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

/**
 * A city name reduced to what matters for matching: no accents, no punctuation, one
 * space between words, lower case. "Yaoundé" and "Yaounde" are the same city (the
 * seeded rate table says "Yaounde"; people type "Yaoundé"). The browser applies the
 * SAME rule (build_redesign.py, resolveCityDeliveryFee), so the delivery fee shown at
 * checkout is the fee the order is priced at.
 */
function foldCity(name) {
  return String(name == null ? '' : name)
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/ +/g, ' ')
    .trim();
}

/** The configured delivery fee (integer XAF) for a city, or null when it is not in the table. */
function resolveCityRate(cityRates, city) {
  if (!cityRates || typeof cityRates !== 'object' || !city) return null;
  const wanted = foldCity(city);
  if (!wanted) return null;
  for (const [cityName, rate] of Object.entries(cityRates)) {
    if (foldCity(cityName) === wanted && Number.isInteger(Number(rate)) && Number(rate) >= 0) return Number(rate);
  }
  return null;
}

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
    clientSuppliedTotal = null,
    standardShippingFeeXaf = null
  } = {}) {
    if (!Array.isArray(evaluatedItems) || evaluatedItems.length === 0) {
      throw new ValidationError('Cannot calculate pricing for an empty order.');
    }

    let subtotalXaf = 0;
    const lineItems = [];

    for (const item of evaluatedItems) {
      if (!item || typeof item !== 'object') {
        throw new ValidationError('Invalid item in evaluation payload.');
      }
      const qty = Number(item.quantity);
      const price = Number(item.unitPriceXaf);

      if (!Number.isInteger(qty) || qty <= 0) {
        throw new ValidationError(`Quantity must be a positive integer, got ${item.quantity}.`);
      }
      if (!Number.isInteger(price) || price < 0) {
        throw new ValidationError(`Price must be a non-negative integer, got ${item.unitPriceXaf}.`);
      }

      // Integer arithmetic is only exact up to Number.MAX_SAFE_INTEGER; past that a
      // product or sum silently rounds, so refuse the order instead of mispricing it.
      const lineTotalXaf = qty * price;
      if (!Number.isSafeInteger(lineTotalXaf)) {
        throw new ValidationError(
          `Line total for ${qty} x XAF ${price} exceeds the maximum safe integer calculation limit.`
        );
      }

      subtotalXaf += lineTotalXaf;
      if (!Number.isSafeInteger(subtotalXaf)) {
        throw new ValidationError('Order subtotal exceeds the maximum safe integer calculation limit.');
      }

      lineItems.push({
        listingId: item.listing?.id || item.listingId || null,
        variantId: item.variantId || null,
        title: item.listing?.title || item.title || 'Item',
        sku: item.sku || null,
        unitPriceXaf: price,
        quantity: qty,
        lineTotalXaf,
        sellerId: item.sellerId || item.listing?.sellerId || null,
        storeId: item.storeId || item.listing?.storeId || null,
        storeName: item.storeName || item.listing?.storeName || null,
        storePhone: item.storePhone || item.listing?.storePhone || null,
        imageUrl: item.imageUrl || null
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
      } else if (Number.isInteger(standardShippingFeeXaf) && standardShippingFeeXaf >= 0) {
        shippingFeeXaf = standardShippingFeeXaf;
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
  DEFAULT_STANDARD_SHIPPING_XAF,
  foldCity,
  resolveCityRate
};
