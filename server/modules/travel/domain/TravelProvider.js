/**
 * LOUMOO Travel Provider Domain Entity
 */

class TravelProvider {
  constructor(data = {}) {
    this.id = data.id || `prv_${Date.now()}`;
    this.name = (data.name || '').trim();
    this.type = (data.type || 'bus').toLowerCase(); // bus, train, flight, ride, hotel, excursion, agency
    this.logo = data.logo || '';
    this.description = data.description || '';
    this.contact = data.contact || { phone: '', email: '', website: '', address: '' };
    this.rating = Number(data.rating ?? 4.5);
    this.verificationStatus = data.verificationStatus || data.verification_status || 'VERIFIED';
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  isVerified() {
    return this.verificationStatus === 'VERIFIED';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      logo: this.logo,
      description: this.description,
      contact: this.contact,
      rating: this.rating,
      verificationStatus: this.verificationStatus,
      isVerified: this.isVerified(),
      createdAt: this.createdAt
    };
  }
}

module.exports = { TravelProvider };
