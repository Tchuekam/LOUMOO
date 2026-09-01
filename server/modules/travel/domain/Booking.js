/**
 * LOUMOO Travel Booking Domain Entity & State Machine
 */

const crypto = require('crypto');

const BOOKING_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

const SERVICE_TYPES = {
  FLIGHT: 'flight',
  BUS: 'bus',
  TRAIN: 'train',
  TAXI: 'taxi',
  TOUR: 'tour',
  VISA: 'visa'
};

class Booking {
  constructor(data) {
    this.id = data.id || `bkg_${crypto.randomUUID()}`;
    this.reference = data.reference || this.generateReference(data.type);
    this.type = data.type || SERVICE_TYPES.BUS;
    this.userId = data.userId || 'usr_guest';
    this.status = data.status || BOOKING_STATUS.CONFIRMED;
    
    this.itinerary = data.itinerary || {};
    this.passengers = Array.isArray(data.passengers) ? data.passengers : [];
    this.pricing = {
      baseAmount: Number(data.pricing?.baseAmount || 0),
      serviceFee: Number(data.pricing?.serviceFee || 0),
      taxes: Number(data.pricing?.taxes || 0),
      totalAmount: Number(data.pricing?.totalAmount || 0),
      currency: data.pricing?.currency || 'XAF'
    };

    this.payment = {
      method: data.payment?.method || 'mtn_momo',
      status: data.payment?.status || 'PAID',
      transactionRef: data.payment?.transactionRef || `TXN-${Date.now()}`
    };

    this.qrCodePayload = data.qrCodePayload || this.generateQrPayload();
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateReference(type = 'bus') {
    const prefixes = {
      flight: 'LMT-FLT',
      bus: 'LMT-BUS',
      train: 'LMT-TRN',
      taxi: 'LMT-TAX',
      tour: 'LMT-PKG',
      visa: 'LMT-VSA'
    };
    const prefix = prefixes[type] || 'LMT-TRV';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomDigits}`;
  }

  generateQrPayload() {
    return JSON.stringify({
      ref: this.reference,
      bkgId: this.id,
      type: this.type,
      user: this.userId,
      route: `${this.itinerary.origin || 'DLA'} -> ${this.itinerary.destination || 'YAO'}`,
      issuedAt: this.createdAt
    });
  }

  canCancel() {
    return this.status === BOOKING_STATUS.CONFIRMED || this.status === BOOKING_STATUS.PENDING_PAYMENT;
  }

  cancel(reason = 'User requested cancellation') {
    if (!this.canCancel()) {
      throw new Error(`Cannot cancel a booking with status '${this.status}'`);
    }
    this.status = BOOKING_STATUS.CANCELLED;
    this.cancellationReason = reason;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      reference: this.reference,
      type: this.type,
      userId: this.userId,
      status: this.status,
      itinerary: this.itinerary,
      passengers: this.passengers,
      pricing: this.pricing,
      payment: this.payment,
      qrCodePayload: this.qrCodePayload,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  Booking,
  BOOKING_STATUS,
  SERVICE_TYPES
};
