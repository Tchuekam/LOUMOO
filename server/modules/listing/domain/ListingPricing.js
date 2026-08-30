/**
 * ListingPricing Domain Model
 * Safe multi-currency monetary handling in integer minor units.
 */

const { ValidationError } = require('../../../shared/errors/AppError');

const SUPPORTED_CURRENCIES = Object.freeze({
  XAF: { symbol: 'FCFA', decimals: 0, name: 'Central African CFA Franc' },
  NGN: { symbol: '₦', decimals: 2, name: 'Nigerian Naira' },
  GHS: { symbol: 'GH₵', decimals: 2, name: 'Ghanaian Cedi' },
  KES: { symbol: 'KSh', decimals: 2, name: 'Kenyan Shilling' },
  USD: { symbol: '$', decimals: 2, name: 'US Dollar' },
  EUR: { symbol: '€', decimals: 2, name: 'Euro' },
  GBP: { symbol: '£', decimals: 2, name: 'British Pound' }
});

class ListingPricing {
  constructor(data = {}) {
    this.currency = (data.currency || 'XAF').toUpperCase();
    if (!SUPPORTED_CURRENCIES[this.currency]) {
      throw new ValidationError(`Unsupported currency: ${this.currency}. Supported: ${Object.keys(SUPPORTED_CURRENCIES).join(', ')}`);
    }

    this.basePriceMinor = Number(data.base_price_minor ?? data.basePriceMinor ?? 0);
    this.salePriceMinor = data.sale_price_minor !== undefined || data.salePriceMinor !== undefined
      ? Number(data.sale_price_minor ?? data.salePriceMinor)
      : null;
    this.compareAtPriceMinor = data.compare_at_price_minor !== undefined || data.compareAtPriceMinor !== undefined
      ? Number(data.compare_at_price_minor ?? data.compareAtPriceMinor)
      : null;

    if (this.basePriceMinor < 0) {
      throw new ValidationError('Base price cannot be negative.');
    }
    if (this.salePriceMinor !== null && this.salePriceMinor < 0) {
      throw new ValidationError('Sale price cannot be negative.');
    }
    if (this.salePriceMinor !== null && this.salePriceMinor > this.basePriceMinor) {
      throw new ValidationError('Sale price cannot be greater than base price.');
    }
  }

  get effectivePriceMinor() {
    return this.salePriceMinor !== null ? this.salePriceMinor : this.basePriceMinor;
  }

  get isDiscounted() {
    return this.salePriceMinor !== null && this.salePriceMinor < this.basePriceMinor;
  }

  get discountPercentage() {
    if (!this.isDiscounted || this.basePriceMinor === 0) return 0;
    return Math.round(((this.basePriceMinor - this.salePriceMinor) / this.basePriceMinor) * 100);
  }

  get formattedPrice() {
    const meta = SUPPORTED_CURRENCIES[this.currency];
    const val = meta.decimals === 0 ? this.effectivePriceMinor : (this.effectivePriceMinor / Math.pow(10, meta.decimals));
    return `${val.toLocaleString('fr-FR').replace(/\s+/g, ' ')} ${this.currency}`;
  }

  toJSON() {
    return {
      currency: this.currency,
      basePriceMinor: this.basePriceMinor,
      salePriceMinor: this.salePriceMinor,
      compareAtPriceMinor: this.compareAtPriceMinor,
      effectivePriceMinor: this.effectivePriceMinor,
      isDiscounted: this.isDiscounted,
      discountPercentage: this.discountPercentage,
      formattedPrice: this.formattedPrice
    };
  }
}

module.exports = ListingPricing;
