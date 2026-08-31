/**
 * LOUMOO — Use Case: Update User Profile (02.09 Hardened)
 * ---------------------------------------------------------------------------
 * Features:
 *   1. Internal user id cache keys (`identity:profile:{userId}`).
 *   2. KYC status transition validation state machine.
 *   3. Explicit database availability check with retry logic.
 *   4. Structured audit logging with PII field redaction.
 *   5. Strict Zod schema with regex sanitization and domain enums.
 *   6. Optimistic locking with version increment and conflict detection.
 *   7. Cache-aside invalidation with non-blocking error handling.
 */

const { z } = require('zod');
const { tryGetAdmin } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const UserProfile = require('../entities/UserProfile');
const {
  ValidationError,
  AuthorizationError,
  ConflictError,
  ServiceUnavailableError,
  InfrastructureError
} = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

// Domain Enumerations
const ALLOWED_BUYER_INTERESTS = [
  'tech', 'fashion', 'home', 'beauty', 'sports',
  'groceries', 'electronics', 'travel', 'services', 'automotive'
];

const ALLOWED_SHOPPING_PRIORITIES = [
  'quality', 'verified', 'price', 'speed', 'warranty', 'local'
];

// Strict Sanitized Input Schema
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;
const CITY_REGEX = /^[a-zA-ZÀ-ÿ0-9\s'(),.-]+$/;
const BUSINESS_NAME_REGEX = /^[a-zA-Z0-9À-ÿ\s'.,&()-]+$/;
const NIU_REGEX = /^[A-Za-z0-9]{10,16}$/;
const RCCM_REGEX = /^[A-Za-z0-9\/\s.-]{6,40}$/;

const UpdateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(60).regex(NAME_REGEX, {
    message: 'First name may only contain letters, spaces, hyphens, and apostrophes.'
  }).optional(),
  lastName: z.string().trim().min(1).max(60).regex(NAME_REGEX, {
    message: 'Last name may only contain letters, spaces, hyphens, and apostrophes.'
  }).optional(),
  city: z.string().trim().max(60).regex(CITY_REGEX, {
    message: 'City may only contain letters, numbers, spaces, and standard punctuation.'
  }).optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL.').optional().nullable(),
  buyerInterests: z.array(z.enum(ALLOWED_BUYER_INTERESTS, {
    errorMap: () => ({ message: 'Invalid buyer interest category.' })
  })).max(20).optional(),
  shoppingPriorities: z.array(z.enum(ALLOWED_SHOPPING_PRIORITIES, {
    errorMap: () => ({ message: 'Invalid shopping priority.' })
  })).max(10).optional(),
  sellerType: z.enum(['individual', 'pro', 'company', 'service']).optional(),
  businessName: z.string().trim().max(120).regex(BUSINESS_NAME_REGEX, {
    message: 'Business name may only contain alphanumeric characters, spaces, and common punctuation.'
  }).optional().nullable(),
  taxNiuNumber: z.string().trim().regex(NIU_REGEX, {
    message: 'Tax NIU must be 10-16 alphanumeric characters.'
  }).optional().nullable(),
  rccmNumber: z.string().trim().regex(RCCM_REGEX, {
    message: 'RCCM number must be 6-40 valid registry characters.'
  }).optional().nullable(),
  businessAddress: z.string().trim().max(255).optional().nullable(),
  kycDocType: z.enum(['cni', 'passport', 'rccm']).optional(),
  kycDocStatus: z.enum(['pending', 'submitted', 'verified', 'rejected']).optional(),
  version: z.number().int().positive().optional()
}).strict({
  message: 'Unrecognized fields are not permitted in profile updates.'
});

/**
 * PII Redaction utility for audit logging.
 */
function redactPii(field, val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str.length === 0) return '';
  if (['taxNiuNumber', 'rccmNumber'].includes(field)) {
    if (str.length <= 6) return '***';
    return `${str.slice(0, 3)}***${str.slice(-3)}`;
  }
  if (field === 'businessAddress') {
    if (str.length <= 8) return '***';
    return `${str.slice(0, 5)}... (redacted)`;
  }
  if (['phone', 'phoneNumber'].includes(field)) {
    if (str.length <= 5) return '***';
    return `${str.slice(0, 4)}***${str.slice(-2)}`;
  }
  return val;
}

