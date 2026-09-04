/**
 * LOUMOO — Session Token Trust Boundary & OTP Cryptography
 * ---------------------------------------------------------------------------
 * Pure-unit coverage (no database, no HTTP) for the two primitives that carry
 * the Authentication & Identity trust boundary:
 *
 *   - SessionToken: HS256 sign/verify with pinned algorithm, constant-time
 *     signature check, and total claim validation (exp, nbf, iat, iss, aud,
 *     required claims). Proves algorithm-confusion, tampering, expiry and
 *     claim-substitution are all rejected.
 *   - OtpSecurity: CSPRNG code generation, HMAC storage with constant-time
 *     verification, and AES-256-GCM at-rest encryption of the signup password.
 */

require('../setup');

// Self-contained: give the crypto a stable root key even when .env.local is
// absent (CI). Must be set before OtpSecurity pulls in the config module.
process.env.SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET
  || 'unit-test-session-signing-secret-0123456789';

const assert = require('assert');
const crypto = require('crypto');

const SessionToken = require('../../server/modules/identity/infrastructure/SessionToken');
const OtpSecurity = require('../../server/modules/identity/infrastructure/OtpSecurity');

const SECRET = 'a-very-long-test-signing-secret-value-9f8e7d6c5b4a';

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/** Forge a token with an arbitrary header/payload but a VALID HMAC signature. */
function forge(header, payload, secret = SECRET) {
  const h = b64url(header);
  const b = b64url(payload);
  const sig = crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${sig}`;
}

const VERIFY_OPTS = {
  issuer: SessionToken.ISSUER,
  audience: SessionToken.AUDIENCE,
  requiredClaims: ['sub']
};

function runSessionToken() {
  console.log('  Testing session-token trust boundary...');

  /* ── 1. Honest round-trip ─────────────────────────────────────────────── */
  const token = SessionToken.sign({ sub: 'user_123', email: 'a@loumoo.cm' }, SECRET);
  const good = SessionToken.verify(token, SECRET, VERIFY_OPTS);
  assert.strictEqual(good.ok, true, 'A freshly minted token must verify');
  assert.strictEqual(good.payload.sub, 'user_123');
  assert.strictEqual(good.payload.iss, SessionToken.ISSUER);
  assert.strictEqual(good.payload.aud, SessionToken.AUDIENCE);
  for (const claim of ['iat', 'nbf', 'exp']) {
    assert.strictEqual(typeof good.payload[claim], 'number', `${claim} must be stamped by the minter`);
  }

  /* ── 2. Wrong secret cannot verify ────────────────────────────────────── */
  assert.strictEqual(SessionToken.verify(token, 'not-the-secret', VERIFY_OPTS).ok, false,
    'A token must not verify under a different secret');

  /* ── 3. Tampered payload is rejected at the signature ─────────────────── */
  const [h, b] = token.split('.');
  const forgedPayload = b64url({ sub: 'admin', iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE, exp: 9999999999 });
  const tampered = `${h}.${forgedPayload}.${token.split('.')[2]}`;
  const tamperedRes = SessionToken.verify(tampered, SECRET, VERIFY_OPTS);
  assert.strictEqual(tamperedRes.ok, false, 'A payload swap must invalidate the signature');
  assert.strictEqual(tamperedRes.reason, 'signature');

  /* ── 4. Algorithm confusion / downgrade is inert ──────────────────────── */
  // `alg: none` with an otherwise VALID HMAC signature must still be refused,
  // purely on the header — the verifier never trusts the declared algorithm.
  const noneTok = forge({ alg: 'none', typ: 'JWT' }, { sub: 'x', iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE, exp: 9999999999 });
  assert.strictEqual(SessionToken.verify(noneTok, SECRET, VERIFY_OPTS).reason, 'alg',
    'alg:none must be rejected on the header');
  const hs512Tok = forge({ alg: 'HS512', typ: 'JWT' }, { sub: 'x', iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE, exp: 9999999999 });
  assert.strictEqual(SessionToken.verify(hs512Tok, SECRET, VERIFY_OPTS).reason, 'alg',
    'A downgraded/other algorithm must be rejected');

  /* ── 5. Expiry, not-before and issued-at are enforced ─────────────────── */
  const expiredTok = SessionToken.sign({ sub: 'x' }, SECRET, { expiresInSeconds: -3600 });
  assert.strictEqual(SessionToken.verify(expiredTok, SECRET, VERIFY_OPTS).reason, 'expired');

  const nowS = Math.floor(Date.now() / 1000);
  const futureNbf = forge({ alg: 'HS256', typ: 'JWT' },
    { sub: 'x', iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE, exp: nowS + 3600, nbf: nowS + 3600 });
  assert.strictEqual(SessionToken.verify(futureNbf, SECRET, VERIFY_OPTS).reason, 'not-yet-valid');

  const noExp = forge({ alg: 'HS256', typ: 'JWT' }, { sub: 'x', iss: SessionToken.ISSUER, aud: SessionToken.AUDIENCE });
  assert.strictEqual(SessionToken.verify(noExp, SECRET, VERIFY_OPTS).reason, 'exp-missing',
    'A token with no expiry must be refused');

  /* ── 6. Issuer and audience are validated where configured ────────────── */
  const wrongIss = SessionToken.sign({ sub: 'x' }, SECRET, { issuer: 'evil-issuer' });
  assert.strictEqual(SessionToken.verify(wrongIss, SECRET, VERIFY_OPTS).reason, 'issuer');

  const wrongAud = SessionToken.sign({ sub: 'x' }, SECRET, { audience: 'anon' });
  assert.strictEqual(SessionToken.verify(wrongAud, SECRET, VERIFY_OPTS).reason, 'audience');

  /* ── 7. Required claims must be present ────────────────────────────────── */
  const noSub = SessionToken.sign({ email: 'a@loumoo.cm' }, SECRET);
  assert.strictEqual(SessionToken.verify(noSub, SECRET, VERIFY_OPTS).reason, 'missing:sub');

  /* ── 8. Structural garbage never resolves ─────────────────────────────── */
  for (const bad of ['', null, undefined, 'not.a.jwt', 'only-one-part', 'a.b', 'a.b.c.d']) {
    assert.strictEqual(SessionToken.verify(bad, SECRET, VERIFY_OPTS).ok, false,
      `"${bad}" must not verify`);
  }

  /* ── 9. The constant-time comparator is correct ───────────────────────── */
  assert.strictEqual(SessionToken.timingSafeEqualStrings('abc', 'abc'), true);
  assert.strictEqual(SessionToken.timingSafeEqualStrings('abc', 'abd'), false);
  assert.strictEqual(SessionToken.timingSafeEqualStrings('abc', 'abcd'), false,
    'Different lengths cannot be equal');

  console.log('  ✓ Session token: algorithm pinned, constant-time, fully claim-validated');
}

function runOtpSecurity() {
  console.log('  Testing OTP cryptography...');

  /* ── 1. Codes are 6 digits and come from a CSPRNG ─────────────────────── */
  const samples = new Set();
  for (let i = 0; i < 500; i++) {
    const code = OtpSecurity.generateOtp();
    assert.match(code, /^\d{6}$/, 'An OTP must be exactly six digits');
    samples.add(code);
  }
  assert.ok(samples.size > 400,
    `500 draws must be near-unique for a CSPRNG (got ${samples.size} distinct)`);

  /* ── 2. Only an HMAC is stored, verified in constant time ─────────────── */
  const code = OtpSecurity.generateOtp();
  const hash = OtpSecurity.hashOtp(code);
  assert.notStrictEqual(hash, code, 'The stored value must not be the code itself');
  assert.match(hash, /^[0-9a-f]{64}$/, 'The stored value must be an HMAC-SHA256 digest');
  assert.strictEqual(OtpSecurity.verifyOtp(code, hash), true, 'The correct code must verify');

  // A wrong guess of the same shape must fail — and never throw.
  const wrong = code === '000000' ? '000001' : '000000';
  assert.strictEqual(OtpSecurity.verifyOtp(wrong, hash), false, 'A wrong code must not verify');
  assert.strictEqual(OtpSecurity.verifyOtp('garbage', hash), false);
  assert.strictEqual(OtpSecurity.verifyOtp(code, null), false, 'A missing hash never verifies');

  /* ── 3. The signup password round-trips through AES-GCM, never plaintext ─ */
  const secret = 'S3cr3t-Passw0rd!';
  const enc = OtpSecurity.encryptSecret(secret);
  assert.ok(enc && typeof enc === 'string', 'Encryption must produce a string');
  assert.ok(!enc.includes(secret), 'The ciphertext must not contain the plaintext');
  assert.strictEqual(OtpSecurity.decryptSecret(enc), secret, 'Decryption must recover the password');

  // Tampering with the ciphertext is detected (GCM auth tag) and yields null.
  const raw = Buffer.from(enc, 'base64');
  raw[raw.length - 1] ^= 0xff;
  assert.strictEqual(OtpSecurity.decryptSecret(raw.toString('base64')), null,
    'A tampered ciphertext must not decrypt');
  assert.strictEqual(OtpSecurity.decryptSecret('not-valid-base64-!!!'), null);
  assert.strictEqual(OtpSecurity.encryptSecret(''), null, 'An empty secret encrypts to null');
  assert.strictEqual(OtpSecurity.decryptSecret(null), null);

  console.log('  ✓ OTP crypto: CSPRNG codes, HMAC storage, GCM-encrypted password at rest');
}

async function run() {
  runSessionToken();
  runOtpSecurity();
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
