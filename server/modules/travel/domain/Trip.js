/**
 * LOUMOO Trip Domain Entity (Powers "My Trips" itinerary view)
 */

class Trip {
  constructor(data = {}) {
    this.id = data.id || `trp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.userId = data.userId || 'usr_guest';
    this.bookingId = data.bookingId || '';
    this.bookingReference = data.bookingReference || data.reference || '';
    this.type = (data.type || 'bus').toLowerCase();
    this.providerName = data.providerName || data.provider || 'LOUMOO Travel';
    this.origin = data.origin || '';
    this.destination = data.destination || '';
    this.departure = data.departure || data.departureTime || '';
    this.arrival = data.arrival || data.arrivalTime || '';
    this.status = (data.status || 'UPCOMING').toUpperCase(); // UPCOMING, ACTIVE, COMPLETED, CANCELLED
    this.passenger = data.passenger || data.passengerName || '';
    this.seat = data.seat || '';
    this.details = data.details || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  cancel() {
    if (this.status === 'CANCELLED') return this;
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot cancel a completed trip');
    }
    this.status = 'CANCELLED';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  complete() {
    if (this.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled trip');
    }
    this.status = 'COMPLETED';
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      bookingId: this.bookingId,
      bookingReference: this.bookingReference,
      type: this.type,
      provider: this.providerName,
      providerName: this.providerName,
      origin: this.origin,
      destination: this.destination,
      departure: this.departure,
      arrival: this.arrival,
      status: this.status,
      passenger: this.passenger,
      seat: this.seat,
      details: this.details,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Trip };
