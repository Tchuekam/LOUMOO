/**
 * Store Verification Use Case (05.05 & Section 11 Store Verification)
 * Enforces strict privacy, legal document validation, and server-controlled status transitions.
 */

const { ValidationError, ForbiddenError } = require('../../../shared/errors/AppError');
const { SupabaseClient, handleDatabaseFailure } = require('../../../infrastructure/database/SupabaseClient.js');
const StoreVerification = require('../domain/StoreVerification');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const logger = require('../../../shared/logging/logger');

const ProfileRepository = require('../../identity/infrastructure/ProfileRepository');

class StoreVerificationUseCase {
  static async getVerification(store) {
    const supabase = SupabaseClient.getAdmin();
    let data = null;

    try {
      const { data: res, error } = await supabase
        .from('store_verifications')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error(`[StoreVerification] Fetch failed for store ${store.id}: ${error.message}`);
      }
      data = res;
    } catch (err) {
      handleDatabaseFailure(err, 'Get');
    }

    if (!data) {
      // Default initial state
      return {
        storeId: store.id,
        verificationStatus: store.isVerified ? 'APPROVED' : 'DRAFT',
        legalBusinessName: store.name,
        businessType: 'pro',
        rccmNumber: null,
        taxIdNiu: null,
        representativeFullName: null,
        representativeIdType: 'cni',
        representativeIdNumber: null,
        idDocumentFrontUrl: null,
        idDocumentBackUrl: null,
        businessDocumentUrl: null,
        submittedAt: null
      };
    }

    const ver = new StoreVerification(data);
    return ver.toJSON();
  }

  static async submitVerification(store, userProfile, verificationInput = {}) {
    const legalBusinessName = (verificationInput.legalBusinessName || store.name || '').trim();
    if (!legalBusinessName) {
      throw new ValidationError('Legal business name is required for verification.');
    }

    const businessType = verificationInput.businessType || 'pro';
    const rccmNumber = (verificationInput.rccmNumber || '').trim();
    const taxIdNiu = (verificationInput.taxIdNiu || '').trim();
    const representativeFullName = (verificationInput.representativeFullName || userProfile.fullName || '').trim();

    const dbPayload = {
      store_id: store.id,
      legal_business_name: legalBusinessName,
      business_type: businessType,
      rccm_number: rccmNumber || null,
      tax_id_niu: taxIdNiu || null,
      representative_full_name: representativeFullName || userProfile.fullName || null,
      representative_id_type: verificationInput.representativeIdType || 'cni',
      representative_id_number: verificationInput.representativeIdNumber || null,
      id_document_front_url: verificationInput.idDocumentFrontUrl || verificationInput.idDocumentUrl || null,
      id_document_back_url: verificationInput.idDocumentBackUrl || null,
      business_document_url: verificationInput.businessDocumentUrl || null,
      verification_status: 'SUBMITTED',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const supabase = SupabaseClient.getAdmin();

    try {
      await supabase
        .from('store_verifications')
        .upsert(dbPayload, { onConflict: 'store_id' });

      // Update store status to PENDING_VERIFICATION if it was DRAFT
      await supabase
        .from('stores')
        .update({ status: 'PENDING_VERIFICATION', updated_at: new Date().toISOString() })
        .eq('id', store.id);

      // Update user profile kyc status
      await ProfileRepository.update(userProfile.id, {
        kyc_doc_type: verificationInput.representativeIdType || 'cni',
        kyc_doc_status: 'submitted',
        rccm_number: rccmNumber || null,
        tax_niu_number: taxIdNiu || null
      }, userProfile.clerkUserId);
    } catch (err) {
      handleDatabaseFailure(err, 'Submit');
    }

    AnalyticsService.track(userProfile.id, 'store_verification_submitted', {
      storeId: store.id,
      businessType: businessType
    });

    return {
      storeId: store.id,
      verificationStatus: 'SUBMITTED',
      submittedAt: dbPayload.submitted_at,
      message: 'Verification documents submitted successfully. Our compliance team will review your file within 24-48 hours.'
    };
  }
}

module.exports = StoreVerificationUseCase;
