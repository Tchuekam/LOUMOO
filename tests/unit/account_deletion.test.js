/**
 * Unit Test: Account Deletion & Anonymization (02.13)
 */

const assert = require('assert');
const DeleteAccountUseCase = require('../../server/modules/identity/application/DeleteAccountUseCase');
const UserProfile = require('../../server/modules/identity/entities/UserProfile');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Account Deletion & Anonymization Use Case...');

  const user = new UserProfile({
    id: 'usr_delete_test_99',
    clerkUserId: 'user_delete_clerk_99',
    email: 'rostand.temp@loumoo.cm',
    firstName: 'Rostand',
    lastName: 'Tchuekam'
  });

  // 1. Missing explicit confirmation -> REJECT
  let missingConfirmThrew = false;
  try {
    await DeleteAccountUseCase.execute(user, { confirmText: 'remove' });
  } catch (err) {
    if (err instanceof ValidationError) missingConfirmThrew = true;
  }
  assert.ok(missingConfirmThrew, 'Should reject deletion without explicit "DELETE" confirmation');

  // 2. Confirmed Deletion -> Anonymize & Soft Delete
  const deleteResult = await DeleteAccountUseCase.execute(user, {
    confirmText: 'DELETE',
    reason: 'Testing deletion flow'
  });

  assert.ok(deleteResult.success, 'Account deletion should succeed');
  assert.ok(deleteResult.message.includes('anonymized'), 'Result should confirm anonymization');

  console.log('    ✓ Account deletion tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
