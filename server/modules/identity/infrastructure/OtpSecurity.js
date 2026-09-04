/**
 * LOUMOO — OTP & Signup-Secret Cryptography
 * ---------------------------------------------------------------------------
 * The cryptographic primitives behind the email OTP flow, kept in one place so
 * the route handler only expresses policy (attempt limits, throttling) and
 * never touches key material directly.
 *
 * What this module guarantees:
 *   - OTP codes are drawn from a CSPRNG (`crypto.randomInt`), not `Math.random`,
 *     so they cannot be predicted from observing earlier values.
 *   - The OTP is never stored in the clear. Only an HMAC of the code is cached,
 *     and verification is a constant-time comparison of HMACs — a cache dump
 *     does not reveal a live code, and a wrong guess leaks no timing.
 *   - The password a user chooses at signup is held only transiently, and only
 *     as AES-256-GCM ciphertext, until the identity provider account is
 *     confirmed. Plaintext credentials never sit at rest in the cache.
 *
 * All keys are derived with HKDF from SUPABASE_JWT_SECRET — the one secret the
 * deployment already treats as security-critical and refuses to boot without in
 * production. There is deliberately no fallback: if it is absent, OTP security
 * is unavailable and the caller fails loudly rather than degrading.
 */

'use strict';

const crypto = require('crypto');
const config = require('../../../config/env');

// Non-secret, stable salt/info labels. Distinct `info` strings give each use a
// cryptographically independent key from the same root secret.
const HKDF_SALT = Buffer.from('loumoo.identity.otp.v1');
const OTP_HASH_INFO = Buffer.from('otp-hash-key');
const SECRET_ENC_INFO = Buffer.from('signup-secret-enc-key');

const IV_BYTES = 12;   // GCM standard nonce length
const TAG_BYTES = 16;  // GCM auth tag length

function rootSecret() {
  const secret = config.supabase.jwtSecret;
  if (!secret) {
    throw new Error('OTP security is unavailable: SUPABASE_JWT_SECRET is not configured.');
  }
  return secret;
}

function deriveKey(info, length = 32) {
  return Buffer.from(crypto.hkdfSync('sha256', rootSecret(), HKDF_SALT, info, length));
}

/**
 * A cryptographically secure numeric OTP. `randomInt` is rejection-sampled and
 * uniform; padding to `digits` keeps the full 10^digits space (including codes
 * with leading zeros) rather than collapsing it to a 9x10^(n-1) range.
 */
function generateOtp(digits = 6) {
  const max = 10 ** digits;
  return String(crypto.randomInt(0, max)).padStart(digits, '0');
}

/** HMAC-SHA256 of a code, hex-encoded. Deterministic for a given deployment. */
function hashOtp(code) {
  return crypto
    .createHmac('sha256', deriveKey(OTP_HASH_INFO))
    .update(String(code))
    .digest('hex');
}

/** Constant-time check of a candidate code against a stored HMAC. */
function verifyOtp(code, storedHash) {
  if (!storedHash) return false;
  const computed = Buffer.from(hashOtp(code), 'utf8');
  const stored = Buffer.from(String(storedHash), 'utf8');
  if (computed.length !== stored.length) {
    crypto.timingSafeEqual(computed, computed);
    return false;
  }
  return crypto.timingSafeEqual(computed, stored);
}

/**
 * Encrypts a short-lived secret (the signup password) for at-rest storage in
 * the OTP cache. Output is base64( iv | tag | ciphertext ). Returns null for an
 * empty input so callers can store "no password captured" unambiguously.
 */
function encryptSecret(plaintext) {
  if (plaintext === undefined || plaintext === null || plaintext === '') return null;
  const key = deriveKey(SECRET_ENC_INFO);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/**
 * Reverses {@link encryptSecret}. Returns null on any tampering or malformed
 * input — a decryption failure is never allowed to throw into the auth flow.
 */
function decryptSecret(payload) {
  if (!payload) return null;
  try {
    const raw = Buffer.from(String(payload), 'base64');
    if (raw.length < IV_BYTES + TAG_BYTES) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = raw.subarray(IV_BYTES + TAG_BYTES);
    const key = deriveKey(SECRET_ENC_INFO);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch (e) {
    return null;
  }
}

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  encryptSecret,
  decryptSecret
};
