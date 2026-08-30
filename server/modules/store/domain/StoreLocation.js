/**
 * Store Location Entity — Commercial & Physical Address (05.12)
 * Supports Cameroon/African addressing patterns and public vs private separation.
 */

class StoreLocation {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.country = data.country || 'Cameroon';
    this.region = data.region || 'Littoral';
    this.city = data.city || 'Douala';
    this.districtQuarter = data.district_quarter || data.districtQuarter || 'Akwa';
    this.streetAddress = data.street_address || data.streetAddress || '';
    this.landmark = data.landmark || '';
    this.buildingFloor = data.building_floor || data.buildingFloor || '';
    this.latitude = data.latitude !== undefined ? Number(data.latitude) : 4.0511;
    this.longitude = data.longitude !== undefined ? Number(data.longitude) : 9.7679;
    this.isPublic = data.is_public ?? data.isPublic ?? true;
    this.serviceRadiusKm = Number(data.service_radius_km || data.serviceRadiusKm || 25);
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  getFormattedAddress() {
    const parts = [];
    if (this.streetAddress) parts.push(this.streetAddress);
    if (this.landmark) parts.push(`Near ${this.landmark}`);
    if (this.districtQuarter) parts.push(this.districtQuarter);
    if (this.city) parts.push(this.city);
    if (this.country) parts.push(this.country);
    return parts.join(', ');
  }

  toPublicJSON() {
    if (!this.isPublic) {
      return {
        id: this.id,
        storeId: this.storeId,
        city: this.city,
        region: this.region,
        country: this.country,
        isPublic: false,
        approximateLocation: `${this.city}, ${this.region}`
      };
    }
    return {
      id: this.id,
      storeId: this.storeId,
      country: this.country,
      region: this.region,
      city: this.city,
      districtQuarter: this.districtQuarter,
      streetAddress: this.streetAddress,
      landmark: this.landmark,
      buildingFloor: this.buildingFloor,
      latitude: this.latitude,
      longitude: this.longitude,
      formattedAddress: this.getFormattedAddress(),
      isPublic: true,
      serviceRadiusKm: this.serviceRadiusKm
    };
  }

  toOwnerJSON() {
    return {
      ...this.toPublicJSON(),
      isPublic: this.isPublic,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StoreLocation;
