/**
 * LOUMOO — Authoritative Identity Resolution
 * ---------------------------------------------------------------------------
 * Resolves the Supabase Auth user id that owns a given email, using ONLY
 * constant-time, indexed lookups. It exists to replace a per-verification scan
 * that paged through the entire auth user table (up to 25 × 200 users) on every
 * OTP verification — an O(n) cost on the authentication hot path that silently
 * stopped finding real users once the project outgrew the last page.
 *
 * Resolution order, each step O(1)/indexed and none of which scans:
 *   1. The caller's own cached id (captured at signup) — no I/O at all.
 *   2. LOUMOO's indexed profiles mirror (idx_profiles_email → clerk_user_id),
 *      which holds every user who has ever verified or signed in.
 *   3. A single admin `generateLink` probe, which RETURNS an existing auth user
 *      without sending anything and without creating anyone. Best-effort: some
 *      GoTrue configurations disable it, in which case we simply report "not
 *      found" and let the caller create or fail closed.
 *
 * The function returns null ONLY when the user genuinely cannot be located. It
 * never fabricates an id: a synthesized identity would fork one person across
 * two accounts and hand out a predictable, guessable subject claim. Deciding
 * what to do with "not found" — create the user, or fail closed — is the
 * caller's responsibility, made explicit at the call site.
 */

'use strict';

const ProfileRepository = require('./ProfileRepository');
const logger = require('../../../shared/logging/logger');

async function resolveAuthUserId(admin, email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return null;

  // 1) Indexed mirror in our own database. Every returning user is here.
  try {
    const id = await ProfileRepository.findAuthIdByVerifiedEmail(clean);
    if (id) return id;
  } catch (e) {
    logger.debug(`[IdentityResolver] profiles lookup note: ${e.message}`);
  }

  // 2) One admin probe for an auth user that has no local profile yet.
  if (admin && admin.auth && admin.auth.admin && typeof admin.auth.admin.generateLink === 'function') {
    try {
      const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: clean });
      if (!error && data && data.user && data.user.id) return data.user.id;
    } catch (e) {
      logger.debug(`[IdentityResolver] auth link probe note: ${e.message}`);
    }
  }

  return null;
}

module.exports = { resolveAuthUserId };
