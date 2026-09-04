/**
 * LOUMOO Excursion Domain Entity
 */

class Excursion {
  constructor(data = {}) {
    this.id = data.id || `exc_${Date.now()}`;
    this.providerId = data.providerId || data.provider_id || '';
    this.title = (data.title || '').trim();
    this.destination = (data.destination || '').trim();
    this.description = data.description || '';
    this.duration = data.duration || '1 Day';
    this.price = Number(data.price ?? 0);
    this.currency = data.currency || 'XAF';
    this.images = Array.isArray(data.images) ? data.images : [];
    this.highlights = Array.isArray(data.highlights) ? data.highlights : [];
    this.included = Array.isArray(data.included) ? data.included : [];
    this.availableSlots = Number(data.availableSlots ?? data.available_slots ?? 20);
    this.status = data.status || 'ACTIVE';
  }

  isAvailable(slots = 1) {
    return this.status === 'ACTIVE' && this.availableSlots >= slots;
  }

  reserve(slots = 1) {
    if (!this.isAvailable(slots)) {
      throw new Error(`Not enough available slots for excursion '${this.title}'`);
    }
    this.availableSlots -= slots;
    return this;
  }

  release(slots = 1) {
    this.availableSlots += slots;
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      title: this.title,
      destination: this.destination,
      description: this.description,
      duration: this.duration,
      price: this.price,
      currency: this.currency,
      images: this.images,
      highlights: this.highlights,
      included: this.included,
      availableSlots: this.availableSlots,
      availability: this.availableSlots > 0,
      status: this.status
    };
  }
}

module.exports = { Excursion };
