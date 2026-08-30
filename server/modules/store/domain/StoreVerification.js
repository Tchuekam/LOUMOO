/**
 * Store Verification Entity — Legal Compliance & CNI/RCCM (05.05)
 * STRICTLY PRIVATE: Never exposed in public endpoints.
 */

class StoreVerification {
  constructor(data = {}) {
    this.id = data.id || null;
    this.storeId = data.store_id || data.storeId || null;
    this.legalBusinessName = data.legal_business_name || data.legalBusinessName || '';
    this.businessType = data.business_type || data.businessType || 'individual'; // individual, pro, sarl, sa, cooperative
    this.rccmNumber = data.rccm_number || data.rccmNumber || '';
    this.taxIdNiu = data.tax_id_niu || data.taxIdNiu || '';
    this.representativeFullName = data.representative_full_name || data.representativeFullName || '';
    this.representativeIdType = data.representative_id_type || data.representativeIdType || 'cni';
    this.representativeIdNumber = data.representative_id_number || data.representativeIdNumber || '';
    this.idDocumentFrontUrl = data.id_document_front_url || data.idDocumentFrontUrl || null;
    this.idDocumentBackUrl = data.id_document_back_url || data.idDocumentBackUrl || null;
    this.businessDocumentUrl = data.business_document_url || data.businessDocumentUrl || null;
    this.taxDocumentUrl = data.tax_document_url || data.taxDocumentUrl || null;
    this.verificationStatus = data.verification_status || data.verificationStatus || 'DRAFT'; // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, REQUIRES_RESUBMISSION
    this.rejectionReason = data.rejection_reason || data.rejectionReason || null;
    this.submittedAt = data.submitted_at || data.submittedAt || null;
    this.reviewedAt = data.reviewed_at || data.reviewedAt || null;
    this.reviewedBy = data.reviewed_by || data.reviewedBy || null;
    this.createdAt = data.created_at || data.createdAt || new Date().toISOString();
    this.updatedAt = data.updated_at || data.updatedAt || new Date().toISOString();
  }

  isApproved() {
    return this.verificationStatus === 'APPROVED';
  }

  isPending() {
    return ['SUBMITTED', 'UNDER_REVIEW'].includes(this.verificationStatus);
  }

  canSubmit() {
    return ['DRAFT', 'REJECTED', 'REQUIRES_RESUBMISSION'].includes(this.verificationStatus);
  }

  toJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      legalBusinessName: this.legalBusinessName,
      businessType: this.businessType,
      rccmNumber: this.rccmNumber,
      taxIdNiu: this.taxIdNiu,
      representativeFullName: this.representativeFullName,
      representativeIdType: this.representativeIdType,
      representativeIdNumber: this.representativeIdNumber,
      hasIdFront: !!this.idDocumentFrontUrl,
      hasIdBack: !!this.idDocumentBackUrl,
      hasBusinessDoc: !!this.businessDocumentUrl,
      hasTaxDoc: !!this.taxDocumentUrl,
      verificationStatus: this.verificationStatus,
      rejectionReason: this.rejectionReason,
      submittedAt: this.submittedAt,
      reviewedAt: this.reviewedAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = StoreVerification;
