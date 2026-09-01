/**
 * Public Profile Application Service (Section 5 & 6)
 * ---------------------------------------------------------------------------
 * Powers public user profile pages (/u/:username) and commercial seller pages
 * (/s/:sellerSlug) with privacy enforcement, ratings, reviews, and recommendations.
 */

'use strict';

const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient');
const { NotFoundError } = require('../../../shared/errors/AppError');
const ReviewService = require('./ReviewService');
const SocialGraphService = require('./SocialGraphService');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class PublicProfileService {
  /**
   * Resolve public user profile (/u/:username or /api/v1/users/:id/public)
   */
  static async getUserPublicProfile(usernameOrId, requestingPrincipal = null) {
    const adminDb = SupabaseClient.getAdmin();
    let row = null;

    try {
      let query = adminDb.from('profiles').select('*');
      if (UUID_REGEX.test(usernameOrId) || (usernameOrId.startsWith('usr_') && usernameOrId.length > 10)) {
        query = query.eq('id', usernameOrId);
      } else {
        query = query.ilike('username', usernameOrId);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      row = data;
    } catch (err) {
      handleDatabaseFailure(err, 'Get user profile for public view');
    }

    if (!row || row.deleted_at || row.account_status === 'anonymized') {
      throw new NotFoundError('User Profile', usernameOrId);
    }

    const isSelf = requestingPrincipal && requestingPrincipal.id === row.id;

    // Check privacy settings if not self
    if (!isSelf) {
      try {
        const { data: privacy } = await adminDb
          .from('privacy_preferences')
          .select('profile_visibility')
          .eq('user_id', row.id)
          .maybeSingle();

        if (privacy && privacy.profile_visibility === 'private') {
          return {
            id: row.id,
            username: row.username,
            name: `${row.first_name || ''}`.trim() || 'Private User',
            avatarUrl: null,
            isPrivate: true,
            message: 'This user profile is private.'
          };
        }
      } catch (_) { /* continue */ }
    }

    // Check follow status
    let isFollowing = false;
    if (requestingPrincipal && !isSelf) {
      const followStatus = await SocialGraphService.getFollowStatus(requestingPrincipal.id, 'user', row.id);
      isFollowing = followStatus.isFollowing;
    }

    // Get user's active seller stores
    let sellerStores = [];
    try {
      const { data: stores } = await adminDb
        .from('stores')
        .select('id, name, slug, logo_url, seller_type, rating, follower_count, is_verified, status')
        .eq('owner_id', row.id)
        .eq('status', 'ACTIVE')
        .eq('visibility', 'PUBLIC');

      sellerStores = stores || [];
    } catch (_) { /* ignore */ }

    // Get recommendations received
    const { recommendations } = await SocialGraphService.listRecommendations('user', row.id, { limit: 5 });

    return {
      id: row.id,
      username: row.username || `user_${row.id.slice(0, 8)}`,
      name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'LOUMOO User',
      avatarUrl: row.avatar_url,
      headline: row.headline || (sellerStores.length > 0 ? `${sellerStores[0].seller_type} Merchant` : 'LOUMOO Member'),
      bio: row.bio,
      city: row.city || 'Douala',
      isPhoneVerified: Boolean(row.phone_verified_at),
      isEmailVerified: Boolean(row.email_verified_at),
      followerCount: row.follower_count || 0,
      followingCount: row.following_count || 0,
      reputationScore: row.reputation_score || 100,
      badges: row.badges || [],
      isFollowing,
      sellerStores: sellerStores.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logo_url,
        sellerType: s.seller_type || 'SHOP',
        rating: s.rating,
        isVerified: s.is_verified
      })),
      recommendations,
      createdAt: row.created_at
    };
  }

  /**
   * Resolve public commercial seller profile (/s/:sellerSlug)
   */
  static async getSellerPublicProfile(slugOrId, requestingPrincipal = null) {
    const adminDb = SupabaseClient.getAdmin();
    let store = null;

    try {
      let query = adminDb.from('stores').select('*');
      if (UUID_REGEX.test(slugOrId) || slugOrId.startsWith('store_')) {
        query = query.eq('id', slugOrId);
      } else {
        query = query.eq('slug', slugOrId.toLowerCase());
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      store = data;
    } catch (err) {
      handleDatabaseFailure(err, 'Get seller public profile');
    }

    if (!store || store.deleted_at || store.status === 'ARCHIVED' || store.status === 'DELETED') {
      throw new NotFoundError('Seller', slugOrId);
    }

    // Hydrate store profile
    let storeProfile = null;
    let storeHours = null;
    let storeLocation = null;
    let organization = null;

    try {
      const [pRes, hRes, lRes, oRes] = await Promise.all([
        adminDb.from('store_profiles').select('*').eq('store_id', store.id).maybeSingle(),
        adminDb.from('store_hours').select('*').eq('store_id', store.id).maybeSingle(),
        adminDb.from('store_locations').select('*').eq('store_id', store.id).maybeSingle(),
        store.organization_id ? adminDb.from('organizations').select('*').eq('id', store.organization_id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      storeProfile = pRes.data;
      storeHours = hRes.data;
      storeLocation = lRes.data;
      organization = oRes.data;
    } catch (_) { /* ignore */ }

    // Follow status
    let isFollowing = false;
    if (requestingPrincipal) {
      const fs = await SocialGraphService.getFollowStatus(requestingPrincipal.id, 'seller', store.id);
      isFollowing = fs.isFollowing;
    }

    // Ratings & Reviews summary
    const ratingSummary = await ReviewService.getRatingSummary('seller', store.id);
    const { reviews } = await ReviewService.listReviews('seller', store.id, { limit: 5 });
    const { recommendations } = await SocialGraphService.listRecommendations('seller', store.id, { limit: 5 });

    // Active product listings (canonical published listings)
    let listings = [];
    try {
      const { data: listData } = await adminDb
        .from('listings')
        .select('id, title, description, price_xaf, listing_type, status, cover_image_url, rating, rating_count, created_at')
        .eq('store_id', store.id)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })
        .limit(12);

      listings = listData || [];
    } catch (_) { /* ignore */ }

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      sellerType: store.seller_type || 'SHOP',
      description: store.description,
      logoUrl: store.logo_url,
      coverUrl: store.cover_url,
      isVerified: store.is_verified,
      verificationTier: store.verification_tier || 'unverified',
      reputationScore: store.reputation_score || 100.0,
      trustTier: store.trust_tier || 'NEW',
      rating: store.rating || 5.0,
      ratingCount: store.rating_count || 0,
      followerCount: store.follower_count || 0,
      recommendationCount: store.recommendation_count || 0,
      completedOrdersCount: store.completed_orders_count || 0,
      responseRatePercent: store.response_rate_percent || 100,
      isFollowing,
      profile: storeProfile ? {
        tagline: storeProfile.tagline,
        bio: storeProfile.bio,
        returnPolicy: storeProfile.return_policy,
        warrantyPolicy: storeProfile.warranty_policy,
        shippingPolicy: storeProfile.shipping_policy,
        socialLinks: storeProfile.social_links,
        badges: storeProfile.badges
      } : null,
      hours: storeHours ? {
        timezone: storeHours.timezone,
        isAlwaysOpen: storeHours.is_always_open,
        schedule: storeHours.schedule
      } : null,
      location: storeLocation ? {
        city: storeLocation.city,
        region: storeLocation.region,
        districtQuarter: storeLocation.district_quarter,
        country: storeLocation.country
      } : null,
      organization: organization ? {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        orgType: organization.org_type,
        logoUrl: organization.logo_url
      } : null,
      ratingSummary,
      reviews,
      recommendations,
      listings
    };
  }
}

module.exports = PublicProfileService;