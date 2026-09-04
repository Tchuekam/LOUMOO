/**
 * LOUMOO Travel Booking Domain Entity & State Machine
 */

const crypto = require('crypto');

const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED'
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING_PAYMENT',
  REQUIRES_PAYMENT: 'REQUIRES_PAYMENT',
  PAID: 'PAID',
  REFUND_PENDING: 'REFUND_PENDING',
  REFUNDED: 'REFUNDED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED'
};

const SERVICE_TYPES = {
  FLIGHT: 'flight',
  BUS: 'bus',
  TRAIN: 'train',
  RIDE: 'ride',
  HOTEL: 'hotel',
  EXCURSION: 'excursion',
  VISA: 'visa',
  // Backwards compatibility alias
  TOUR: 'tour',
  TAXI: 'ride'
};

class BookingPassenger {
  constructor(data = {}) {
    this.id = data.id || `psg_${crypto.randomUUID().slice(0, 8)}`;
    this.name = (data.name || '').trim();
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.seat = data.seat || '';
    this.passportNumber = data.passportNumber || data.passport || data.idNumber || '';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      email: this.email,
      seat: this.seat,
      passportNumber: this.passportNumber
    };
  }
}

class Booking {
  constructor(data = {}) {
    this.id = data.id || `bkg_${crypto.randomUUID()}`;
    this.userId = data.userId || 'usr_guest';
    this.type = (data.type || SERVICE_TYPES.BUS).toLowerCase();
    this.itemId = data.itemId || data.scheduleId || data.hotelId || data.roomId || data.excursionId || this.id;
    this.reference = data.bookingReference || data.reference || this.generateReference(this.type);
    this.idempotencyKey = data.idempotencyKey || null;
    
    // Status must conform to explicit states
    const rawStatus = (data.status || BOOKING_STATUS.CONFIRMED).toUpperCase();
    this.status = Object.values(BOOKING_STATUS).includes(rawStatus) ? rawStatus : BOOKING_STATUS.CONFIRMED;

    // Itinerary details
    this.itinerary = data.itinerary || {};

    // Passengers roster
    this.passengers = Array.isArray(data.passengers)
      ? data.passengers.map(p => (p instanceof BookingPassenger ? p : new BookingPassenger(p)))
      : [];

    // Authoritative Server Pricing
    this.pricing = {
      baseAmount: Number(data.pricing?.baseAmount ?? data.pricing?.subtotal ?? data.amount ?? 0),
      serviceFee: Number(data.pricing?.serviceFee ?? 0),
      taxes: Number(data.pricing?.taxes ?? 0),
      totalAmount: Number(data.pricing?.totalAmount ?? data.amount ?? 0),
      currency: data.pricing?.currency || data.currency || 'XAF'
    };
    this.amount = this.pricing.totalAmount;
    this.currency = this.pricing.currency;

    // Explicit, provider-agnostic payment state (no fake provider or transaction ID)
    this.payment = {
      method: data.payment?.method || null,
      status: data.payment?.status || PAYMENT_STATUS.PENDING,
      transactionRef: data.payment?.transactionRef || null,
      gatewayProvider: data.payment?.gatewayProvider || null,
      paidAt: data.payment?.paidAt || null
    };

    this.cancellationReason = data.cancellationReason || '';
    this.qrCodePayload = data.qrCodePayload || `LMT:${this.reference}:${this.id}`;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  generateReference(type = 'bus') {
    const prefixes = {
      flight: 'LMT-FLT',
      bus: 'LMT-BUS',
      train: 'LMT-TRN',
      ride: 'LMT-RDE',
      taxi: 'LMT-RDE',
      hotel: 'LMT-HTL',
      excursion: 'LMT-EXC',
      tour: 'LMT-EXC',
      visa: 'LMT-VSA'
    };
    const prefix = prefixes[type] || 'LMT-TRV';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${randomDigits}`;
  }

  canCancel() {
    return this.status === BOOKING_STATUS.CONFIRMED || this.status === BOOKING_STATUS.PENDING;
  }

  cancel(reason = 'User requested cancellation') {
    if (this.status === BOOKING_STATUS.CANCELLED) {
      throw new Error(`Cannot cancel a booking with status 'CANCELLED'`);
    }
    if (this.status === BOOKING_STATUS.COMPLETED) {
      throw new Error(`Cannot cancel a booking with status 'COMPLETED'`);
    }
    if (this.status === BOOKING_STATUS.EXPIRED) {
      throw new Error(`Cannot cancel a booking with status 'EXPIRED'`);
    }
    if (!this.canCancel()) {
      throw new Error(`Cannot cancel a booking with status '${this.status}'`);
    }

    this.status = BOOKING_STATUS.CANCELLED;
    this.cancellationReason = reason;
    if (this.payment.status === PAYMENT_STATUS.PAID) {
      this.payment.status = PAYMENT_STATUS.REFUND_PENDING;
    } else if (this.payment.status === PAYMENT_STATUS.PENDING) {
      this.payment.status = PAYMENT_STATUS.CANCELLED;
    }
    this.updatedAt = new Date().toISOString();
    return this;
  }

  confirm() {
    if (this.status === BOOKING_STATUS.CANCELLED) {
      throw new Error(`Cannot confirm a booking with status 'CANCELLED'`);
    }
    if (this.status === BOOKING_STATUS.COMPLETED) {
      throw new Error(`Cannot confirm a booking with status 'COMPLETED'`);
    }
    this.status = BOOKING_STATUS.CONFIRMED;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  complete() {
    if (this.status === BOOKING_STATUS.CANCELLED) {
      throw new Error(`Cannot complete a booking with status 'CANCELLED'`);
    }
    this.status = BOOKING_STATUS.COMPLETED;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  /**
   * Provider-agnostic payment confirmation method.
   * Ready for future real payment provider integration without coupling.
   */
  recordPaymentConfirmation({ provider, transactionRef, amount, confirmedAt } = {}) {
    if (!provider || typeof provider !== 'string') {
      throw new Error('A legitimate payment provider identifier is required');
    }
    if (!transactionRef || typeof transactionRef !== 'string') {
      throw new Error('A legitimate transaction reference is required from payment provider');
    }
    if (this.status === BOOKING_STATUS.CANCELLED) {
      throw new Error(`Cannot apply payment confirmation to cancelled booking '${this.reference}'`);
    }
    if (this.payment.status === PAYMENT_STATUS.PAID) {
      throw new Error(`Booking '${this.reference}' has already been paid`);
    }

    this.payment.status = PAYMENT_STATUS.PAID;
    this.payment.gatewayProvider = provider;
    this.payment.transactionRef = transactionRef;
    this.payment.paidAt = confirmedAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      itemId: this.itemId,
      bookingReference: this.reference,
      reference: this.reference,
      idempotencyKey: this.idempotencyKey,
      status: this.status,
      amount: this.amount,
      currency: this.currency,
      pricing: this.pricing,
      itinerary: this.itinerary,
      passengers: this.passengers.map(p => (typeof p.toJSON === 'function' ? p.toJSON() : p)),
      payment: this.payment,
      qrCodePayload: this.qrCodePayload,
      cancellationReason: this.cancellationReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  Booking,
  BookingPassenger,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  SERVICE_TYPES
};
