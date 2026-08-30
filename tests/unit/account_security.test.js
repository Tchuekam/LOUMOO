/**
 * Unit Test: Account Security & Session Management (02.08, 02.12)
 */

const assert = require('assert');
const AccountSecurityService = require('../../server/modules/identity/application/AccountSecurityService');
const { AuthenticationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Account Security & Session Service...');

  const clerkUserId = 'user_sec_test_123';

  // 1. Get Active Sessions
  const sessions = await AccountSecurityService.getActiveSessions(clerkUserId);
  assert.ok(Array.isArray(sessions), 'Sessions must be returned as an array');
  assert.ok(sessions.length > 0, 'Should have at least 1 session representation');

  // 2. Revoke Remote Session
  const revokeResult = await AccountSecurityService.revokeSession(clerkUserId, 'sess_remote_999');
  assert.ok(revokeResult.success, 'Session revocation should succeed');

  // 3. Re-authentication Challenge
  const user = { id: 'usr_sec_1', email: 'test@loumoo.cm' };
  
  let invalidReauthBlocked = false;
  try {
    await AccountSecurityService.assertRecentAuthentication(user, 'wrong_credential');
  } catch (err) {
    if (err instanceof AuthenticationError) invalidReauthBlocked = true;
  }
  assert.ok(invalidReauthBlocked, 'Should reject invalid re-authentication credentials');

  const validReauth = await AccountSecurityService.assertRecentAuthentication(user, 'valid_credential');
  assert.strictEqual(validReauth, true, 'Valid re-authentication challenge should pass');

  // 4. Log Security Event
  await AccountSecurityService.logSecurityEvent({
    userId: user.id,
    eventType: 'password_reset_requested',
    ipAddress: '127.0.0.1',
    metadata: { source: 'mobile_app' }
  });

  console.log('    ✓ Account security tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
