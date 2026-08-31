/**
 * LOUMOO — Clerk Identity Mapping & Profile Provisioning
 * ---------------------------------------------------------------------------
 * Replaces the previous suite, which exercised a `SyncClerkUserUseCase` that
 * marked an email verified merely because one existed and kept identities in
 * an in-memory Map. Both have been removed.
 *
 * What matters now, and what is tested here:
 *   - Clerk's payloads (camelCase SDK objects and snake_case webhooks) map to
 *     one normalised identity.
 *   - Verification is read from Clerk's own `verification.status`, never
 *     inferred from an address merely existing.
 *   - Profiles are keyed on `clerk_user_id` and provisioning is idempotent
 *     and race-safe, so a webhook and a first API call cannot create two.
 */

require('../setup');
const assert = require('assert');

const ClerkIdentityProvider = require('../../server/modules/identity/infrastructure/ClerkIdentityProvider');
const ProfileRepository = require('../../server/modules/identity/infrastructure/ProfileRepository');
const { SupabaseDatabase } = require('../../server/infrastructure/database/SupabaseClient');

async function run() {
  console.log('  Testing Clerk identity mapping & profile provisioning...');

  /* ── 1. Webhook payload shape (snake_case) ────────────────────────────── */

  const webhookPayload = {
    id: 'user_webhook_shape',
    email_addresses: [
      { id: 'idn_1', email_address: 'unverified@loumoo.cm', verification: { status: 'unverified' } },
      { id: 'idn_2', email_address: 'primary@loumoo.cm', verification: { status: 'verified' } }
    ],
    primary_email_address_id: 'idn_2',
    phone_numbers: [{ id: 'phn_1', phone_number: '+237690112233', verification: { status: 'unverified' } }],
    primary_phone_number_id: 'phn_1',
    first_name: 'Amina',
    last_name: 'Nkeng',
    image_url: 'https://img.clerk.com/amina'
  };

  const fromWebhook = ClerkIdentityProvider.normalizeUser(webhookPayload);
  assert.strictEqual(fromWebhook.clerkUserId, 'user_webhook_shape');
  assert.strictEqual(fromWebhook.email, 'primary@loumoo.cm',
    'The PRIMARY address must be selected, not simply the first');
  assert.strictEqual(fromWebhook.emailVerified, true);
  assert.strictEqual(fromWebhook.phoneNumber, '+237690112233');
  assert.strictEqual(fromWebhook.phoneVerified, false,
    'An unverified phone must never be reported as verified');

  /* ── 2. Backend SDK shape (camelCase) maps identically ────────────────── */

  const fromSdk = ClerkIdentityProvider.normalizeUser({
    id: 'user_sdk_shape',
    emailAddresses: [{ id: 'e1', emailAddress: 'sdk@loumoo.cm', verification: { status: 'verified' } }],
    primaryEmailAddressId: 'e1',
    phoneNumbers: [],
    firstName: 'Sdk',
    lastName: 'Shape'
  });
  assert.strictEqual(fromSdk.email, 'sdk@loumoo.cm');
  assert.strictEqual(fromSdk.emailVerified, true);
  assert.strictEqual(fromSdk.phoneNumber, null);

  /* ── 3. Existence is not verification ─────────────────────────────────── */

  const noStatus = ClerkIdentityProvider.normalizeUser({
    id: 'user_no_status',
    email_addresses: [{ id: 'e', email_address: 'exists@loumoo.cm' }]
  });
  assert.strictEqual(noStatus.email, 'exists@loumoo.cm');
  assert.strictEqual(noStatus.emailVerified, false,
    'An address with no verification record must NOT count as verified');

  const pending = ClerkIdentityProvider.normalizeUser({
    id: 'user_pending',
    email_addresses: [{ id: 'e', email_address: 'p@loumoo.cm', verification: { status: 'unverified' } }]
  });
  assert.strictEqual(pending.emailVerified, false);

  /* ── 4. Forged tokens yield no identity ───────────────────────────────── */

  for (const token of ['user_admin', 'usr_victim', '', null, 'loumoo_test:bad-secret:user_x']) {
    let rejected = false;
    try {
      await ClerkIdentityProvider.verifySessionToken(token);
    } catch (err) {
      rejected = true;
    }
    assert.ok(rejected, `Token "${token}" must not resolve to an identity`);
  }

  /* ── 5. Provisioning is idempotent and keyed on the Clerk id ──────────── */

  const clerkUserId = `user_provision_${Date.now().toString(36)}`;
  const identity = {
    clerkUserId,
    email: `${clerkUserId}@loumoo-test.cm`,
    emailVerified: true,
    phoneNumber: null,
    phoneVerified: false,
    firstName: 'Provision',
    lastName: 'Test'
  };

  const db = SupabaseDatabase.getAdmin();
  let profileId = null;

  try {
    const first = await ProfileRepository.getOrCreateForClerkUser(identity);
    assert.strictEqual(first.created, true, 'The first sighting must provision a profile');
    profileId = first.profile.id;

    assert.strictEqual(first.profile.primary_role, 'customer',
      'Public provisioning must NEVER grant a privileged role');
    assert.ok(first.profile.email_verified_at,
      'A Clerk-verified email must be mirrored as a verification timestamp');
    assert.strictEqual(first.profile.is_email_verified, true,
      'The generated boolean must agree with the timestamp');
    assert.strictEqual(first.profile.onboarding_status, 'NOT_STARTED');
    assert.strictEqual(first.profile.seller_status, 'NONE');

    // Concurrent first sightings — the classic webhook-vs-first-request race.
    const racers = await Promise.all([
      ProfileRepository.getOrCreateForClerkUser(identity),
      ProfileRepository.getOrCreateForClerkUser(identity),
      ProfileRepository.getOrCreateForClerkUser(identity)
    ]);
    for (const r of racers) {
      assert.strictEqual(r.created, false, 'A repeat sighting must not create a second profile');
      assert.strictEqual(r.profile.id, profileId, 'Every caller must resolve the same profile');
    }

    const { count } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('clerk_user_id', clerkUserId);
    assert.strictEqual(count, 1, 'Exactly one profile may exist per Clerk identity');

    /* ── 6. Verification mirrors Clerk in BOTH directions ────────────────── */

    const unverifiedAgain = await ProfileRepository.syncFromClerk(
      racers[0].profile,
      { ...identity, emailVerified: false }
    );
    assert.strictEqual(unverifiedAgain.email_verified_at, null,
      'If Clerk stops reporting an address as verified, LOUMOO must stop trusting it too');
    assert.strictEqual(unverifiedAgain.is_email_verified, false);

    /* ── 7. Derived columns are not directly writable ────────────────────── */

    let refused = false;
    try {
      await ProfileRepository.update(profileId, { is_email_verified: true });
    } catch (err) {
      refused = true;
    }
    assert.ok(refused,
      'Writing the derived verification boolean must be refused — it is computed from the timestamp');
  } finally {
    if (profileId) {
      try { await db.from('profiles').delete().eq('id', profileId); } catch (e) { /* best effort */ }
    }
  }

  console.log('  ✓ Clerk identity mapping, verification mirroring and race-safe provisioning');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
