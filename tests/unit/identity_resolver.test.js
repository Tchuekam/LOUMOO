/**
 * LOUMOO — Authoritative Identity Resolution (unit)
 * ---------------------------------------------------------------------------
 * Proves the resolver used during OTP verification is indexed-first, probes the
 * identity provider only as a fallback, and — critically — returns null rather
 * than fabricating an id when a user cannot be found. No database, no network:
 * the indexed profiles lookup is stubbed and the admin client is a fake.
 */

require('../setup');
const assert = require('assert');

const ProfileRepository = require('../../server/modules/identity/infrastructure/ProfileRepository');
const { resolveAuthUserId } = require('../../server/modules/identity/infrastructure/IdentityResolver');

function fakeAdmin(generateLink) {
  return { auth: { admin: { generateLink } } };
}

async function run() {
  console.log('  Testing authoritative identity resolution...');

  const original = ProfileRepository.findAuthIdByVerifiedEmail;

  try {
    /* ── 1. The indexed profiles mirror wins; the provider is not probed ──── */
    let probed = false;
    ProfileRepository.findAuthIdByVerifiedEmail = async (email) => {
      assert.strictEqual(email, 'known@loumoo.cm', 'The email must be normalised before lookup');
      return 'auth_from_profiles';
    };
    const admin = fakeAdmin(async () => { probed = true; return { data: { user: { id: 'nope' } } }; });
    assert.strictEqual(await resolveAuthUserId(admin, '  Known@Loumoo.cm '), 'auth_from_profiles');
    assert.strictEqual(probed, false, 'A profiles hit must not trigger an admin probe');

    /* ── 2. No profile → single admin probe resolves an existing auth user ── */
    ProfileRepository.findAuthIdByVerifiedEmail = async () => null;
    const admin2 = fakeAdmin(async ({ type, email }) => {
      assert.strictEqual(type, 'magiclink', 'The probe must not create a user');
      assert.strictEqual(email, 'noprofile@loumoo.cm');
      return { data: { user: { id: 'auth_from_probe' } }, error: null };
    });
    assert.strictEqual(await resolveAuthUserId(admin2, 'noprofile@loumoo.cm'), 'auth_from_probe');

    /* ── 3. Nothing resolves → null, NEVER a fabricated id ────────────────── */
    const admin3 = fakeAdmin(async () => ({ data: null, error: { message: 'user not found' } }));
    const unresolved = await resolveAuthUserId(admin3, 'ghost@loumoo.cm');
    assert.strictEqual(unresolved, null,
      'An unresolvable email must return null so the caller fails closed, not a synthesized id');

    /* ── 4. A profiles lookup error is contained; the probe still runs ────── */
    ProfileRepository.findAuthIdByVerifiedEmail = async () => { throw new Error('db unavailable'); };
    const admin4 = fakeAdmin(async () => ({ data: { user: { id: 'auth_after_db_error' } }, error: null }));
    assert.strictEqual(await resolveAuthUserId(admin4, 'x@loumoo.cm'), 'auth_after_db_error',
      'A failed mirror lookup must not throw — it falls through to the probe');

    /* ── 5. Empty input short-circuits with no lookups ────────────────────── */
    let touched = false;
    ProfileRepository.findAuthIdByVerifiedEmail = async () => { touched = true; return 'x'; };
    assert.strictEqual(await resolveAuthUserId(admin, ''), null);
    assert.strictEqual(touched, false, 'An empty email must not reach any lookup');

    /* ── 6. No usable admin client → mirror-only, then null ───────────────── */
    ProfileRepository.findAuthIdByVerifiedEmail = async () => null;
    assert.strictEqual(await resolveAuthUserId(null, 'someone@loumoo.cm'), null,
      'Without an admin client and without a profile, resolution is null (never fabricated)');

    console.log('  ✓ Identity resolution: indexed-first, probe fallback, never fabricates');
  } finally {
    ProfileRepository.findAuthIdByVerifiedEmail = original;
  }
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
