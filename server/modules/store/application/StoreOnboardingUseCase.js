/**
 * Store Onboarding Use Case (05.02 & Section 6 Onboarding Validation)
 * Provides persistent, resumable multi-step onboarding with server-side validation.
 */

const { ValidationError, InfrastructureError } = require('../../../shared/errors/AppError');
const { SupabaseDatabase } = require('../../../infrastructure/database/SupabaseClient.js');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const ProfileRepository = require('../../identity/infrastructure/ProfileRepository');
const { SELLER_STATUS } = require('../../identity/domain/AccountState');
const logger = require('../../../shared/logging/logger');

const ONBOARDING_STEPS = [
  'NOT_STARTED',
  'PROFILE_COMPLETED',
  'BUSINESS_INFO_COMPLETED',
  'LOCATION_COMPLETED',
  'HOURS_COMPLETED',
  'VERIFICATION_SUBMITTED',
  'ACTIVE'
];

class StoreOnboardingUseCase {
  static async getOnboardingStatus(store) {
    const supabase = SupabaseDatabase.getAdmin();

    const [locRes, hrsRes, verRes] = await Promise.all([
      supabase.from('store_locations').select('*').eq('store_id', store.id).maybeSingle(),
      supabase.from('store_hours').select('*').eq('store_id', store.id).maybeSingle(),
      supabase.from('store_verifications').select('*').eq('store_id', store.id).maybeSingle()
    ]);

    for (const res of [locRes, hrsRes, verRes]) {
      if (res.error) {
        throw new InfrastructureError('Supabase', `store onboarding status read failed: ${res.error.message}`, res.error);
      }
    }

    const location = locRes.data;
    const hours = hrsRes.data;
    const verification = verRes.data;

    // Each requirement is a real check against real rows. `hours` used to be
    // `!!hours || true` — permanently satisfied, i.e. not a requirement at all.
    const completedRequirements = {
      profile: Boolean(store.name) && Boolean(store.categoryId),
      businessInfo: Boolean(store.description) && Boolean(store.phoneNumber),
      location: Boolean(location && location.city),
      hours: Boolean(hours),
      verificationSubmitted: verification ? verification.verification_status !== 'DRAFT' : false
    };

    /*
     * Only the requirements that store creation itself guarantees can gate
     * activation. `businessInfo` needs a phone number, which is optional at
     * creation and empty for any seller who never supplied one - so gating on
     * it left those accounts unable to ever go live, and every Sell press sent
     * them back around the loop. Verification is a trust upgrade and is never
     * required: nothing here forces a document upload.
     */
    const REQUIRED_FOR_ACTIVATION = ['profile', 'location'];
    const isEligibleForActivation = REQUIRED_FOR_ACTIVATION.every(k => completedRequirements[k]);

    // Progress reflects the required work only, so the bar can actually reach
    // 100% without submitting documents.
    const requiredKeys = ['profile', 'businessInfo', 'location'];
    const requiredDone = requiredKeys.filter(k => completedRequirements[k]).length;
    const completionPercentage = Math.round((requiredDone / requiredKeys.length) * 100);

    const missingForActivation = REQUIRED_FOR_ACTIVATION.filter(k => !completedRequirements[k]);

    return {
      storeId: store.id,
      storeName: store.name,
      currentStep: store.onboardingStep,
      isCompleted: store.onboardingCompleted,
      completionPercentage: completionPercentage,
      requirements: completedRequirements,
      optionalRequirements: ['verificationSubmitted'],
      missingForActivation,
      isEligibleForActivation
    };
  }

  static async updateOnboardingStep(store, principal, stepName, payload = {}) {
    if (!ONBOARDING_STEPS.includes(stepName)) {
      throw new ValidationError(`Invalid onboarding step: ${stepName}`, {
        allowedSteps: ONBOARDING_STEPS
      });
    }

    const supabase = SupabaseDatabase.getAdmin();
    const updates = {
      onboarding_step: stepName,
      updated_at: new Date().toISOString()
    };

    // If activating, validate all mandatory requirements server-side
    if (stepName === 'ACTIVE') {
      const status = await this.getOnboardingStatus(store);
      if (!status.isEligibleForActivation) {
        const LABELS = { profile: 'store name and category', location: 'store location' };
        const missing = status.missingForActivation.map(k => LABELS[k] || k).join(' and ');
        throw new ValidationError(`Add your ${missing} before going live.`, {
          missing: status.missingForActivation
        });
      }
      updates.status = 'ACTIVE';
      updates.onboarding_completed = true;
    }

    const { error } = await supabase.from('stores').update(updates).eq('id', store.id);
    if (error) {
      throw new InfrastructureError('Supabase', `store onboarding update failed: ${error.message}`, error);
    }

    store.onboardingStep = stepName;
    if (updates.status) store.status = updates.status;
    if (updates.onboarding_completed) store.onboardingCompleted = true;

    // Activating the storefront is what promotes the ACCOUNT to SELLER_READY.
    // This is the single transition that unlocks listing creation, and it can
    // only happen after the server has verified every activation requirement.
    if (stepName === 'ACTIVE' && principal) {
      await ProfileRepository.update(principal.id, {
        seller_status: SELLER_STATUS.READY,
        primary_store_id: store.id,
        primary_role: principal.primaryRole === 'customer' ? 'seller' : principal.primaryRole
      }, principal.clerkUserId);
      logger.info(`[StoreOnboarding] user=${principal.id} promoted to SELLER_READY via store=${store.id}`);
    }

    AnalyticsService.track(principal ? principal.id : 'system', 'store_onboarding_step_updated', {
      storeId: store.id,
      step: stepName
    });

    return this.getOnboardingStatus(store);
  }
}

module.exports = StoreOnboardingUseCase;
