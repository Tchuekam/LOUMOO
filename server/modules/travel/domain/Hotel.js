/**
 * LOUMOO Hotel & Room Domain Entities
 */

class Room {
  constructor(data = {}) {
    this.id = data.id || `rm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.hotelId = data.hotelId || data.hotel_id || '';
    this.name = (data.name || '').trim();
    this.description = data.description || '';
    this.capacity = Number(data.capacity ?? 2);
    this.price = Number(data.price ?? 0); // nightly rate
    this.currency = data.currency || 'XAF';
    this.totalInventory = Number(data.totalInventory ?? data.total_inventory ?? 5);
    this.availableInventory = Number(data.availableInventory ?? data.available_inventory ?? this.totalInventory);
    this.amenities = Array.isArray(data.amenities) ? data.amenities : [];
    this.images = Array.isArray(data.images) ? data.images : [];
    this.cancellationPolicy = data.cancellationPolicy || data.cancellation_policy || 'FREE_CANCELLATION_24H';
  }

  isAvailable(requestedRooms = 1) {
    return this.availableInventory >= requestedRooms;
  }

  calculateStayPrice(nights = 1, roomsCount = 1) {
    const validNights = Math.max(1, Number(nights) || 1);
    const validRooms = Math.max(1, Number(roomsCount) || 1);
    const subtotal = this.price * validNights * validRooms;
    const taxes = 0;
    const serviceFee = Math.round(subtotal * 0.02); // 2% service fee
    return {
      nightlyPrice: this.price,
      nights: validNights,
      roomsCount: validRooms,
      subtotal,
      serviceFee,
      taxes,
      totalAmount: subtotal + serviceFee + taxes,
      currency: this.currency
    };
  }

  toJSON() {
    return {
      id: this.id,
      hotelId: this.hotelId,
      name: this.name,
      description: this.description,
      capacity: this.capacity,
      price: this.price,
      nightlyPrice: this.price,
      currency: this.currency,
      availability: this.availableInventory > 0,
      totalInventory: this.totalInventory,
      availableInventory: this.availableInventory,
      amenities: this.amenities,
      images: this.images,
      cancellationPolicy: this.cancellationPolicy
    };
  }
}

class Hotel {
  constructor(data = {}) {
    this.id = data.id || `htl_${Date.now()}`;
    this.providerId = data.providerId || data.provider_id || '';
    this.name = (data.name || '').trim();
    this.description = data.description || '';
    this.location = (data.location || '').trim();
    this.city = (data.city || '').trim();
    this.country = data.country || 'Cameroon';
    this.latitude = Number(data.latitude ?? 0);
    this.longitude = Number(data.longitude ?? 0);
    this.rating = Number(data.rating ?? 4.5);
    this.amenities = Array.isArray(data.amenities) ? data.amenities : [];
    this.images = Array.isArray(data.images) ? data.images : [];
    this.priceFrom = Number(data.priceFrom ?? data.price_from ?? 0);
    this.currency = data.currency || 'XAF';
    this.status = data.status || 'ACTIVE';
    this.rooms = Array.isArray(data.rooms)
      ? data.rooms.map(r => (r instanceof Room ? r : new Room({ ...r, hotelId: this.id })))
      : [];
    
    // Dynamically calculate priceFrom if rooms exist
    if (this.rooms.length > 0 && (!this.priceFrom || this.priceFrom === 0)) {
      this.priceFrom = Math.min(...this.rooms.map(r => r.price));
    }
  }

  getRoomById(roomId) {
    return this.rooms.find(r => r.id === roomId) || null;
  }

  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      name: this.name,
      description: this.description,
      location: this.location,
      city: this.city,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      rating: this.rating,
      amenities: this.amenities,
      images: this.images,
      priceFrom: this.priceFrom,
      currency: this.currency,
      status: this.status,
      rooms: this.rooms.map(r => r.toJSON())
    };
  }
}

module.exports = { Hotel, Room };
