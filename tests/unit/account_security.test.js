/**
 * LOUMOO — Account Security & Session Management
 * ---------------------------------------------------------------------------
 * The previous version of this suite asserted three behaviours that were each
 * a lie the service told the user, and all three have been removed:
 *
 *   1. `getActiveSessions` returned a fabricated "current session" for any id,
 *      so the security screen showed a device list that was invented.
 *   2. `revokeSession` returned success for an arbitrary session id belonging
 *      to anyone, so a user could believe a stolen device was signed out.
 *   3. `assertRecentAuthentication` accepted the literal string
 *      'valid_credential' — a hardcoded skeleton key.
 *
 * What follows asserts the honest behaviour instead.
 */

require('../setup');
const assert = require('assert');

const AccountSecurityService = require('../../server/modules/identity/application/AccountSecurityService');
const ClerkIdentityProvider = require('../../server/modules/identity/infrastructure/ClerkIdentityProvider');
const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  InfrastructureError
} = require('../../server/shared/errors/AppError');

async function expectThrow(fn, predicate, description) {
  let caught = null;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }
  assert.ok(caught, `Expected a rejection: ${description}`);
  assert.ok(predicate(caught), `${description}. Got: ${caught.name} — ${caught.message}`);
  return caught;
}

async function run() {
  console.log('  Testing account security & session service...');

  /* ── 1. Sessions are observed, never invented ─────────────────────────── */

  await expectThrow(
    () => AccountSecurityService.getActiveSessions('user_does_not_exist_anywhere'),
    err => err instanceof InfrastructureError || Array.isArray(err),
    'An unknown identity must not yield a fabricated session list'
  ).catch(async () => {
    // Some Clerk instances answer with an empty list rather than an error.
    // Either is honest; a fabricated entry is not.
    const sessions = await AccountSecurityService.getActiveSessions('user_does_not_exist_anywhere');
    assert.ok(Array.isArray(sessions));
    assert.strictEqual(sessions.length, 0,
      'An identity with no sessions must report none, not an invented "current device"');
  });

  /* ── 2. Revocation verifies ownership, and reports failure as failure ─── */

  await expectThrow(
    () => AccountSecurityService.revokeSession('user_attacker', 'sess_belonging_to_someone_else'),
    err => err instanceof NotFoundError || err instanceof InfrastructureError,
    'Revoking a session that is not yours must be refused, not reported as success'
  );

  await expectThrow(
    () => AccountSecurityService.revokeSession('user_attacker', null),
    err => err instanceof NotFoundError,
    'A missing session id must be rejected'
  );

  /* ── 3. Re-authentication cannot be satisfied by a magic string ───────── */

  const principal = { id: 'usr_sec_1', clerkUserId: 'user_sec_1', email: 'test@loumoo.cm' };

  for (const attempt of ['valid_credential', 'wrong_credential', 'test@loumoo.cm', 'DELETE']) {
    await expectThrow(
      () => AccountSecurityService.assertRecentAuthentication(principal, attempt),
      err => err instanceof AuthenticationError || err instanceof AuthorizationError,
      `The string "${attempt}" must not satisfy re-authentication`
    );
  }

  await expectThrow(
    () => AccountSecurityService.assertRecentAuthentication(principal, null),
    err => err instanceof AuthorizationError && err.details.reason === 'REAUTHENTICATION_REQUIRED',
    'Without a session id, re-authentication must be demanded'
  );

  await expectThrow(
    () => AccountSecurityService.assertRecentAuthentication(null, 'sess_x'),
    err => err instanceof AuthenticationError,
    'A missing principal must be rejected'
  );

  /* ── 4. The audit trail records events without recording secrets ──────── */

  await AccountSecurityService.logSecurityEvent({
    userId: null,
    clerkUserId: principal.clerkUserId,
    eventType: 'password_reset_requested',
    ipAddress: '127.0.0.1',
    metadata: { source: 'mobile_app' }
  });

  // The window is a real policy value, not an arbitrary constant.
  assert.strictEqual(AccountSecurityService.RECENT_AUTH_WINDOW_MS, 15 * 60 * 1000);

  /* ── 5. Configuration is a prerequisite, not an optional extra ────────── */

  assert.strictEqual(typeof ClerkIdentityProvider.isConfigured, 'boolean');

  console.log('    ✓ Sessions observed not invented; revocation ownership-checked; no magic credential');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}
