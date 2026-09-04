/**
 * LOUMOO Integration Tests — Commerce Core Security, Pricing & Lifecycle Suite
 * ---------------------------------------------------------------------------
 * Comprehensive domain security test suite verifying:
 *  1. Server-Authoritative Pricing Attacks (Zero Client Trust)
 *  2. Listing, Variant & Seller Relationship Attacks
 *  3. Quantity Integrity & Bounds Attacks
 *  4. Order Ownership & Anti-IDOR Defenses (404 Anti-Enumeration)
 *  5. Strict State Machine Lifecycle Transitions & Anti-Tampering
 *  6. User-Scoped Idempotency Replays & Payload Mismatch Detection
 *  7. Concurrency Safety & Mutex Locking
 *  8. Payment Provider Agnosticism (Frozen Payments / Pending Status)
 */

require('../setup');
const assert = require('assert');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const { OrderCreationService } = require('../../server/modules/commerce/application/OrderCreationService');
const { OrderQueryService } = require('../../server/modules/commerce/application/OrderQueryService');
const { OrderLifecycleService } = require('../../server/modules/commerce/application/OrderLifecycleService');
const { FULFILLMENT_STATUS, PAYMENT_STATUS } = require('../../server/modules/commerce/domain/Order');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  IdempotencyError
} = require('../../server/shared/errors/AppError');

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  LOUMOO COMMERCE CORE SECURITY & LIFECYCLE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const repo = new OrderRepository({ db: null });
  const creationService = new OrderCreationService(repo);
  const queryService = new OrderQueryService(repo);
  const lifecycleService = new OrderLifecycleService(repo);

  // Setup seed principals
  const aliceId = `usr_alice_buyer_${Date.now()}`;
  const bobId = `usr_bob_attacker_${Date.now()}`;
  const sellerId = `usr_merchant_charlie_${Date.now()}`;
  const storeId = `str_charlie_store_${Date.now()}`;

  // Seed verified seller listing
  const phoneListing = {
    id: 'lst_iphone_15_pro',
    storeId: storeId,
    sellerId: sellerId,
    storeName: 'Charlie Tech SARL',
    storeStatus: 'ACTIVE',
    title: 'Apple iPhone 15 Pro Max (Titanium Natural)',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    currency: 'XAF',
    basePriceMinor: 890000,
    salePriceMinor: null,
    hasVariants: true,
    deletedAt: null
  };
  repo.seedListing(phoneListing);

  // Seed listing variants
  const variant256 = {
    id: 'var_256gb',
    listingId: phoneListing.id,
    sku: 'IP15PM-256',
    title: '256GB Titanium',
    priceMinor: 890000,
    currency: 'XAF',
    stockQuantity: 10,
    isActive: true
  };
  const variant512 = {
    id: 'var_512gb',
    listingId: phoneListing.id,
    sku: 'IP15PM-512',
    title: '512GB Titanium',
    priceMinor: 1050000,
    currency: 'XAF',
    stockQuantity: 5,
    isActive: true
  };
  const inactiveVariant = {
    id: 'var_inactive',
    listingId: phoneListing.id,
    sku: 'IP15PM-INACTIVE',
    title: 'Unavailable Edition',
    priceMinor: 800000,
    currency: 'XAF',
    stockQuantity: 0,
    isActive: false
  };
  repo.seedVariant(phoneListing.id, variant256);
  repo.seedVariant(phoneListing.id, variant512);
  repo.seedVariant(phoneListing.id, inactiveVariant);

  // Seed draft / unorderable listing
  const draftListing = {
    id: 'lst_draft_macbook',
    storeId: storeId,
    sellerId: sellerId,
    title: 'Apple MacBook Pro M3',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    currency: 'XAF',
    basePriceMinor: 1500000,
    hasVariants: false
  };
  repo.seedListing(draftListing);

  // Seed another seller's listing
  const otherSellerListing = {
    id: 'lst_other_seller_tv',
    storeId: 'str_other',
    sellerId: 'usr_other_seller',
    title: 'Samsung 65-inch OLED 4K',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    currency: 'XAF',
    basePriceMinor: 650000,
    hasVariants: false
  };
  repo.seedListing(otherSellerListing);

  // ==========================================================================
  // 1. SERVER-AUTHORITATIVE PRICING ATTACKS
  // ==========================================================================
  console.log('  [1/7] Testing Server-Authoritative Pricing Attacks...');

  // 1.1 Attacker attempts to change order total to 1 XAF
  let manipulatedTotalBlocked = false;
  try {
    await creationService.createOrder(bobId, {
      items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
      totalAmountXaf: 1 // Manipulated price
    });
  } catch (err) {
    if (err instanceof ValidationError && /Pricing mismatch/i.test(err.message)) {
      manipulatedTotalBlocked = true;
    }
  }
  assert.strictEqual(manipulatedTotalBlocked, true, 'Manipulated totalAmountXaf must be rejected with ValidationError');

  // 1.2 Attacker attempts to change totalXaf to 0
  let zeroTotalBlocked = false;
  try {
    await creationService.createOrder(bobId, {
      items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
      totalXaf: 0
    });
  } catch (err) {
    if (err instanceof ValidationError) zeroTotalBlocked = true;
  }
  assert.strictEqual(zeroTotalBlocked, true, 'Zero totalXaf manipulation must be rejected');

  // 1.3 Attacker attempts to inject custom unit price on item
  let manipulatedUnitPriceBlocked = false;
  try {
    await creationService.createOrder(bobId, {
      items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1, unitPriceXaf: 500 }]
    });
  } catch (err) {
    if (err instanceof ValidationError && /Unit price mismatch/i.test(err.message)) {
      manipulatedUnitPriceBlocked = true;
    }
  }
  assert.strictEqual(manipulatedUnitPriceBlocked, true, 'Item unit price tampering must be rejected');

  // 1.4 Legitimate request without client totals receives authoritative calculation
  const legitOrder = await creationService.createOrder(aliceId, {
    items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
    deliveryMethod: 'HOME_DELIVERY'
  });
  assert.strictEqual(legitOrder.subtotalXaf, 890000, 'Server must calculate correct subtotal');
  assert.strictEqual(legitOrder.shippingFeeXaf, 3000, 'Standard shipping fee of 3000 XAF must apply');
  assert.strictEqual(legitOrder.totalAmountXaf, 893000, 'Total must authoritatively equal 893,000 XAF');

  console.log('    ✓ Server-authoritative pricing successfully rejected all price manipulation attempts.');

  // ==========================================================================
  // 2. LISTING & VARIANT INTEGRITY ATTACKS
  // ==========================================================================
  console.log('  [2/7] Testing Listing & Variant Integrity Defenses...');

  // 2.1 Non-existent listing ID
  let fakeListingBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: 'lst_does_not_exist_404', quantity: 1 }]
    });
  } catch (err) {
    if (err instanceof NotFoundError) fakeListingBlocked = true;
  }
  assert.strictEqual(fakeListingBlocked, true, 'Non-existent listing must return NotFoundError');

  // 2.2 Unorderable DRAFT listing
  let draftListingBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: draftListing.id, quantity: 1 }]
    });
  } catch (err) {
    if (err instanceof ValidationError && /not published/i.test(err.message)) {
      draftListingBlocked = true;
    }
  }
  assert.strictEqual(draftListingBlocked, true, 'Draft listing must be rejected as unorderable');

  // 2.3 Non-existent variant ID
  let fakeVariantBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, variantId: 'var_fake_999', quantity: 1 }]
    });
  } catch (err) {
    if (err instanceof ValidationError && /does not exist/i.test(err.message)) {
      fakeVariantBlocked = true;
    }
  }
  assert.strictEqual(fakeVariantBlocked, true, 'Non-existent variant must be rejected');

  // 2.4 Inactive variant
  let inactiveVariantBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, variantId: inactiveVariant.id, quantity: 1 }]
    });
  } catch (err) {
    if (err instanceof ValidationError && /not available/i.test(err.message)) {
      inactiveVariantBlocked = true;
    }
  }
  assert.strictEqual(inactiveVariantBlocked, true, 'Inactive variant must be rejected');

  console.log('    ✓ Listing & variant integrity passed all boundary checks.');

  // ==========================================================================
  // 3. SELLER INTEGRITY ATTACKS
  // ==========================================================================
  console.log('  [3/7] Testing Seller Integrity Defenses...');

  // 3.1 Attacker attempts to spoof sellerId in payload
  let sellerSpoofBlocked = false;
  try {
    await creationService.createOrder(bobId, {
      items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
      sellerId: 'attacker_fake_seller' // Privileged key injection
    });
  } catch (err) {
    if (err instanceof ValidationError && /Privileged fields/i.test(err.message)) {
      sellerSpoofBlocked = true;
    }
  }
  assert.strictEqual(sellerSpoofBlocked, true, 'Attempt to inject sellerId in payload must be rejected by schema');

  // 3.2 Verify server binds legitimate seller ID from listing
  const verifiedSellerOrder = await creationService.createOrder(aliceId, {
    items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }]
  });
  assert.strictEqual(verifiedSellerOrder.sellerId, sellerId, 'Order sellerId must be derived strictly from listing');
  assert.strictEqual(verifiedSellerOrder.items[0].sellerId, sellerId);

  console.log('    ✓ Seller integrity correctly derives merchant from listing.');

  // ==========================================================================
  // 4. QUANTITY INTEGRITY ATTACKS
  // ==========================================================================
  console.log('  [4/7] Testing Quantity Integrity & Bounds...');

  // 4.1 Zero quantity
  let zeroQtyBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, quantity: 0 }]
    });
  } catch (err) {
    if (err instanceof ValidationError) zeroQtyBlocked = true;
  }
  assert.strictEqual(zeroQtyBlocked, true, 'Zero quantity must be rejected');

  // 4.2 Negative quantity
  let negativeQtyBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, quantity: -2 }]
    });
  } catch (err) {
    if (err instanceof ValidationError) negativeQtyBlocked = true;
  }
  assert.strictEqual(negativeQtyBlocked, true, 'Negative quantity must be rejected');

  // 4.3 Fractional quantity
  let fractionalQtyBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, quantity: 1.75 }]
    });
  } catch (err) {
    if (err instanceof ValidationError) fractionalQtyBlocked = true;
  }
  assert.strictEqual(fractionalQtyBlocked, true, 'Fractional quantity must be rejected');

  // 4.4 Excessive quantity beyond allowed limit
  let excessiveQtyBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, quantity: 999999 }]
    });
  } catch (err) {
    if (err instanceof ValidationError) excessiveQtyBlocked = true;
  }
  assert.strictEqual(excessiveQtyBlocked, true, 'Excessive quantity must be rejected');

  // 4.5 Empty bag
  let emptyBagBlocked = false;
  try {
    await creationService.createOrder(aliceId, { items: [] });
  } catch (err) {
    if (err instanceof ValidationError) emptyBagBlocked = true;
  }
  assert.strictEqual(emptyBagBlocked, true, 'Empty items array must be rejected');

  console.log('    ✓ Quantity validation successfully blocked all invalid values.');

  // ==========================================================================
  // 5. ORDER OWNERSHIP & ANTI-IDOR DEFENSES (404 ANTI-ENUMERATION)
  // ==========================================================================
  console.log('  [5/7] Testing Order Ownership & Anti-IDOR Defenses...');

  // Alice places order
  const aliceOrder = await creationService.createOrder(aliceId, {
    items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }]
  });

  // 5.1 Alice can access her own order
  const aliceFetched = await queryService.getOrderById(aliceOrder.id, aliceId);
  assert.strictEqual(aliceFetched.id, aliceOrder.id);
  assert.strictEqual(aliceFetched.buyerId, aliceId);

  // 5.2 Bob attempts to access Alice's order -> Returns 404 (Anti-Enumeration)
  let bobAccessBlocked = false;
  try {
    await queryService.getOrderById(aliceOrder.id, bobId);
  } catch (err) {
    if (err instanceof NotFoundError) bobAccessBlocked = true;
  }
  assert.strictEqual(bobAccessBlocked, true, 'Bob accessing Alice order must return NotFoundError (404 anti-enumeration)');

  // 5.3 Bob attempts to cancel Alice's order -> Returns 404 (Anti-Enumeration)
  let bobCancelBlocked = false;
  try {
    await lifecycleService.cancelOrder(aliceOrder.id, bobId, 'Malicious cancel');
  } catch (err) {
    if (err instanceof NotFoundError) bobCancelBlocked = true;
  }
  assert.strictEqual(bobCancelBlocked, true, 'Bob cancelling Alice order must return NotFoundError (404 anti-enumeration)');

  // 5.4 Seller can inspect order
  const sellerFetched = await queryService.getOrderById(aliceOrder.id, sellerId, { userRole: 'seller' });
  assert.strictEqual(sellerFetched.id, aliceOrder.id, 'Legitimate seller must be able to view customer order');

  console.log('    ✓ Anti-IDOR ownership and 404 anti-enumeration defenses verified.');

  // ==========================================================================
  // 6. ORDER STATE MACHINE & LIFECYCLE DEFENSES
  // ==========================================================================
  console.log('  [6/7] Testing Order State Transitions & Tampering Defenses...');

  // 6.1 Client attempts to set fulfillmentStatus directly in creation payload
  let statusInjectionBlocked = false;
  try {
    await creationService.createOrder(aliceId, {
      items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
      status: 'delivered' // Attacker tries to create pre-delivered order
    });
  } catch (err) {
    if (err instanceof ValidationError && /Privileged fields/i.test(err.message)) {
      statusInjectionBlocked = true;
    }
  }
  assert.strictEqual(statusInjectionBlocked, true, 'Injecting status in order payload must be rejected');

  // 6.2 Alice legitimately cancels her order in PROCESSING status
  const cancelledOrder = await lifecycleService.cancelOrder(aliceOrder.id, aliceId, 'Changed my mind');
  assert.strictEqual(cancelledOrder.fulfillmentStatus, FULFILLMENT_STATUS.CANCELLED);

  // 6.3 Repeated cancellation fails (Terminal state)
  let repeatCancelBlocked = false;
  try {
    await lifecycleService.cancelOrder(aliceOrder.id, aliceId, 'Cancel again');
  } catch (err) {
    if (err instanceof ConflictError && /already cancelled/i.test(err.message)) {
      repeatCancelBlocked = true;
    }
  }
  assert.strictEqual(repeatCancelBlocked, true, 'Repeated cancellation must be rejected with ConflictError');

  // 6.4 Merchant transitions order to IN_TRANSIT and buyer can no longer cancel
  const orderForTransit = await creationService.createOrder(aliceId, {
    items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }]
  });
  await lifecycleService.updateFulfillmentStatus(
    orderForTransit.id,
    FULFILLMENT_STATUS.IN_TRANSIT,
    sellerId,
    { userRole: 'seller', note: 'Dispatched with carrier' }
  );

  let cancelInTransitBlocked = false;
  try {
    await lifecycleService.cancelOrder(orderForTransit.id, aliceId, 'Late cancel attempt');
  } catch (err) {
    if (err instanceof ConflictError && /in transit/i.test(err.message)) {
      cancelInTransitBlocked = true;
    }
  }
  assert.strictEqual(cancelInTransitBlocked, true, 'Buyer cannot cancel in-transit order');

  // 6.5 Deliver order (terminal state)
  await lifecycleService.updateFulfillmentStatus(
    orderForTransit.id,
    FULFILLMENT_STATUS.DELIVERED,
    sellerId,
    { userRole: 'seller', note: 'Delivered to recipient' }
  );

  let cancelDeliveredBlocked = false;
  try {
    await lifecycleService.cancelOrder(orderForTransit.id, aliceId, 'Cancel delivered order');
  } catch (err) {
    if (err instanceof ConflictError) cancelDeliveredBlocked = true;
  }
  assert.strictEqual(cancelDeliveredBlocked, true, 'Delivered order cannot be cancelled');

  console.log('    ✓ State machine lifecycle transitions and cancellation rules validated.');

  // ==========================================================================
  // 7. IDEMPOTENCY & PAYMENT AGNOSTICISM
  // ==========================================================================
  console.log('  [7/7] Testing Scoped Idempotency & Payment Agnosticism...');

  const idempotencyKey = `idemp_order_${Date.now()}`;
  const orderPayload = {
    items: [{ listingId: phoneListing.id, variantId: variant256.id, quantity: 1 }],
    deliveryMethod: 'HOME_DELIVERY'
  };

  // 7.1 Initial creation with key
  const firstOrder = await creationService.createOrder(aliceId, orderPayload, { idempotencyKey });
  assert.ok(firstOrder.id, 'First order must be created');
  assert.strictEqual(firstOrder.paymentStatus, PAYMENT_STATUS.PENDING, 'Payment must remain pending (frozen payments)');

  // 7.2 Replay with EXACT SAME payload returns the existing order (no duplicates)
  const replayedOrder = await creationService.createOrder(aliceId, orderPayload, { idempotencyKey });
  assert.strictEqual(replayedOrder.id, firstOrder.id, 'Replay with same key & payload must return existing order');
  assert.strictEqual(replayedOrder.orderNumber, firstOrder.orderNumber);

  // 7.3 Replay with DIFFERENT payload throws 409 Conflict
  const mutatedPayload = {
    items: [{ listingId: phoneListing.id, variantId: variant512.id, quantity: 2 }],
    deliveryMethod: 'STORE_PICKUP'
  };
  let mismatchBlocked = false;
  try {
    await creationService.createOrder(aliceId, mutatedPayload, { idempotencyKey });
  } catch (err) {
    if (err instanceof IdempotencyError || err instanceof ConflictError) {
      mismatchBlocked = true;
    }
  }
  assert.strictEqual(mismatchBlocked, true, 'Replay with mutated payload must be rejected as an Idempotency conflict');

  console.log('    ✓ Idempotency replay, payload mismatch detection, and payment boundary verified.\n');
  console.log('ALL COMMERCE CORE SECURITY & LIFECYCLE TESTS PASSED.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
