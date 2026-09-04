/**
 * LOUMOO Ticket Domain Entity & QR Payload Security Generator
 */

const crypto = require('crypto');

const TICKET_STATUS = {
  VALID: 'VALID',
  USED: 'USED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED'
};

class Ticket {
  constructor(data = {}) {
    this.id = data.id || `tkt_${crypto.randomUUID()}`;
    this.userId = data.userId || '';
    this.bookingId = data.bookingId || '';
    this.ticketNumber = data.ticketNumber || this.generateTicketNumber(data.type);
    this.status = (data.status || TICKET_STATUS.VALID).toUpperCase();
    this.issuedAt = data.issuedAt || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    
    // Non-sensitive server-signed QR payload
    this.qrPayload = data.qrPayload || this.generateQrPayload(data);
  }

  generateTicketNumber(type = 'bus') {
    const prefixes = {
      flight: 'TK-FLT',
      bus: 'TK-BUS',
      train: 'TK-TRN',
      ride: 'TK-RDE',
      hotel: 'TK-HTL',
      excursion: 'TK-EXC',
      visa: 'TK-VSA'
    };
    const prefix = prefixes[type] || 'TK-TRV';
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${Date.now().toString().slice(-6)}-${randomHex}`;
  }

  generateQrPayload(context = {}) {
    // Generate an authoritative verification hash without leaking sensitive PII or credentials
    const rawData = {
      v: '1.0',
      tkt: this.ticketNumber,
      bkg: this.bookingId,
      ref: context.reference || context.bookingReference || '',
      type: context.type || 'bus',
      seat: context.seat || (context.passengers?.[0]?.seat) || '',
      dep: context.departureTime || context.itinerary?.departureTime || '',
      iat: this.issuedAt
    };

    // Compact token format with tamper-resistant HMAC signature
    const payloadStr = JSON.stringify(rawData);
    const signature = crypto
      .createHmac('sha256', process.env.LOUMOO_TICKET_SECRET || 'loumoo_digital_ticket_secret_key')
      .update(payloadStr)
      .digest('hex')
      .slice(0, 16);

    return JSON.stringify({
      data: rawData,
      sig: signature
    });
  }

  validate() {
    return this.status === TICKET_STATUS.VALID;
  }

  markUsed() {
    if (this.status !== TICKET_STATUS.VALID) {
      throw new Error(`Cannot use ticket with status '${this.status}'`);
    }
    this.status = TICKET_STATUS.USED;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  cancel() {
    if (this.status === TICKET_STATUS.CANCELLED) return this;
    if (this.status === TICKET_STATUS.USED) {
      throw new Error('Cannot cancel a used ticket');
    }
    this.status = TICKET_STATUS.CANCELLED;
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      bookingId: this.bookingId,
      ticketNumber: this.ticketNumber,
      qrPayload: this.qrPayload,
      status: this.status,
      issuedAt: this.issuedAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Ticket, TICKET_STATUS };
