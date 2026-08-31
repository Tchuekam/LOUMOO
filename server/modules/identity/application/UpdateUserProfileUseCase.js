/**
 * Use Case: Update User Profile (02.09)
 * Validates mutable profile fields, recalculates profile completion score,
 * updates persistence, and purges Redis cache.
 */

const { z } = require('zod');
const { SupabaseClient, tryGetAdmin } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const UserProfile = require('../entities/UserProfile');
const { ValidationError, NotFoundError, AuthorizationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  city: z.string().max(60).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  buyerInterests: z.array(z.string()).optional(),
  shoppingPriorities: z.array(z.string()).optional(),
  sellerType: z.enum(['individual', 'pro', 'service']).optional(),
  businessName: z.string().max(120).optional().nullable(),
  taxNiuNumber: z.string().max(64).optional().nullable(),
  rccmNumber: z.string().max(64).optional().nullable(),
  businessAddress: z.string().max(255).optional().nullable(),
  kycDocType: z.enum(['cni', 'passport', 'rccm']).optional(),
  kycDocStatus: z.enum(['pending', 'submitted', 'verified', 'rejected']).optional()
});

class UpdateUserProfileUseCase {
  async execute(currentUser, updates) {
    if (!currentUser || !currentUser.id) {
      throw new AuthorizationError('Authentication required to update profile');
    }

    // 1. Validate Input
    const parseResult = UpdateProfileSchema.safeParse(updates);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Profile update validation failed: ${issues}`);
    }
    const data = parseResult.data;

    // 2. Load Existing Profile or Instantiate
    let cached = await CacheService.get(`identity:profile:${currentUser.clerkUserId}`);
    let profile = new UserProfile(cached || currentUser);

    // 3. Apply Fields
    if (data.firstName) profile.firstName = data.firstName;
    if (data.lastName) profile.lastName = data.lastName;
    if (data.city) profile.city = data.city;
    if (data.avatarUrl !== undefined) profile.avatarUrl = data.avatarUrl;
    if (data.buyerInterests) profile.buyerInterests = data.buyerInterests;
    if (data.shoppingPriorities) profile.shoppingPriorities = data.shoppingPriorities;
    if (data.sellerType) profile.sellerType = data.sellerType;
    if (data.businessName !== undefined) profile.businessName = data.businessName;
    if (data.taxNiuNumber !== undefined) profile.taxNiuNumber = data.taxNiuNumber;
    if (data.rccmNumber !== undefined) profile.rccmNumber = data.rccmNumber;
    if (data.businessAddress !== undefined) profile.businessAddress = data.businessAddress;
    if (data.kycDocStatus) profile.kycDocStatus = data.kycDocStatus;

    // 4. Recalculate Dynamic Completion Score
    profile.completionPercentage = profile.calculateCompletionPercentage();
    profile.updatedAt = new Date();

    // 5. Update Database
    const adminDb = tryGetAdmin('UpdateUserProfileUseCase');
    if (adminDb) {
      try {
        const { error } = await adminDb.from('profiles').update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          city: profile.city,
          avatar_url: profile.avatarUrl,
          buyer_interests: profile.buyerInterests,
          shopping_priorities: profile.shoppingPriorities,
          seller_type: profile.sellerType,
          business_name: profile.businessName,
          tax_niu_number: profile.taxNiuNumber,
          rccm_number: profile.rccmNumber,
          business_address: profile.businessAddress,
          kyc_doc_status: profile.kycDocStatus,
          completion_percentage: profile.completionPercentage,
          updated_at: profile.updatedAt.toISOString()
        }).eq('id', profile.id);

        if (error) {
          logger.warn(`[UpdateProfile] Supabase update warning: ${error.message}`);
        }
      } catch (dbErr) {
        logger.warn(`[UpdateProfile] Database update error: ${dbErr.message}`);
      }
    }

    // 6. Update Cache
    await CacheService.set(`identity:profile:${currentUser.clerkUserId}`, profile.toPublicJSON(), 600);

    logger.info(`[UpdateProfile] Updated profile for user ${profile.id} (Completion: ${profile.completionPercentage}%)`);

    return {
      success: true,
      message: 'Profile updated successfully',
      user: profile.toPublicJSON()
    };
  }
}

module.exports = new UpdateUserProfileUseCase();
