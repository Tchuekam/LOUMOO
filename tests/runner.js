#!/usr/bin/env node
/**
 * LOUMOO Master Automated Test Runner (Phases 1, 2, and 4)
 * Executes all 25 unit and integration test suites and reports results
 */

// Must come first: it sets NODE_ENV and the test-auth secret BEFORE any
// module loads the configuration, which reads them once at import time.
require('./setup');

const envTest = require('./unit/env.test');
const errorsTest = require('./unit/errors.test');
const cacheTest = require('./unit/cache.test');
const rateLimitTest = require('./unit/rateLimit.test');
const idempotencyTest = require('./unit/idempotency.test');
const authTest = require('./unit/auth.test');
const authorizationTest = require('./unit/authorization.test');
const outboxTest = require('./unit/outbox.test');
const apiIntegrationTest = require('./integration/api.test');

// Prompt 02 Auth & Identity Test Suites
const signupSigninTest = require('./unit/signup_signin.test');
const otpVerificationTest = require('./unit/otp_verification.test');
const userProfilesTest = require('./unit/user_profiles.test');
const buyerSellerPermissionsTest = require('./unit/buyer_seller_permissions.test');
const accountSecurityTest = require('./unit/account_security.test');
const accountDeletionTest = require('./unit/account_deletion.test');
const privacyControlsTest = require('./unit/privacy_controls.test');
const authEndpointsIntegrationTest = require('./integration/auth_endpoints.test');

// Prompt 04 User & Profile System Suites
const savedItemsTest = require('./unit/saved_items.test');
const followedStoresTest = require('./unit/followed_stores.test');
const addressManagementTest = require('./unit/address_management.test');
const userActivityTest = require('./unit/user_activity.test');
const notificationPreferencesTest = require('./unit/notification_preferences.test');
const purchaseHistoryTest = require('./unit/purchase_history.test');
const accountDashboardTest = require('./unit/account_dashboard.test');
const authenticatedUiTest = require('./unit/authenticated_ui.test');
const categoryTaxonomyTest = require('./unit/category_taxonomy.test');
const coreCommerceUnificationTest = require('./integration/core_commerce_unification.test');
const identityRoleHardeningTest = require('./integration/identity_role_hardening.test');
const commercePricingEngineTest = require('./unit/commerce_pricing_engine.test');
const commerceSecurityLifecycleTest = require('./integration/commerce_security_lifecycle.test');

const suites = [
  // Foundation Suites
  { name: 'Environment & Config', test: envTest.run },
  { name: 'Error Hierarchy', test: errorsTest.run },
  { name: 'Cache & Redis Abstraction', test: cacheTest.run },
  { name: 'Sliding-Window Rate Limiting', test: rateLimitTest.run },
  { name: 'Idempotency Locking & Replay', test: idempotencyTest.run },
  { name: 'Clerk Identity Mapping', test: authTest.run },
  { name: 'Role & Authorization Guards', test: authorizationTest.run },
  { name: 'Event Contracts & Outbox Dispatcher', test: outboxTest.run },
  { name: 'API Gateway Integration', test: apiIntegrationTest.run },

  // Prompt 02 Auth & Identity Suites
  { name: 'Sign Up & Sign In (02.02, 02.03)', test: signupSigninTest.run },
  { name: 'Phone & OTP Verification (02.07)', test: otpVerificationTest.run },
  { name: 'User Profiles & Completion Scoring (02.09)', test: userProfilesTest.run },
  { name: 'Buyer/Seller Permissions & Isolation (02.10, 02.11)', test: buyerSellerPermissionsTest.run },
  { name: 'Account Security & Sessions (02.08, 02.12)', test: accountSecurityTest.run },
  { name: 'Account Deletion & Anonymization (02.13)', test: accountDeletionTest.run },
  { name: 'Privacy Preferences & Consent (02.14)', test: privacyControlsTest.run },
  { name: 'Auth & Identity REST Endpoints Pipeline', test: authEndpointsIntegrationTest.run },

  // Prompt 04 User & Profile System Suites
  { name: 'Saved Items / Wishlist (04.04)', test: savedItemsTest.run },
  { name: 'Followed Stores (04.05)', test: followedStoresTest.run },
  { name: 'Address Management & Default Integrity (04.08)', test: addressManagementTest.run },
  { name: 'User-Facing Activity History (04.07)', test: userActivityTest.run },
  { name: 'Notification Preferences (04.09)', test: notificationPreferencesTest.run },
  { name: 'Purchase History & Orders (04.06)', test: purchaseHistoryTest.run },
  { name: 'Account Dashboard Read Model (04.02)', test: accountDashboardTest.run },
  { name: 'Authenticated UI & Get Started State', test: authenticatedUiTest.run },

  // Phase Discovery & Category Taxonomy Suite
  { name: 'All Categories & Commerce Taxonomy Discovery', test: categoryTaxonomyTest.run },

  // Phase 1 Core Commerce Unification Suite
  { name: 'Core Commerce Unification (Listing -> PostgreSQL -> Catalog -> PDP)', test: coreCommerceUnificationTest.run },

  // Critical Production Hardening Suite
  { name: 'Identity, Role, Category-First Store & Vertical Authorization', test: identityRoleHardeningTest.run },

  // Commerce Core & Orders Hardening Suites
  { name: 'Commerce Core Authoritative Pricing & State Machine', test: commercePricingEngineTest.run },
  { name: 'Commerce Core Security, Anti-IDOR & Lifecycle', test: commerceSecurityLifecycleTest.run }
];

async function main() {
  console.log('\n======================================================================');
  console.log('  LOUMOO — ENTERPRISE FULL TEST SUITE (PHASES 1, 2 & 4)');
  console.log('======================================================================\n');

  let passedSuites = 0;
  const startTime = Date.now();

  for (const suite of suites) {
    try {
      console.log(`▶ Running Suite: ${suite.name}`);
      await suite.test();
      passedSuites++;
    } catch (err) {
      console.error(`  ✗ [FAILED] ${suite.name}:`, err.message);
      if (err.stack) console.error(err.stack);
      process.exit(1);
    }
  }

  const duration = Date.now() - startTime;
  console.log('\n======================================================================');
  console.log(`  RESULT: All ${passedSuites}/${suites.length} test suites PASSED in ${duration}ms (100% Success)`);
  console.log('======================================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
