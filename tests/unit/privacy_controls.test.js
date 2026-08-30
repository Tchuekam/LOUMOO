/**
 * Unit Test: Privacy Preferences (02.14)
 */

const assert = require('assert');
const PrivacyPreferencesUseCase = require('../../server/modules/identity/application/PrivacyPreferencesUseCase');

async function run() {
  console.log('  Testing Privacy Preferences & Consent Use Case...');

  const userId = `usr_privacy_${Date.now()}`;

  // 1. Get default privacy preferences
  const defaultPrefs = await PrivacyPreferencesUseCase.getPreferences(userId);
  assert.strictEqual(defaultPrefs.userId, userId);
  assert.strictEqual(defaultPrefs.analyticsConsent, true);
  assert.strictEqual(defaultPrefs.profileVisibility, 'public');

  // 2. Update preferences
  const updateResult = await PrivacyPreferencesUseCase.updatePreferences(userId, {
    marketingEmails: false,
    profileVisibility: 'contacts_only'
  });

  assert.ok(updateResult.success, 'Privacy update should succeed');
  assert.strictEqual(updateResult.preferences.marketingEmails, false);
  assert.strictEqual(updateResult.preferences.profileVisibility, 'contacts_only');

  // 3. Confirm retrieval
  const refetched = await PrivacyPreferencesUseCase.getPreferences(userId);
  assert.strictEqual(refetched.marketingEmails, false);
  assert.strictEqual(refetched.profileVisibility, 'contacts_only');

  console.log('    ✓ Privacy preferences tests passed.');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
