/**
 * Store Profile Entity — Extended Public Storefront Details (05.04)
 */

class StoreProfile {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.tagline = data.tagline || '';
    this.bio = data.bio || '';
    this.returnPolicy = data.return_policy || data.returnPolicy || '7-day return policy for unopened items.';
    this.warrantyPolicy = data.warranty_policy || data.warrantyPolicy || '12-month standard warranty on electronics.';
    this.shippingPolicy = data.shipping_policy || data.shippingPolicy || 'Same-day delivery in Douala & Yaoundé; 24-48h nationwide.';
    this.socialLinks = data.social_links || data.socialLinks || {
      whatsapp: '',
      facebook: '',
      instagram: '',
      website: ''
    };
    this.badges = data.badges || ['fast_shipping', 'escrow_ready'];
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      tagline: this.tagline,
      bio: this.bio,
      returnPolicy: this.returnPolicy,
      warrantyPolicy: this.warrantyPolicy,
      shippingPolicy: this.shippingPolicy,
      socialLinks: this.socialLinks,
      badges: this.badges,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StoreProfile;
