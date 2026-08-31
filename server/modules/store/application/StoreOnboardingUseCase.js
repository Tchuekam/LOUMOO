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

    let completedCount = 0;
    Object.values(completedRequirements).forEach(val => { if (val) completedCount++; });
    const completionPercentage = Math.round((completedCount / Object.keys(completedRequirements).length) * 100);

    return {
      storeId: store.id,
      storeName: store.name,
      currentStep: store.onboardingStep,
      isCompleted: store.onboardingCompleted,
      completionPercentage: completionPercentage,
      requirements: completedRequirements,
      isEligibleForActivation: completedRequirements.profile && completedRequirements.businessInfo && completedRequirements.location
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
        throw new ValidationError('Cannot activate store: Profile, business information, and location must be completed first.');
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
