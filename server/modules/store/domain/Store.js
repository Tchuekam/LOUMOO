/**
 * Store & Commercial Entity — Domain Model (05.01 - 05.12)
 * ---------------------------------------------------------------------------
 * Represents commercial seller entities on LOUMOO, including Freelancers,
 * Shops, Agencies, Institutes, Brands, and Organizations.
 */

const SELLER_TYPES = Object.freeze([
  'FREELANCER',
  'SHOP',
  'AGENCY',
  'INSTITUTE',
  'BRAND',
  'ORGANIZATION',
  'OTHER'
]);

class Store {
  constructor(data = {}) {
    this.id = data.id || null;
    this.ownerId = data.owner_id || data.ownerId || null;
    this.organizationId = data.organization_id || data.organizationId || null;
    this.sellerType = (data.seller_type || data.sellerType || 'SHOP').toUpperCase();
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
    this.recommendationCount = Number(data.recommendation_count || data.recommendationCount || 0);
    this.reputationScore = Number(data.reputation_score || data.reputationScore || 100.0);
    this.trustTier = data.trust_tier || data.trustTier || 'NEW';
    this.completedOrdersCount = Number(data.completed_orders_count || data.completedOrdersCount || 0);
    this.responseRatePercent = Number(data.response_rate_percent || data.responseRatePercent || 100.0);
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
    return ['owner', 'admin', 'manager'].includes(String(userRole).toLowerCase());
  }

  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      sellerType: this.sellerType,
      organizationId: this.organizationId,
      description: this.description,
      categoryId: this.categoryId,
      logoUrl: this.logoUrl,
      coverUrl: this.coverUrl,
      isVerified: this.isVerified,
      verificationTier: this.verificationTier,
      rating: this.rating,
      ratingCount: this.ratingCount,
      followerCount: this.followerCount,
      recommendationCount: this.recommendationCount,
      reputationScore: this.reputationScore,
      trustTier: this.trustTier,
      completedOrdersCount: this.completedOrdersCount,
      responseRatePercent: this.responseRatePercent,
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
module.exports.SELLER_TYPES = SELLER_TYPES;