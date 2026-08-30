/**
 * Unit Test: Notification Preferences (04.09)
 */

const assert = require('assert');
const NotificationPreferencesUseCase = require('../../server/modules/identity/application/NotificationPreferencesUseCase');

async function run() {
  console.log('  Testing Notification Preferences Service...');

  const userId = `usr_notif_test_${Date.now()}`;

  // 1. Get default preferences
  const prefs = await NotificationPreferencesUseCase.getPreferences(userId);
  assert.strictEqual(prefs.channels.inApp, true);
  assert.strictEqual(prefs.channels.email, true);
  assert.strictEqual(prefs.categories.transactional, true);

  // 2. Update marketing preferences
  const updated = await NotificationPreferencesUseCase.updatePreferences(userId, {
    channels: {
      whatsapp: true,
      email: false
    },
    categories: {
      marketing: false,
      transactional: false // System should enforce transactional: true regardless
    }
  });

  assert.strictEqual(updated.channels.whatsapp, true);
  assert.strictEqual(updated.channels.email, false);
  assert.strictEqual(updated.categories.marketing, false);
  assert.strictEqual(updated.categories.transactional, true, 'Critical transactional alerts must remain immutable (true)');

  console.log('    ✓ Notification preferences tests passed.');
}

module.exports = { run };