class UpdateUserProfileUseCase {
  async execute(currentUser, updates, context = {}) {
    if (!currentUser || !currentUser.id) {
      throw new AuthorizationError('Authentication required to update profile');
    }

    // 1. Validate Input with Strict Schema
    const parseResult = UpdateProfileSchema.safeParse(updates);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Profile update validation failed: ${issues}`);
    }
    const data = parseResult.data;

    // 2. Load Existing Profile via Cache-Aside using Internal User ID
    const internalUserId = currentUser.id;
    const cacheKey = `identity:profile:${internalUserId}`;

    let cached = null;
    try {
      cached = await CacheService.get(cacheKey, 'identity');
    } catch (cacheReadErr) {
      logger.warn(`[ProfileCache] Read error: ${cacheReadErr.message}`);
    }

    const profile = new UserProfile(cached || currentUser);

    // 3. Optimistic Locking Check
    if (data.version !== undefined && profile.version !== undefined) {
      if (data.version !== profile.version) {
        throw new ConflictError(
          `Profile update conflict: submitted version (${data.version}) does not match current version (${profile.version}). Please refresh and try again.`,
          { currentVersion: profile.version, submittedVersion: data.version }
        );
      }
    }

    // 4. KYC State Transition Validation
    if (data.kycDocStatus && data.kycDocStatus !== profile.kycDocStatus) {
      const transitionCheck = profile.canTransitionKycStatus(data.kycDocStatus);
      if (!transitionCheck.valid) {
        throw new ValidationError(transitionCheck.reason || 'Invalid KYC state transition attempted.');
      }
    }

    // 5. Track Field Changes for Audit Logging
    const changedFields = {};
    const trackChange = (field, oldVal, newVal) => {
      if (newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changedFields[field] = {
          old: redactPii(field, oldVal),
          new: redactPii(field, newVal)
        };
      }
    };

    trackChange('firstName', profile.firstName, data.firstName);
    trackChange('lastName', profile.lastName, data.lastName);
    trackChange('city', profile.city, data.city);
    trackChange('avatarUrl', profile.avatarUrl, data.avatarUrl);
    trackChange('buyerInterests', profile.buyerInterests, data.buyerInterests);
    trackChange('shoppingPriorities', profile.shoppingPriorities, data.shoppingPriorities);
    trackChange('sellerType', profile.sellerType, data.sellerType);
    trackChange('businessName', profile.businessName, data.businessName);
    trackChange('taxNiuNumber', profile.taxNiuNumber, data.taxNiuNumber);
    trackChange('rccmNumber', profile.rccmNumber, data.rccmNumber);
    trackChange('businessAddress', profile.businessAddress, data.businessAddress);
    trackChange('kycDocType', profile.kycDocType, data.kycDocType);
    trackChange('kycDocStatus', profile.kycDocStatus, data.kycDocStatus);

    // 6. Apply Fields to Entity
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
    if (data.kycDocType) profile.kycDocType = data.kycDocType;
    if (data.kycDocStatus) profile.kycDocStatus = data.kycDocStatus;

    // Increment version & update timestamp
    profile.version = (profile.version || 1) + 1;
    profile.completionPercentage = profile.calculateCompletionPercentage();
    profile.updatedAt = new Date();

    // 7. Database Update with Availability Guarantee & Transient Retry Logic
    const adminDb = tryGetAdmin('UpdateUserProfileUseCase');
    if (!adminDb) {
      throw new ServiceUnavailableError('Database service is unavailable to process profile update. Please try again shortly.');
    }

    const payload = {
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
    };

    let dbSuccess = false;
    let lastError = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await adminDb.from('profiles').update(payload).eq('id', profile.id);
        if (error) {
          throw new InfrastructureError('Supabase', error.message, error);
        }
        dbSuccess = true;
        break;
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        }
      }
    }

    if (!dbSuccess) {
      logger.error('[UpdateProfile] Database update failed after retries', {
        userId: internalUserId,
        error: lastError?.message
      });
      if (lastError instanceof InfrastructureError || lastError instanceof ServiceUnavailableError) {
        throw lastError;
      }
      throw new InfrastructureError('Supabase', lastError?.message || 'Database update failed');
    }

    // 8. Cache-Aside Invalidation & Fresh Population (Non-blocking)
    try {
      await CacheService.set(cacheKey, profile.toPublicJSON(), 300, 'identity');
      await CacheService.delete(`identity:public:${internalUserId}`);
      if (profile.clerkUserId) {
        await CacheService.delete(`profile:clerk:${profile.clerkUserId}`, 'identity');
        await CacheService.delete(`identity:profile:${profile.clerkUserId}`);
      }
    } catch (cacheErr) {
      logger.warn(`[ProfileCache] Cache invalidation warning: ${cacheErr.message}`);
    }

    // 9. Structured Audit Logging with Redacted PII
    logger.info('[Audit] Profile updated', {
      userId: internalUserId,
      timestamp: profile.updatedAt.toISOString(),
      version: profile.version,
      changedFields,
      ip: context.ip || null,
      completionPercentage: profile.completionPercentage
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      user: profile.toPublicJSON()
    };
  }
}

module.exports = new UpdateUserProfileUseCase();
module.exports.UpdateUserProfileUseCase = UpdateUserProfileUseCase;
module.exports.UpdateProfileSchema = UpdateProfileSchema;
module.exports.ALLOWED_BUYER_INTERESTS = ALLOWED_BUYER_INTERESTS;
module.exports.ALLOWED_SHOPPING_PRIORITIES = ALLOWED_SHOPPING_PRIORITIES;
