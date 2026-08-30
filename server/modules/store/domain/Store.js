/**
 * Store Entity — Domain Model (05.01 - 05.12)
 */

class Store {
  constructor(data = {}) {
    this.id = data.id || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.name = data.name || '';
    this.slug = data.slug || Store.generateSlug(data.name || '');
    this.description = data.description || '';
    this.categoryId = data.category_id || data.categoryId || 'electronics';
    this.logoUrl = data.logo_url || data.logoUrl || null;
    this.coverUrl = data.cover_url || data.coverUrl || null;
    this.phoneNumber = data.phone_number || data.phoneNumber || '';
    this.email = data.email || '';
    this.websiteUrl = data.website_url || data.websiteUrl || '';
    this.status = data.status || 'DRAFT'; // DRAFT, PENDING_VERIFICATION, ACTIVE, SUSPENDED, CLOSED, ARCHIVED
    this.visibility = data.visibility || 'PUBLIC'; // PUBLIC, PRIVATE, UNLISTED
    this.isVerified = data.is_verified ?? data.isVerified ?? false;
    this.verificationTier = data.verification_tier || data.verificationTier || 'unverified';
    this.rating = Number(data.rating || 5.0);
    this.ratingCount = Number(data.rating_count || data.ratingCount || 0);
    this.followerCount = Number(data.follower_count || data.followerCount || 0);
    this.productCount = Number(data.product_count || data.productCount || 0);
    this.onboardingStep = data.onboarding_step || data.onboardingStep || 'NOT_STARTED';
    this.onboardingCompleted = data.onboarding_completed ?? data.onboardingCompleted ?? false;
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
    this.deletedAt = data.deleted_at || data.deletedAt || null;
  }

  static generateSlug(name) {
    if (!name) return 'store-' + Math.random().toString(36).substring(2, 8);
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).substring(2, 6);
  }

  get isActive() {
    return this.status === 'ACTIVE' && !this.deletedAt;
  }

  get isPubliclyDiscoverable() {
    return this.isActive && this.visibility === 'PUBLIC';
  }

  canManage(userId, userRole = 'staff') {
    if (!userId) return false;
    if (this.ownerId === userId) return true;
    return ['owner', 'admin', 'manager'].includes(userRole);
  }

  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      categoryId: this.categoryId,
      logoUrl: this.logoUrl,
      coverUrl: this.coverUrl,
      isVerified: this.isVerified,
      verificationTier: this.verificationTier,
      rating: this.rating,
      ratingCount: this.ratingCount,
      followerCount: this.followerCount,
      productCount: this.productCount,
      phoneNumber: this.phoneNumber,
      email: this.email,
      websiteUrl: this.websiteUrl,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  toOwnerJSON() {
    return {
      ...this.toPublicJSON(),
      ownerId: this.ownerId,
      visibility: this.visibility,
      onboardingStep: this.onboardingStep,
      onboardingCompleted: this.onboardingCompleted,
      metadata: this.metadata,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Store;
