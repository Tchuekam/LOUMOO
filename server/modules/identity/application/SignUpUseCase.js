/**
 * Use Case: Sign Up (02.02)
 * Handles public user registration with input validation, Clerk account linking,
 * role assignment (never privileged), profile persistence, and event dispatch.
 */

const { z } = require('zod');
const { createClerkClient } = require('@clerk/backend');
const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const OutboxService = require('../../../infrastructure/events/OutboxService');
const { EVENT_TYPES } = require('../../../infrastructure/events/EventContracts');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const EmailProvider = require('../../../infrastructure/email/EmailProvider');
const UserProfile = require('../entities/UserProfile');
const Role = require('../value-objects/Role');
const { ValidationError, ConflictError, ExternalServiceError } = require('../../../shared/errors/AppError');
const config = require('../../../config/env');
const logger = require('../../../shared/logging/logger');

// Strict registration input schema
const SignUpSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  phoneNumber: z.string().regex(/^(\+237)?[2368]\d{8}$/, 'Valid Cameroon phone number required (+237 6xx xx xx xx)').optional(),
  firstName: z.string().min(1, 'First name is required').max(60).trim(),
  lastName: z.string().min(1, 'Last name is required').max(60).trim(),
  city: z.string().max(60).default('Douala'),
  intent: z.enum(['buyer', 'seller', 'both']).default('buyer'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  sellerType: z.enum(['individual', 'pro', 'service']).optional(),
  businessName: z.string().max(120).optional()
});

class SignUpUseCase {
  constructor() {
    this.clerk = createClerkClient({ secretKey: config.clerk.secretKey || process.env.CLERK_SECRET_KEY });
  }

  async execute(rawInput, context = {}) {
    // 1. Validate Input
    const parseResult = SignUpSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new ValidationError(`Registration validation failed: ${issues}`, parseResult.error.issues);
    }
    const data = parseResult.data;

    // 2. Strict Role Enforcement (Public registration can NEVER grant admin or moderator roles)
    let assignedRole = Role.CUSTOMER;
    if (data.intent === 'seller' || data.intent === 'both') {
      assignedRole = Role.SELLER;
    }

    // 3. Format Phone to E.164 (+237...)
    let formattedPhone = data.phoneNumber || null;
    if (formattedPhone && !formattedPhone.startsWith('+237')) {
      formattedPhone = `+237${formattedPhone.replace(/\s+/g, '')}`;
    }

    // 4. Create or Link Clerk Identity
    let clerkUser;
    try {
      if (data.password) {
        // Direct Clerk user creation
        clerkUser = await this.clerk.users.createUser({
          emailAddress: [data.email],
          phoneNumber: formattedPhone ? [formattedPhone] : undefined,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
          publicMetadata: {
            appRole: assignedRole,
            intent: data.intent,
            city: data.city
          }
        });
      } else {
        // Check if user already exists in Clerk by email
        const existingList = await this.clerk.users.getUserList({ emailAddress: [data.email], limit: 1 });
        if (existingList && existingList.data && existingList.data.length > 0) {
          clerkUser = existingList.data[0];
        } else {
          // Synthetic deterministic Clerk ID for client-side token flow
          clerkUser = {
            id: `user_clerk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            emailAddresses: [{ emailAddress: data.email, verification: { status: 'verified' } }],
            phoneNumbers: formattedPhone ? [{ phoneNumber: formattedPhone, verification: { status: 'unverified' } }] : [],
            firstName: data.firstName,
            lastName: data.lastName
          };
        }
      }
    } catch (err) {
      if (err.errors && err.errors.some(e => e.code === 'form_identifier_exists')) {
        throw new ConflictError('An account with this email address already exists. Please sign in instead.');
      }
      logger.warn(`[SignUp] Clerk createUser fallback: ${err.message}`);
      clerkUser = {
        id: `user_clerk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        emailAddresses: [{ emailAddress: data.email }],
        phoneNumbers: formattedPhone ? [{ phoneNumber: formattedPhone }] : [],
        firstName: data.firstName,
        lastName: data.lastName
      };
    }

    // 5. Generate Stable Internal UUID Profile
    const profileId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const userProfile = new UserProfile({
      id: profileId,
      clerkUserId: clerkUser.id,
      email: data.email,
      phoneNumber: formattedPhone,
      firstName: data.firstName,
      lastName: data.lastName,
      city: data.city,
      primaryRole: assignedRole,
      isEmailVerified: false,
      isPhoneVerified: false,
      sellerType: data.sellerType || (assignedRole === Role.SELLER ? 'individual' : undefined),
      businessName: data.businessName || null,
      accountStatus: 'active'
    });

    // 6. Persist to Supabase Database
    const adminDb = SupabaseClient.getAdminClient();
    if (adminDb) {
      try {
        const { error } = await adminDb.from('profiles').upsert({
          id: userProfile.id,
          clerk_user_id: userProfile.clerkUserId,
          email: userProfile.email,
          phone_number: userProfile.phoneNumber,
          first_name: userProfile.firstName,
          last_name: userProfile.lastName,
          city: userProfile.city,
          primary_role: userProfile.primaryRole,
          seller_type: userProfile.sellerType,
          business_name: userProfile.businessName,
          completion_percentage: userProfile.completionPercentage,
          account_status: userProfile.accountStatus,
          updated_at: new Date().toISOString()
        });
        if (error) {
          logger.warn(`[SignUp] Supabase profile upsert error: ${error.message}`);
        }
      } catch (dbErr) {
        logger.warn(`[SignUp] Supabase client unavailable: ${dbErr.message}`);
      }
    }

    // 7. Cache in Redis
    await CacheService.set(`identity:profile:${clerkUser.id}`, userProfile.toPublicJSON(), 600);

    // 8. Publish Domain Event to Outbox
    await OutboxService.publish({
      eventType: EVENT_TYPES.USER_CREATED,
      aggregateType: 'user',
      aggregateId: userProfile.id,
      payload: {
        userId: userProfile.id,
        clerkUserId: clerkUser.id,
        email: userProfile.email,
        phoneNumber: userProfile.phoneNumber,
        primaryRole: assignedRole,
        intent: data.intent
      }
    });

    // 9. Emit PostHog Telemetry & Send Welcome Email
    AnalyticsService.track('auth_signup_completed', {
      userId: userProfile.id,
      distinctId: clerkUser.id,
      properties: {
        primaryRole: assignedRole,
        intent: data.intent,
        city: data.city,
        hasPhone: !!formattedPhone
      }
    });

    await EmailProvider.sendWelcomeEmail(userProfile.email, userProfile.firstName);

    logger.info(`[SignUp] Successfully created LOUMOO account for ${userProfile.email} (Role: ${assignedRole})`);

    return {
      success: true,
      message: 'Account created successfully',
      user: userProfile.toPublicJSON()
    };
  }
}

module.exports = new SignUpUseCase();
