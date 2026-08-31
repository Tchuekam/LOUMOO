/**
 * LOUMOO — Account Deletion & Anonymization
 * ---------------------------------------------------------------------------
 * Runs against a real profile, because the guarantees being tested are about
 * what actually happens to the row.
 */

require('../setup');
const assert = require('assert');

const DeleteAccountUseCase = require('../../server/modules/identity/application/DeleteAccountUseCase');
const { ValidationError, AuthorizationError, NotFoundError } = require('../../server/shared/errors/AppError');
const harness = require('../helpers/harness');

async function run() {
  console.log('  Testing account deletion & anonymization...');

  const created = await harness.createUser({ stage: 'ready' });
  const user = {
    id: created.id,
    clerkUserId: created.clerk_user_id,
    email: created.email,
    firstName: created.first_name,
    lastName: created.last_name
  };

  /* ── 1. Deletion demands explicit confirmation ────────────────────────── */

  for (const confirmText of ['remove', 'delete', '', undefined, 'Delete']) {
    let rejected = false;
    try {
      await DeleteAccountUseCase.execute(user, { confirmText });
    } catch (err) {
      rejected = err instanceof ValidationError;
    }
    assert.ok(rejected, `"${confirmText}" must not be accepted as deletion confirmation`);
  }

  /* ── 2. An unauthenticated caller cannot delete anything ──────────────── */

  let unauthRejected = false;
  try {
    await DeleteAccountUseCase.execute(null, { confirmText: 'DELETE' });
  } catch (err) {
    unauthRejected = err instanceof AuthorizationError;
  }
  assert.ok(unauthRejected, 'Deletion must require an authenticated principal');

  /* ── 3. Deleting an account that does not exist is NOT a success ──────── */

  let ghostRejected = false;
  try {
    await DeleteAccountUseCase.execute(
      { id: 'usr_does_not_exist', clerkUserId: null, email: 'x@y.cm' },
      { confirmText: 'DELETE' }
    );
  } catch (err) {
    ghostRejected = err instanceof NotFoundError;
  }
  assert.ok(ghostRejected,
    'A no-op deletion must not report that data was erased when nothing was touched');

  /* ── 4. Confirmed deletion actually anonymizes the stored row ─────────── */

  const result = await DeleteAccountUseCase.execute(user, {
    confirmText: 'DELETE',
    reason: 'Automated deletion test'
  });

  assert.ok(result.success);
  assert.ok(result.message.includes('anonymized'), 'The outcome must be stated plainly');
  assert.strictEqual(typeof result.identityRemoved, 'boolean',
    'The result must say whether the sign-in identity was actually removed');

  const { data: row } = await harness.db()
    .from('profiles')
    .select('first_name, last_name, email, phone_number, business_name, account_status, status, email_verified_at, phone_verified_at, deleted_at')
    .eq('id', user.id)
    .single();

  assert.strictEqual(row.first_name, 'Anonymized');
  assert.strictEqual(row.last_name, 'User');
  assert.notStrictEqual(row.email, created.email, 'The original email must not remain');
  assert.ok(row.email.includes('@deleted.loumoo.cm'));
  assert.strictEqual(row.phone_number, null, 'The phone number must be erased');
  assert.strictEqual(row.business_name, null);
  assert.strictEqual(row.account_status, 'anonymized');
  assert.ok(row.deleted_at, 'The deletion must be timestamped');

  // Verification cannot outlive the identity it belonged to.
  assert.strictEqual(row.email_verified_at, null,
    'A deleted account must not retain a verified-email timestamp');
  assert.strictEqual(row.phone_verified_at, null);

  /* ── 5. The deleted account can no longer authenticate ────────────────── */

  const afterDelete = await harness.request('GET', '/api/v1/me/state', { token: created.token });
  assert.ok([401, 403].includes(afterDelete.status),
    `A deleted account must not resolve to a usable session, got ${afterDelete.status}`);

  console.log('    ✓ Deletion anonymizes real data, clears verification and ends the session');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
