/**
 * Which suites need real credentials, and which ones.
 *
 * A suite listed here is SKIPPED (loudly — see tests/run_all.js) when any of
 * its variables is unset or blank, instead of failing with a stack trace about
 * a missing Supabase/Clerk key. A suite NOT listed here is expected to run with
 * no credentials at all; if it fails with a missing-credentials error anyway,
 * the runner says so and points back at this file rather than hiding it.
 *
 * Keys are paths relative to tests/, with forward slashes.
 */

const SUPABASE = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const CLERK = ['CLERK_SECRET_KEY'];

// Signing/verifying sessions and OTPs (SessionToken, OtpSecurity) also needs this.
const AUTH = [...SUPABASE, 'SUPABASE_JWT_SECRET'];

/*
 * How this list was built: every suite was run with no credentials. A suite is
 * listed when it failed with the missing-credentials error it throws
 * ("Supabase error: … not initialized", "Clerk error: … CLERK_SECRET_KEY is not
 * configured", "OTP security is unavailable: SUPABASE_JWT_SECRET …").
 *
 * Where the evidence is indirect — marked (indirect) — the suite failed without
 * credentials for a reason that is not the thrown signature (the server answered
 * 500 to signup, or an unrelated assertion failed) and there is no database here
 * to prove the cause. They are listed because every one of them drives the real
 * app through tests/helpers/harness.js against a real database. If a listed
 * suite turns out to pass without credentials, delete its entry.
 *
 * Variable lists record only what was observed. If a suite passes the first
 * check but fails later for a variable not listed, the runner reports a
 * missing-credentials failure and points back here.
 */
const REQUIRED_ENV = {
  // ── unit ───────────────────────────────────────────────────────────────────
  'unit/account_deletion.test.js': SUPABASE,
  'unit/account_deletion_and_cache_lifecycle.test.js': SUPABASE,
  'unit/account_security.test.js': CLERK,
  'unit/adaptive_onboarding.test.js': SUPABASE,
  'unit/address_management.test.js': SUPABASE,
  'unit/auth.test.js': SUPABASE,
  'unit/buyer_seller_permissions.test.js': SUPABASE,
  'unit/followed_stores.test.js': SUPABASE,
  'unit/otp_verification.test.js': AUTH,
  'unit/signup_signin.test.js': AUTH, // (indirect) signup answers 500
  'unit/store_business.test.js': SUPABASE,
  'unit/user_activity.test.js': SUPABASE,

  // ── integration (only reachable with LOUMOO_RUN_INTEGRATION=1) ─────────────
  // Not listed because they pass with no credentials at all:
  //   commerce_security_lifecycle, hotel_reservation_whatsapp,
  //   login_bruteforce, travel_security_lifecycle
  'integration/announcement_endpoints.test.js': SUPABASE,
  'integration/api.test.js': SUPABASE, // (indirect)
  'integration/api_security.test.js': SUPABASE,
  'integration/auth_endpoints.test.js': AUTH, // (indirect) signup answers 500
  'integration/auth_sensitive_exposure.test.js': AUTH, // (indirect) signup answers 500
  'integration/commerce_endpoints.test.js': SUPABASE,
  'integration/comparison_endpoints.test.js': SUPABASE, // (indirect)
  'integration/core_commerce_unification.test.js': SUPABASE,
  'integration/delivery_flow.test.js': SUPABASE,
  'integration/identity_resolution.test.js': SUPABASE,
  'integration/identity_role_hardening.test.js': SUPABASE,
  'integration/otp_bruteforce.test.js': AUTH,
  'integration/seller_journey.test.js': SUPABASE,
  'integration/social_organization_endpoints.test.js': SUPABASE,
  'integration/travel_durability_concurrency.test.js': SUPABASE,
  'integration/travel_endpoints.test.js': SUPABASE,
  'integration/travel_production_audit.test.js': SUPABASE,
  'integration/travel_production_backend.test.js': SUPABASE,
  'integration/travel_security_audit.test.js': SUPABASE,
  'integration/upload_transactions.test.js': SUPABASE
};

/**
 * Suites that read the generated publish directory (public/). It is gitignored
 * build output produced by scripts/assemble_public.js, so a fresh checkout does
 * not have it and the CI test job never built it. Found by running every suite
 * on a tree without public/: these two, and only these, fail. tests/run_all.js
 * assembles it before running them.
 */
const NEEDS_PUBLIC = new Set([
  'unit/hotel_experience_redesign.test.js',
  'unit/super_admin_phase4.test.js'
]);

/** The names in `names` that are unset or blank in `env`. */
function missing(names, env = process.env) {
  return names.filter(name => !String(env[name] || '').trim());
}

/** Names from the suite's requirement list that are unset or blank in `env`. */
function missingEnv(label, env = process.env) {
  return missing(REQUIRED_ENV[label] || [], env);
}

