/**
 * LOUMOO Unit Tests — Social Graph & Multi-Signal Reputation Engine
 */

require('../setup');
const assert = require('assert');
const { SocialFollow, SocialRecommendation, SocialBlock } = require('../../server/modules/identity/domain/SocialGraph');
const { ReputationEngine, TRUST_TIERS } = require('../../server/modules/identity/domain/ReputationEngine');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Social Graph & Multi-Signal Reputation Engine...');

  // 1. Social Follow validation
  assert.throws(() => {
    SocialFollow.validate({ followerId: 'usr_1', targetType: 'user', targetId: 'usr_1' });
  }, ValidationError);

  SocialFollow.validate({ followerId: 'usr_1', targetType: 'user', targetId: 'usr_2' });
  SocialFollow.validate({ followerId: 'usr_1', targetType: 'seller', targetId: 'store_1' });

  // 2. Social Recommendation validation
  assert.throws(() => {
    SocialRecommendation.validate({
      authorId: 'usr_1',
      targetType: 'user',
      targetId: 'usr_1',
      note: 'I am the best!'
    });
  }, ValidationError);

  assert.throws(() => {
    SocialRecommendation.validate({
      authorId: 'usr_1',
      targetType: 'seller',
      targetId: 'store_1',
      note: 'Bad'
    });
  }, ValidationError);

  SocialRecommendation.validate({
    authorId: 'usr_1',
    targetType: 'seller',
    targetId: 'store_1',
    note: 'Exceptional service and quick delivery in Douala!',
    relationshipContext: 'client'
  });

  // 3. Social Block validation
  assert.throws(() => {
    SocialBlock.validate({ blockerId: 'usr_1', blockedId: 'usr_1' });
  }, ValidationError);

  SocialBlock.validate({ blockerId: 'usr_1', blockedId: 'usr_2' });

  // 4. Reputation Engine: New Tier defaults
  const repNew = ReputationEngine.calculateReputation({
    ratingAvg: 5.0,
    ratingCount: 0,
    completedOrdersCount: 0,
    isKycVerified: false
  });
  assert.strictEqual(repNew.trustTier, TRUST_TIERS.NEW);
  assert(repNew.score >= 10 && repNew.score <= 100);

  // 5. Reputation Engine: Verified Leader tier
  const repLeader = ReputationEngine.calculateReputation({
    ratingAvg: 4.9,
    ratingCount: 45,
    verifiedReviewsCount: 40,
    recommendationCount: 15,
    completedOrdersCount: 50,
    repeatCustomerRatio: 0.4,
    isKycVerified: true,
    responseRatePercent: 98,
    disputeCount: 0
  });
  assert.strictEqual(repLeader.trustTier, TRUST_TIERS.VERIFIED_LEADER);
  assert(repLeader.score >= 90);

  // 6. Dispute penalties
  const cleanRep = ReputationEngine.calculateReputation({
    ratingAvg: 4.5,
    ratingCount: 20,
    completedOrdersCount: 25,
    isKycVerified: true,
    disputeCount: 0
  });

  const disputedRep = ReputationEngine.calculateReputation({
    ratingAvg: 4.5,
    ratingCount: 20,
    completedOrdersCount: 25,
    isKycVerified: true,
    disputeCount: 3
  });

  assert(disputedRep.score < cleanRep.score);
  assert.strictEqual(disputedRep.breakdown.disputePenalty, 30);

  console.log('    ✓ Social graph & reputation scoring unit tests passed.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };