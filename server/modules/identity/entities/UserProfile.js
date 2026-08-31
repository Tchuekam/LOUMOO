/**
 * Identity Module — User Profile Entity
 * ---------------------------------------------------------------------------
 * The in-process representation of a LOUMOO application user.
 *
 * Verification is represented by ONE canonical field per channel — the
 * `*VerifiedAt` timestamp. `isEmailVerified` / `isPhoneVerified` are read-only
 * getters derived from it, mirroring the GENERATED columns in the database, so
 * there is no way to construct an entity that claims to be verified without a
 * verification time.
 */

class UserProfile {
  constructor({
    id,
    clerkUserId,
    phoneNumber = null,
    phone = null,
    email = null,
    firstName = '',
    lastName = '',
    avatarUrl = null,
    city = 'Douala',
    primaryRole = 'customer',
    role = null,
    emailVerifiedAt = null,
    phoneVerifiedAt = null,
    onboardingStatus = 'NOT_STARTED',
    onboardingCompletedAt = null,
    completedOnboardingSteps = [],
    sellerStatus = 'NONE',
    primaryStoreId = null,
    buyerInterests = [],
    shoppingPriorities = [],
    sellerType = 'individual',
    businessName = null,
    taxNiuNumber = null,
    rccmNumber = null,
    businessAddress = null,
    kycDocStatus = 'pending',
    completionPercentage = null,
    accountStatus = 'active',
    status = 'active',
    deletionRequestedAt = null,
    deletedAt = null,
    metadata = {},
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.clerkUserId = clerkUserId;
    this.phoneNumber = phoneNumber || phone;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.avatarUrl = avatarUrl;
    this.city = city;
    this.primaryRole = role || primaryRole;

    this.emailVerifiedAt = emailVerifiedAt;
    this.phoneVerifiedAt = phoneVerifiedAt;

    this.onboardingStatus = onboardingStatus;
    this.onboardingCompletedAt = onboardingCompletedAt;
    this.completedOnboardingSteps = completedOnboardingSteps;
    this.sellerStatus = sellerStatus;
    this.primaryStoreId = primaryStoreId;

    this.buyerInterests = buyerInterests;
    this.shoppingPriorities = shoppingPriorities;
    this.sellerType = sellerType;
    this.businessName = businessName;
    this.taxNiuNumber = taxNiuNumber;
    this.rccmNumber = rccmNumber;
    this.businessAddress = businessAddress;
    this.kycDocStatus = kycDocStatus;
    this.completionPercentage = completionPercentage || this.calculateCompletionPercentage();
    this.accountStatus = accountStatus;
    this.status = status;
    this.deletionRequestedAt = deletionRequestedAt;
    this.deletedAt = deletedAt;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /** Builds an entity from the neutral principal projection (AccountStateService). */
  static fromPrincipal(principal) {
    if (!principal) return null;
    return new UserProfile(principal);
  }

  get role() { return this.primaryRole; }
  get phone() { return this.phoneNumber; }

  /** Derived, never independently settable — mirrors the database. */
  get isEmailVerified() { return Boolean(this.emailVerifiedAt); }
  get isPhoneVerified() { return Boolean(this.phoneVerifiedAt); }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim() || 'LOUMOO User';
  }

  isSeller() {
    return this.sellerStatus === 'READY'
      || ['seller', 'seller_staff', 'admin', 'super_admin'].includes(this.primaryRole);
  }

  isAdmin() {
    return ['admin', 'super_admin'].includes(this.primaryRole);
  }

  isAnonymized() {
    return this.accountStatus === 'anonymized';
  }

  /**
   * Profile completeness, for the "finish setting up your account" nudge.
   *
   * Presentation only — nothing in the authorization path reads this. The
   * account state machine decides what a user may do; this number just tells
   * them how filled-in their profile looks.
   */
  calculateCompletionPercentage() {
    let score = 20;                                                   // signed up
    if (this.isEmailVerified) score += 12;
    if (this.isPhoneVerified) score += 12;
    if (this.city && String(this.city).trim().length > 0) score += 12;
    if ((this.buyerInterests && this.buyerInterests.length > 0) || this.businessName) score += 12;
    if (this.onboardingStatus === 'COMPLETED') score += 12;
    if (this.kycDocStatus === 'submitted' || this.kycDocStatus === 'verified') score += 10;
    if (this.avatarUrl || this.rccmNumber) score += 10;
    return Math.min(score, 100);
  }

  toPublicJSON() {
    return {
      id: this.id,
      clerkUserId: this.clerkUserId,
      email: this.email,
      phoneNumber: this.phoneNumber,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      avatarUrl: this.avatarUrl,
      city: this.city,
      primaryRole: this.primaryRole,
      isEmailVerified: this.isEmailVerified,
      isPhoneVerified: this.isPhoneVerified,
      emailVerifiedAt: this.emailVerifiedAt,
      phoneVerifiedAt: this.phoneVerifiedAt,
      onboardingStatus: this.onboardingStatus,
      sellerStatus: this.sellerStatus,
      primaryStoreId: this.primaryStoreId,
      buyerInterests: this.buyerInterests,
      sellerType: this.sellerType,
      businessName: this.businessName,
      kycDocStatus: this.kycDocStatus,
      completionPercentage: this.completionPercentage,
      accountStatus: this.accountStatus
    };
  }

  /**
   * The public merchant card. Deliberately narrow: it must never leak an
   * email, a phone number or an internal verification timestamp to a stranger
   * browsing a storefront.
   */
  toSafeMerchantPublicCard() {
    return {
      id: this.id,
      fullName: this.businessName || this.fullName,
      avatarUrl: this.avatarUrl,
      city: this.city,
      sellerType: this.sellerType,
      // The badge a buyer sees means "identity documents were checked", which
      // is the KYC outcome — not merely "this account is allowed to list".
      isVerifiedSeller: this.kycDocStatus === 'verified',
      // Whether the boutique is live, which is a different question.
      isActiveSeller: this.sellerStatus === 'READY',
      completionPercentage: this.completionPercentage
    };
  }
}

module.exports = UserProfile;
