/**
 * LOUMOO — Buyer/Seller Separation & Tenant Isolation
 * ---------------------------------------------------------------------------
 * The old `resourceOwnershipGuard` compared the request's user against an id
 * extracted by a caller-supplied function — including, at several call sites,
 * an id taken from the request itself. It has been replaced by capability
 * checks plus repository-backed ownership resolution.
 *
 * This suite covers the guards directly (fast, no HTTP) — the end-to-end
 * proof over real requests lives in tests/integration/api_security.test.js.
 */

require('../setup');
const assert = require('assert');

const { requireCapability, requireAccountState } =
  require('../../server/modules/identity/presentation/guards/authGuard');
const { requireListingOwnership } =
  require('../../server/modules/listing/presentation/guards/listingOwnershipGuard');
const {
  deriveAccountState,
  ACCOUNT_STATES,
  ONBOARDING_STATUS,
  SELLER_STATUS
} = require('../../server/modules/identity/domain/AccountState');
const harness = require('../helpers/harness');

/** Runs a guard and resolves to the error it passed to next(), or null. */
function runGuard(guard, req) {
  return new Promise(resolve => {
    const result = guard(req, {}, err => resolve(err || null));
    if (result && typeof result.then === 'function') result.catch(resolve);
  });
}

function stateFor(kind) {
  const base = {
    id: 'usr_x',
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    onboardingStatus: ONBOARDING_STATUS.COMPLETED,
    sellerStatus: SELLER_STATUS.NONE
  };
  if (kind === 'buyer') return deriveAccountState(base);
  if (kind === 'seller') return deriveAccountState({ ...base, sellerStatus: SELLER_STATUS.READY });
  if (kind === 'unverified') return deriveAccountState({ ...base, emailVerifiedAt: null });
  return deriveAccountState(null);
}

async function run() {
  console.log('  Testing buyer/seller separation & tenant isolation...');

  /* ── 1. Capability guard: a buyer is not a seller ─────────────────────── */

  const buyerReq = {
    principal: { id: 'usr_buyer', primaryRole: 'customer' },
    accountState: stateFor('buyer'),
    originalUrl: '/api/v1/listings'
  };

  assert.strictEqual(await runGuard(requireCapability('canPurchase'), buyerReq), null,
    'A fully onboarded buyer may purchase');
  assert.strictEqual(await runGuard(requireCapability('canSaveItems'), buyerReq), null);
  assert.strictEqual(await runGuard(requireCapability('canStartSelling'), buyerReq), null);

  const buyerDenied = await runGuard(requireCapability('canCreateListing'), buyerReq);
  assert.ok(buyerDenied, 'A buyer must be denied listing creation');
  assert.strictEqual(buyerDenied.statusCode, 403);
  assert.ok(buyerDenied.details.resolveAt,
    'A denial must carry the destination that would resolve it');

  /* ── 2. Capability guard: a seller may sell ───────────────────────────── */

  const sellerReq = {
    principal: { id: 'usr_seller', primaryRole: 'seller' },
    accountState: stateFor('seller'),
    originalUrl: '/api/v1/listings'
  };
  assert.strictEqual(await runGuard(requireCapability('canCreateListing'), sellerReq), null);
  assert.strictEqual(await runGuard(requireCapability('canPublishListing'), sellerReq), null);
  assert.strictEqual(await runGuard(requireCapability('canPurchase'), sellerReq), null,
    'Being a seller must not remove the ability to buy');

  /* ── 3. Verification dominates every capability ───────────────────────── */

  const unverifiedReq = {
    principal: { id: 'usr_unverified', primaryRole: 'customer' },
    accountState: stateFor('unverified'),
    originalUrl: '/api/v1/listings'
  };
  for (const cap of ['canCreateListing', 'canPurchase', 'canSaveItems', 'canPublishListing']) {
    const denied = await runGuard(requireCapability(cap), unverifiedReq);
    assert.ok(denied, `An unverified account must be denied '${cap}'`);
    assert.strictEqual(denied.statusCode, 403);
  }

  /* ── 4. No principal means 401, never a silent pass ───────────────────── */

  const anonDenied = await runGuard(requireCapability('canPurchase'), {
    principal: null, accountState: stateFor('anon'), originalUrl: '/x'
  });
  assert.strictEqual(anonDenied.statusCode, 401);

  /* ── 5. Minimum-state guard ───────────────────────────────────────────── */

  assert.strictEqual(
    await runGuard(requireAccountState(ACCOUNT_STATES.ACCOUNT_READY), sellerReq), null,
    'SELLER_READY is further along the ladder than ACCOUNT_READY');

  const notFarEnough = await runGuard(requireAccountState(ACCOUNT_STATES.SELLER_READY), buyerReq);
  assert.strictEqual(notFarEnough.statusCode, 403);

  /* ── 6. Listing ownership resolves from the database, not the request ─── */

  const sellerA = await harness.createUser({ stage: 'seller_ready', suffix: 'pa' });
  const storeA = await harness.createStore(sellerA);
  const listingA = await harness.createListing(sellerA, storeA);

  const sellerB = await harness.createUser({ stage: 'seller_ready', suffix: 'pb' });
  await harness.createStore(sellerB);

  const guard = requireListingOwnership({ permission: 'listing.edit' });

  const ownerReq = {
    principal: { id: sellerA.id, primaryRole: 'seller' },
    params: { id: listingA.id },
    originalUrl: `/api/v1/listings/${listingA.id}`
  };
  assert.strictEqual(await runGuard(guard, ownerReq), null, 'The owner must pass');
  assert.strictEqual(ownerReq.listingRow.id, listingA.id,
    'The guard must attach the row it actually loaded from the database');

  // Seller B, even while claiming seller A's identity in the request body.
  const intruderReq = {
    principal: { id: sellerB.id, primaryRole: 'seller' },
    params: { id: listingA.id },
    body: { sellerId: sellerA.id, ownerId: sellerA.id, userId: sellerA.id },
    originalUrl: `/api/v1/listings/${listingA.id}`
  };
  const intruderDenied = await runGuard(guard, intruderReq);
  assert.ok(intruderDenied, 'A non-owner must be refused');
  assert.strictEqual(intruderDenied.statusCode, 404,
    'Refusal is a 404 so listing ids cannot be probed by comparing status codes');
  assert.strictEqual(intruderReq.listingRow, undefined,
    'A refused request must not receive the resource');

  // A listing that does not exist is likewise a 404 — never fabricated.
  const ghostDenied = await runGuard(guard, {
    principal: { id: sellerA.id, primaryRole: 'seller' },
    params: { id: 'lst_does_not_exist' },
    originalUrl: '/api/v1/listings/lst_does_not_exist'
  });
  assert.strictEqual(ghostDenied.statusCode, 404);

  console.log('  ✓ Buyer/seller separation and database-backed ownership enforced');
}

module.exports = { run };

if (require.main === module) {
  run()
    .then(() => harness.cleanup())
    .then(() => process.exit(0))
    .catch(async e => { console.error(e); await harness.cleanup().catch(() => null); process.exit(1); });
}
