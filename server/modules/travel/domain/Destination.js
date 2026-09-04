/**
 * LOUMOO Destination Domain Entity
 */

class Destination {
  constructor(data = {}) {
    this.id = data.id || `dst_${(data.city || 'cam').toLowerCase()}`;
    this.name = (data.name || '').trim();
    this.city = (data.city || '').trim();
    this.country = data.country || 'Cameroon';
    this.latitude = Number(data.latitude ?? 0);
    this.longitude = Number(data.longitude ?? 0);
    this.image = data.image || '';
    this.popular = Boolean(data.popular ?? false);
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      city: this.city,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      image: this.image,
      popular: this.popular,
      createdAt: this.createdAt
    };
  }
}

module.exports = { Destination };
