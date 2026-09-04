/**
 * LOUMOO — Session Token Trust Boundary (HS256)
 * ---------------------------------------------------------------------------
 * The SINGLE place a LOUMOO session token is minted and verified. Both
 * `authRoutes` (minting) and `SupabaseIdentityProvider` (verification) go
 * through here so the two halves can never drift apart — the algorithm, the
 * issuer, the audience and the required claims are defined once.
 *
 * Why hand-rolled and not a library: LOUMOO already signs and verifies with
 * Node's native `crypto` HMAC, and the entire security value of a JWT is in the
 * verification rules — not in the encoder. Those rules are made explicit and
 * total here:
 *
 *   - The algorithm is pinned to HS256 and read from the header BEFORE any
 *     signature work. An `alg: none` or an attempted downgrade is rejected
 *     outright — the decoder never "trusts what the token says it is".
 *   - The signature is checked with a constant-time comparison. A byte-by-byte
 *     `!==` on the base64url string leaked timing that narrows a forgery.
 *   - The payload is only JSON-parsed AFTER the signature verifies. Nothing in
 *     an unverified token is ever read as a claim.
 *   - Expiry is mandatory; not-before, issued-at, issuer and audience are
 *     validated where present/configured; required claims must be non-empty.
 */

'use strict';

const crypto = require('crypto');

const ALG = 'HS256';
const TOKEN_TYP = 'JWT';
const ISSUER = 'supabase';
const AUDIENCE = 'authenticated';
const DEFAULT_TTL_SECONDS = 30 * 86400; // 30 days
const CLOCK_TOLERANCE_SECONDS = 60;

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * Constant-time string comparison that does not short-circuit on the first
 * differing byte and does not leak length through an early return path any more
 * than it must. Unequal lengths cannot be a match, but we still touch the
 * timing-safe primitive so the fast path and the slow path look alike.
 */
function timingSafeEqualStrings(a, b) {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) {
    crypto.timingSafeEqual(ab, ab);
    return false;
  }
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Mints a signed HS256 session token.
 *
 * The caller supplies identity claims (`sub`, `email`, `role`, metadata). This
 * function OWNS the security-relevant claims: `iss`, `aud`, `iat`, `nbf` and
 * `exp` are always set here and always overwrite anything the caller passed, so
 * a caller can never mint a token that would fail our own verifier.
 */
function sign(claims, secret, options = {}) {
  if (!secret) {
    throw new Error('SessionToken.sign requires a signing secret.');
  }
  const now = Math.floor(Date.now() / 1000);
  const ttl = Number.isFinite(options.expiresInSeconds)
    ? options.expiresInSeconds
    : DEFAULT_TTL_SECONDS;

  const header = { alg: ALG, typ: TOKEN_TYP };
  const payload = Object.assign({}, claims, {
    iss: options.issuer || ISSUER,
    aud: options.audience || AUDIENCE,
    iat: now,
    nbf: now,
    exp: now + ttl
  });

  const h = base64urlJson(header);
  const b = base64urlJson(payload);
  const signature = crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${signature}`;
}

/**
 * Verifies a session token against `secret`.
 *
 * @returns {{ok: true, payload: object} | {ok: false, reason: string}}
 *   A discriminated result rather than a throw, so callers can decide whether
 *   an invalid token is an error (requireAuth) or simply "no session"
 *   (optionalAuth) without try/catch, and can log the reason without ever
 *   surfacing it to the client.
 */
function verify(token, secret, options = {}) {
  const fail = (reason) => ({ ok: false, reason });

  if (!secret) return fail('no-secret');
  if (!token || typeof token !== 'string') return fail('no-token');

  const parts = token.split('.');
  if (parts.length !== 3) return fail('malformed');
  const [h, b, signature] = parts;
  if (!h || !b || !signature) return fail('malformed');

  // 1) Algorithm enforcement, from the header, BEFORE any crypto or payload
  //    read. This is what makes algorithm-confusion / `alg:none` inert.
  let header;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString('utf8'));
  } catch (e) {
    return fail('bad-header');
  }
  if (!header || typeof header !== 'object') return fail('bad-header');
  if (header.alg !== ALG) return fail('alg');
  if (header.typ && header.typ !== TOKEN_TYP) return fail('typ');

  // 2) Signature — constant-time. Everything after this line is trusted; nothing
  //    before it is.
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${b}`).digest('base64url');
  if (!timingSafeEqualStrings(signature, expected)) return fail('signature');

  // 3) The payload is only now safe to parse and read.
  let payload;
  try {
    payload = JSON.parse(Buffer.from(b, 'base64url').toString('utf8'));
  } catch (e) {
    return fail('bad-payload');
  }
  if (!payload || typeof payload !== 'object') return fail('bad-payload');

  const now = Math.floor(Date.now() / 1000);
  const tolerance = Number.isFinite(options.clockToleranceSeconds)
    ? options.clockToleranceSeconds
    : CLOCK_TOLERANCE_SECONDS;

  // Expiry is mandatory. A session token with no `exp` is not acceptable.
  if (typeof payload.exp !== 'number') return fail('exp-missing');
  if (now > payload.exp + tolerance) return fail('expired');

  // Not-before, where present.
  if (typeof payload.nbf === 'number' && now + tolerance < payload.nbf) {
    return fail('not-yet-valid');
  }

  // Issued-at sanity, where present: a token minted in the future is malformed.
  if (typeof payload.iat === 'number' && payload.iat - tolerance > now) {
    return fail('iat-future');
  }

  // Issuer, where configured.
  if (options.issuer && payload.iss !== options.issuer) return fail('issuer');

  // Audience, where configured (string or array form).
  if (options.audience) {
    const aud = payload.aud;
    const matches = Array.isArray(aud) ? aud.includes(options.audience) : aud === options.audience;
    if (!matches) return fail('audience');
  }

  // Required claims must be present and non-empty.
  const required = Array.isArray(options.requiredClaims) ? options.requiredClaims : ['sub'];
  for (const claim of required) {
    const value = payload[claim];
    if (value === undefined || value === null || value === '') return fail(`missing:${claim}`);
  }

  return { ok: true, payload };
}

module.exports = {
  sign,
  verify,
  timingSafeEqualStrings,
  ALG,
  TOKEN_TYP,
  ISSUER,
  AUDIENCE,
  DEFAULT_TTL_SECONDS,
  CLOCK_TOLERANCE_SECONDS
};
