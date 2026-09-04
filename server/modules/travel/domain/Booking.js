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

    // Payment state
    this.payment = {
      method: data.payment?.method || 'mtn_momo',
      status: data.payment?.status || 'PENDING_PAYMENT',
      transactionRef: data.payment?.transactionRef || `TXN-${Date.now()}`
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
    if (!this.canCancel()) {
      throw new Error(`Cannot cancel a booking with status '${this.status}'`);
    }
    this.status = BOOKING_STATUS.CANCELLED;
    this.cancellationReason = reason;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  confirm() {
    this.status = BOOKING_STATUS.CONFIRMED;
    this.payment.status = 'PAID';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  complete() {
    this.status = BOOKING_STATUS.COMPLETED;
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
  SERVICE_TYPES
};
