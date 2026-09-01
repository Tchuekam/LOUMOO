/**
 * Reputation & Trust Engine (Phase 7 & Section 11)
 * ---------------------------------------------------------------------------
 * Centralized multi-signal trust scoring formula for LOUMOO sellers and entities.
 * Combines verified transaction ratings, verified review counts, social endorsements,
 * order completion metrics, repeat buyers, KYC verification, and response rate.
 */

'use strict';

const TRUST_TIERS = Object.freeze({
  NEW: 'NEW',
  ESTABLISHED: 'ESTABLISHED',
  TOP_RATED: 'TOP_RATED',
  VERIFIED_LEADER: 'VERIFIED_LEADER'
});

class ReputationEngine {
  /**
   * Compute comprehensive multi-factor reputation and trust score.
   * Returns a normalized 0-100 score and qualitative trust tier.
   *
   * @param {object} signals
   * @param {number} signals.ratingAvg - Average star rating (1.0 to 5.0)
   * @param {number} signals.ratingCount - Total rating/review count
   * @param {number} signals.verifiedReviewsCount - Number of verified purchase reviews
   * @param {number} signals.recommendationCount - Number of social recommendations
   * @param {number} signals.completedOrdersCount - Number of completed fulfilled orders
   * @param {number} signals.repeatCustomerRatio - Ratio of repeat buyers (0.0 to 1.0)
   * @param {boolean} signals.isKycVerified - Whether identity KYC has been validated
   * @param {number} signals.responseRatePercent - Response rate percentage (0 to 100)
   * @param {number} signals.disputeCount - Number of unresolved customer disputes
   */
  static calculateReputation(signals = {}) {
    const ratingAvg = Number(signals.ratingAvg) || 5.0;
    const ratingCount = Number(signals.ratingCount) || 0;
    const verifiedReviews = Number(signals.verifiedReviewsCount) || 0;
    const recCount = Number(signals.recommendationCount) || 0;
    const completedOrders = Number(signals.completedOrdersCount) || 0;
    const repeatRatio = Math.min(1.0, Math.max(0.0, Number(signals.repeatCustomerRatio) || 0.0));
    const isVerified = Boolean(signals.isKycVerified);
    const responseRate = Math.min(100, Math.max(0, Number(signals.responseRatePercent) || 100));
    const disputes = Number(signals.disputeCount) || 0;

    // 1. Rating Factor (0 to 40 points)
    // Scale 1.0-5.0 to 0-40 points, weighted by statistical confidence (sample size)
    const confidence = ratingCount === 0 ? 0.5 : Math.min(1.0, ratingCount / 10);
    const normalizedRating = Math.max(0, (ratingAvg - 1) / 4); // 0 to 1
    const ratingScore = (normalizedRating * 40) * confidence + (25 * (1 - confidence));

    // 2. Order Volume & Fulfillment Factor (0 to 20 points)
    const orderScore = Math.min(20, (completedOrders / 25) * 20);

    // 3. Social Recommendations Factor (0 to 15 points)
    const recScore = Math.min(15, (recCount / 10) * 15);

    // 4. Repeat Customer Factor (0 to 10 points)
    const repeatScore = repeatRatio * 10;

    // 5. KYC & Account Verification (0 to 10 points)
    const kycScore = isVerified ? 10 : 3;

    // 6. Responsiveness (0 to 5 points)
    const responseScore = (responseRate / 100) * 5;

    // 7. Dispute Penalty (-10 points per unresolved dispute)
    const disputePenalty = Math.min(30, disputes * 10);

    const rawScore = ratingScore + orderScore + recScore + repeatScore + kycScore + responseScore - disputePenalty;
    const finalScore = Math.round(Math.min(100, Math.max(10, rawScore)) * 100) / 100;

    // Determine Trust Tier
    let trustTier = TRUST_TIERS.NEW;
    if (finalScore >= 90 && isVerified && completedOrders >= 20 && ratingAvg >= 4.5) {
      trustTier = TRUST_TIERS.VERIFIED_LEADER;
    } else if (finalScore >= 75 && completedOrders >= 10 && ratingAvg >= 4.0) {
      trustTier = TRUST_TIERS.TOP_RATED;
    } else if (finalScore >= 50 && (completedOrders >= 3 || recCount >= 2)) {
      trustTier = TRUST_TIERS.ESTABLISHED;
    }

    return {
      score: finalScore,
      trustTier,
      signals: {
        ratingAvg,
        ratingCount,
        verifiedReviews,
        recommendationCount: recCount,
        completedOrders,
        repeatCustomerRatio: repeatRatio,
        isKycVerified: isVerified,
        responseRatePercent: responseRate,
        disputeCount: disputes
      },
      breakdown: {
        ratingContribution: Math.round(ratingScore * 10) / 10,
        ordersContribution: Math.round(orderScore * 10) / 10,
        recommendationsContribution: Math.round(recScore * 10) / 10,
        repeatBuyersContribution: Math.round(repeatScore * 10) / 10,
        verificationContribution: Math.round(kycScore * 10) / 10,
        responsivenessContribution: Math.round(responseScore * 10) / 10,
        disputePenalty: Math.round(disputePenalty * 10) / 10
      }
    };
  }
}

module.exports = {
  ReputationEngine,
  TRUST_TIERS
};