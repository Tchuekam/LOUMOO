/**
 * Identity Module — User Profile Entity
 * Encapsulates internal application user identity mapped to external auth providers
 */

class UserProfile {
  constructor({
    id,
    clerkUserId,
    phoneNumber = null,
    email = null,
    firstName = '',
    lastName = '',
    avatarUrl = null,
    city = 'Douala',
    primaryRole = 'customer',
    isPhoneVerified = false,
    isEmailVerified = false,
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
    deletionRequestedAt = null,
    metadata = {},
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.clerkUserId = clerkUserId;
    this.phoneNumber = phoneNumber;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.avatarUrl = avatarUrl;
    this.city = city;
    this.primaryRole = primaryRole;
    this.isPhoneVerified = isPhoneVerified;
    this.isEmailVerified = isEmailVerified;
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
    this.deletionRequestedAt = deletionRequestedAt;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim() || 'LOUMOO User';
  }

  isSeller() {
    return ['seller', 'seller_staff', 'admin', 'super_admin'].includes(this.primaryRole);
  }

  isAdmin() {
    return ['admin', 'super_admin'].includes(this.primaryRole);
  }

  isAnonymized() {
    return this.accountStatus === 'anonymized';
  }

  calculateCompletionPercentage() {
    let score = 20; // Base signup (Names + Email)
    if (this.isPhoneVerified) score += 20;
    if (this.city && this.city.trim().length > 0) score += 15;
    if ((this.buyerInterests && this.buyerInterests.length > 0) || this.businessName) score += 15;
    if (this.kycDocStatus === 'submitted' || this.kycDocStatus === 'verified') score += 15;
    if (this.avatarUrl || this.rccmNumber) score += 15;
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
      isPhoneVerified: this.isPhoneVerified,
      isEmailVerified: this.isEmailVerified,
      buyerInterests: this.buyerInterests,
      sellerType: this.sellerType,
      businessName: this.businessName,
      kycDocStatus: this.kycDocStatus,
      completionPercentage: this.completionPercentage,
      accountStatus: this.accountStatus
    };
  }

  toSafeMerchantPublicCard() {
    return {
      id: this.id,
      fullName: this.businessName || this.fullName,
      avatarUrl: this.avatarUrl,
      city: this.city,
      sellerType: this.sellerType,
      isVerifiedSeller: this.kycDocStatus === 'verified' || this.isSeller(),
      completionPercentage: this.completionPercentage
    };
  }
}

module.exports = UserProfile;
