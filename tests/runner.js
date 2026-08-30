#!/usr/bin/env node
/**
 * LOUMOO Phase 1 & 2 Automated Test Runner
 * Executes all unit and integration test suites and reports results
 */

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
  { name: 'Auth & Identity REST Endpoints Pipeline', test: authEndpointsIntegrationTest.run }
];

async function main() {
  console.log('\n======================================================================');
  console.log('  LOUMOO — ENTERPRISE AUTHENTICATION & IDENTITY TEST SUITE');
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