/**
 * Error signatures that mean "this suite needed credentials it did not get".
 *
 * These match the InfrastructureError a suite THROWS ("Supabase error: Admin
 * client is not initialized …", "Clerk error: … CLERK_SECRET_KEY is not
 * configured"). They deliberately do not match the "[Clerk] CLERK_SECRET_KEY is
 * not configured" WARN line, which every suite that loads the server logs at
 * import time — that would label every failure a credentials failure.
 */
const MISSING_CREDENTIAL_SIGNATURES = [
  /Supabase error: .*not initialized/,
  /Clerk error: .*CLERK_SECRET_KEY is not configured/
];

function looksLikeMissingCredentials(output) {
  return MISSING_CREDENTIAL_SIGNATURES.some(re => re.test(output));
}

/* ───────────────────────── real services vs. hermetic ───────────────────────── */

const fs = require('fs');
const path = require('path');

/** The explicit opt-in: LOUMOO_RUN_INTEGRATION=1 (or true/yes). Anything else is hermetic. */
function realServicesEnabled(env = process.env) {
  return ['1', 'true', 'yes'].includes(String(env.LOUMOO_RUN_INTEGRATION || '').trim().toLowerCase());
}

// Variables that carry credentials for, or switch on, a real service.
const SERVICE_ENV = new RegExp(
  '^(NEXT_PUBLIC_)?(SUPABASE|CLERK)_|^REDIS_|^SENTRY_|^DATABASE_|^PG[A-Z_]*$|' +
  '^(RESEND_API_KEY|POSTHOG_API_KEY|OPENAI_API_KEY|AISSTREAM_[A-Z_]+|ELEVENLABS_[A-Z_]+|' +
  'GOOGLE_APP_PASSWORD|GITHUB_TOKEN|ENABLE_TEST_REMOTE_DB)$',
  'i'
);

/**
 * Makes `env` hermetic: removes every service credential, tells
 * server/config/env.js to skip .env, and points the browser API client (which
 * otherwise defaults to http://localhost:8080 — a developer's own dev server,
 * usually started with the real .env) at a loopback port that refuses.
 * Mutates and returns `env`.
 */
function scrubServiceEnv(env) {
  for (const name of Object.keys(env)) {
    if (SERVICE_ENV.test(name)) delete env[name];
  }
  env.LOUMOO_NO_DOTENV = '1';
  env.LOUMOO_API_URL = 'http://127.0.0.1:9';
  return env;
}

/** Mirrors server/config/env.js (.env.local, else .env); only used in real-services mode. */
function loadProjectEnv(root = path.resolve(__dirname, '..', '..')) {
  const dotenv = require('dotenv');
  const local = path.join(root, '.env.local');
  const base = path.join(root, '.env');
  if (fs.existsSync(local)) dotenv.config({ path: local });
  else if (fs.existsSync(base)) dotenv.config({ path: base });
}

// The deployed project (docs/DEPLOYMENT.md, .mcp.json). Real-services mode refuses to point at it
// unless the operator types the acknowledgement below, so exporting LOUMOO_RUN_INTEGRATION=1 in a
// shell profile can never silently write test rows or settings into production.
const PRODUCTION_SUPABASE_REFS = ['vhojbhvaasjvolcfkobz'];
const PRODUCTION_ACK = 'I_UNDERSTAND_THIS_WRITES_TO_PRODUCTION';

function supabaseHost(env = process.env) {
  try {
    return new URL(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  } catch (e) {
    return null;
  }
}

/** The production project ref `env` points at, or null. */
function productionTarget(env = process.env) {
  const haystack = `${supabaseHost(env) || ''} ${env.SUPABASE_PROJECT_REF || ''}`.toLowerCase();
  return PRODUCTION_SUPABASE_REFS.find(ref => haystack.includes(ref)) || null;
}

/** Exits 2 when real-services mode would hit production without the acknowledgement. */
function refuseUnacknowledgedProduction(env = process.env) {
  const ref = productionTarget(env);
  if (ref && env.LOUMOO_TEST_ALLOW_PRODUCTION_DB !== PRODUCTION_ACK) {
    console.error(`[tests] REFUSING TO RUN: SUPABASE_URL points at the production project (${ref}).`);
    console.error('        Tests create and delete real rows and rewrite system settings. Use a separate test project.');
    console.error(`        To override deliberately: LOUMOO_TEST_ALLOW_PRODUCTION_DB=${PRODUCTION_ACK}`);
    process.exit(2);
  }
}

module.exports = {
  realServicesEnabled,
  scrubServiceEnv,
  loadProjectEnv,
  supabaseHost,
  productionTarget,
  refuseUnacknowledgedProduction,
  SUPABASE,
  CLERK,
  REQUIRED_ENV,
  NEEDS_PUBLIC,
  missing,
  missingEnv,
  looksLikeMissingCredentials
};
