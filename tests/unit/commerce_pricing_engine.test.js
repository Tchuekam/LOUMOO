/**
 * LOUMOO Commerce Core Unit Tests — Pricing Engine, Domain Model & State Machine
 * ---------------------------------------------------------------------------
 * Validates server-authoritative calculations, integer precision in XAF,
 * client manipulation rejection, and strict finite state machine transitions.
 */

const assert = require('assert');
const { PricingEngine, DEFAULT_STANDARD_SHIPPING_XAF } = require('../../server/modules/commerce/domain/PricingEngine');
const { OrderStateMachine, ALLOWED_FULFILLMENT_TRANSITIONS } = require('../../server/modules/commerce/domain/OrderStateMachine');
const { Order, OrderItem, FULFILLMENT_STATUS, PAYMENT_STATUS, DELIVERY_METHOD } = require('../../server/modules/commerce/domain/Order');
const { ValidationError, ConflictError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  COMMERCE CORE UNIT TESTS: PRICING & STATE MACHINE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ==========================================================================
  // 1. SERVER-AUTHORITATIVE PRICING ENGINE
  // ==========================================================================
  console.log('  [1/3] Testing Authoritative Pricing Calculations in XAF...');

  // 1.1 Correct subtotal & total calculation with standard shipping
  const items = [
    { listingId: 'lst_1', quantity: 2, unitPriceXaf: 50000 },
    { listingId: 'lst_2', quantity: 1, unitPriceXaf: 25000 }
  ];
  const pricing = PricingEngine.calculateOrderPricing(items, {
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY
  });

  assert.strictEqual(pricing.subtotalXaf, 125000, 'Subtotal must be 125,000 XAF');
  assert.strictEqual(pricing.shippingFeeXaf, DEFAULT_STANDARD_SHIPPING_XAF, 'Standard shipping must apply');
  assert.strictEqual(pricing.totalAmountXaf, 128000, 'Total must be 128,000 XAF');
  assert.strictEqual(pricing.lineItems[0].lineTotalXaf, 100000);
  assert.strictEqual(pricing.lineItems[1].lineTotalXaf, 25000);

  // 1.2 Store Pickup has 0 shipping fee
  const pickupPricing = PricingEngine.calculateOrderPricing(items, {
    deliveryMethod: DELIVERY_METHOD.STORE_PICKUP
  });
  assert.strictEqual(pickupPricing.shippingFeeXaf, 0, 'Store pickup must have 0 shipping fee');
  assert.strictEqual(pickupPricing.totalAmountXaf, 125000, 'Total must equal subtotal for store pickup');

  // 1.3 Free delivery over threshold
  const freeShipItems = [
    {
      listingId: 'lst_expensive',
      quantity: 1,
      unitPriceXaf: 200000,
      listing: { metadata: { fulfillment: { freeDeliveryOverMinor: 150000, deliveryFeeMinor: 4000 } } }
    }
  ];
  const freeShipPricing = PricingEngine.calculateOrderPricing(freeShipItems, {
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY
  });
  assert.strictEqual(freeShipPricing.shippingFeeXaf, 0, 'Shipping fee must be 0 when exceeding free delivery threshold');

  // 1.4 Custom delivery fee from listing fulfillment
  const customShipItems = [
    {
      listingId: 'lst_custom',
      quantity: 1,
      unitPriceXaf: 50000,
      listing: { metadata: { fulfillment: { deliveryFeeMinor: 4500, freeDeliveryOverMinor: 100000 } } }
    }
  ];
  const customShipPricing = PricingEngine.calculateOrderPricing(customShipItems, {
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY
  });
  assert.strictEqual(customShipPricing.shippingFeeXaf, 4500, 'Custom delivery fee must be applied');
  assert.strictEqual(customShipPricing.totalAmountXaf, 54500);

  // 1.5 Rejection of manipulated client total
  let manipulatedTotalCaught = false;
  try {
    PricingEngine.calculateOrderPricing(items, {
      deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
      clientSuppliedTotal: 1 // Attacker sent 1 XAF instead of 128000
    });
  } catch (err) {
    if (err instanceof ValidationError && /Pricing mismatch/i.test(err.message)) {
      manipulatedTotalCaught = true;
    }
  }
  assert.strictEqual(manipulatedTotalCaught, true, 'Manipulated client total must be rejected');

  // 1.6 Acceptance of legitimate matching client total
  const legitMatchingPricing = PricingEngine.calculateOrderPricing(items, {
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY,
    clientSuppliedTotal: 128000
  });
  assert.strictEqual(legitMatchingPricing.totalAmountXaf, 128000, 'Matching client total must succeed');

  // 1.7 Rejection of client unit price discrepancy
  let priceDiscrepancyCaught = false;
  try {
    PricingEngine.assertItemPriceMatch({ unitPriceXaf: 1000 }, 50000, 'iPhone 15');
  } catch (err) {
    if (err instanceof ValidationError && /Unit price mismatch/i.test(err.message)) {
      priceDiscrepancyCaught = true;
    }
  }
  assert.strictEqual(priceDiscrepancyCaught, true, 'Unit price tampering must be rejected');

  // 1.8 Quantity and arithmetic boundaries
  assert.throws(() => {
    PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 0, unitPriceXaf: 1000 }]);
  }, /must be a positive integer/, 'Zero quantity must throw');

  assert.throws(() => {
    PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: -1, unitPriceXaf: 1000 }]);
  }, /must be a positive integer/, 'Negative quantity must throw');

  assert.throws(() => {
    PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 1.5, unitPriceXaf: 1000 }]);
  }, /must be a positive integer/, 'Fractional quantity must throw');

  assert.throws(() => {
    PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 1, unitPriceXaf: -500 }]);
  }, /must be a non-negative integer/, 'Negative price must throw');

  // 1.9 Safe-integer guards: past Number.MAX_SAFE_INTEGER integer arithmetic silently
  // rounds, so the engine must refuse the order rather than price it wrongly.
  const MAX_SAFE = Number.MAX_SAFE_INTEGER;
  const pickup = { deliveryMethod: DELIVERY_METHOD.STORE_PICKUP };
  const throwsValidation = (re) => (err) => err instanceof ValidationError && re.test(err.message);

  // 1.9a A single line whose qty*price exceeds the safe range (3 * MAX_SAFE rounds).
  assert.throws(
    () => PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 3, unitPriceXaf: MAX_SAFE }], pickup),
    throwsValidation(/line total/i),
    'A line total beyond MAX_SAFE_INTEGER must throw ValidationError'
  );

  // 1.9b The first unsafe product is 2^53, which a double CAN represent exactly -
  // the guard must still reject it because 2^53 + 1 would round to it.
  assert.throws(
    () => PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 2, unitPriceXaf: Math.floor(MAX_SAFE / 2) + 1 }], pickup),
    throwsValidation(/line total/i),
    'A line total of exactly MAX_SAFE_INTEGER + 1 must throw'
  );

  // 1.9c Several lines that are each safe but whose running subtotal is not.
  const halfSafe = Math.floor(MAX_SAFE / 2);
  const overflowingLines = [1, 2, 3].map((n) => ({ listingId: `lst_${n}`, quantity: 1, unitPriceXaf: halfSafe }));
  overflowingLines.forEach((line) => assert.ok(Number.isSafeInteger(line.quantity * line.unitPriceXaf), 'each line is safe on its own'));
  assert.throws(
    () => PricingEngine.calculateOrderPricing(overflowingLines, pickup),
    (err) => throwsValidation(/subtotal/i)(err) && !/line total/i.test(err.message),
    'A subtotal beyond MAX_SAFE_INTEGER across safe lines must throw ValidationError from the subtotal guard'
  );

  // 1.9d The guards must not over-reject: exactly MAX_SAFE_INTEGER is still exact.
  const atLimit = PricingEngine.calculateOrderPricing([{ listingId: 'x', quantity: 1, unitPriceXaf: MAX_SAFE }], pickup);
  assert.strictEqual(atLimit.subtotalXaf, MAX_SAFE, 'A subtotal of exactly MAX_SAFE_INTEGER must be accepted');

  // 1.9e A large but ordinary order (1,000 units - the per-line cap - at 5,000,000 XAF) is unchanged.
  const bulk = PricingEngine.calculateOrderPricing(
    [{ listingId: 'x', quantity: 1000, unitPriceXaf: 5000000 }, { listingId: 'y', quantity: 2, unitPriceXaf: 750 }],
    pickup
  );
  assert.strictEqual(bulk.lineItems[0].lineTotalXaf, 5000000000);
  assert.strictEqual(bulk.subtotalXaf, 5000001500);
  assert.strictEqual(bulk.totalAmountXaf, 5000001500);

  console.log('    ✓ Authoritative pricing engine passed all arithmetic and defense checks.');

  // ==========================================================================
  // 2. ORDER STATE MACHINE & LIFECYCLE
  // ==========================================================================
  console.log('  [2/3] Testing Order State Machine Lifecycle & Transitions...');

  // 2.1 Valid forward transitions
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.PROCESSING, FULFILLMENT_STATUS.IN_TRANSIT), true);
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.PROCESSING, FULFILLMENT_STATUS.CANCELLED), true);
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.IN_TRANSIT, FULFILLMENT_STATUS.DELIVERED), true);

  // 2.2 Terminal states cannot transition
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.DELIVERED, FULFILLMENT_STATUS.PROCESSING), false);
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.DELIVERED, FULFILLMENT_STATUS.CANCELLED), false);
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.CANCELLED, FULFILLMENT_STATUS.PROCESSING), false);
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.CANCELLED, FULFILLMENT_STATUS.IN_TRANSIT), false);

  // 2.3 Direct skip transitions prohibited
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.PROCESSING, FULFILLMENT_STATUS.DELIVERED), false);

  // 2.4 Duplicate / redundant transition prohibited
  assert.strictEqual(OrderStateMachine.canTransition(FULFILLMENT_STATUS.PROCESSING, FULFILLMENT_STATUS.PROCESSING), false);

  // 2.5 Assertions throw ConflictError on illegal state jump
  assert.throws(() => {
    OrderStateMachine.assertTransition(FULFILLMENT_STATUS.DELIVERED, FULFILLMENT_STATUS.CANCELLED, 'KM-TEST-1');
  }, ConflictError, 'Transitioning from DELIVERED must throw ConflictError');

  assert.throws(() => {
    OrderStateMachine.assertTransition(FULFILLMENT_STATUS.CANCELLED, FULFILLMENT_STATUS.DELIVERED, 'KM-TEST-1');
  }, ConflictError, 'Transitioning from CANCELLED must throw ConflictError');

  // 2.6 Buyer cancellation permission assertions
  assert.doesNotThrow(() => {
    OrderStateMachine.assertBuyerCanCancel(FULFILLMENT_STATUS.PROCESSING, 'KM-TEST-1');
  }, 'Buyer can cancel in PROCESSING status');

  assert.throws(() => {
    OrderStateMachine.assertBuyerCanCancel(FULFILLMENT_STATUS.IN_TRANSIT, 'KM-TEST-1');
  }, ConflictError, 'Buyer cannot cancel an in-transit order');

  assert.throws(() => {
    OrderStateMachine.assertBuyerCanCancel(FULFILLMENT_STATUS.DELIVERED, 'KM-TEST-1');
  }, ConflictError, 'Buyer cannot cancel a delivered order');

  console.log('    ✓ Order state machine passed all lifecycle assertions.');

  // ==========================================================================
  // 3. ORDER DOMAIN AGGREGATES & ENTITIES
  // ==========================================================================
  console.log('  [3/3] Testing Order & OrderItem Entities...');

  const item1 = new OrderItem({
    listingId: 'lst_phone_1',
    variantId: 'var_256gb',
    title: 'Flagship Smartphone (Titanium)',
    sku: 'PHONE-TI-256',
    unitPriceXaf: 800000,
    quantity: 2,
    sellerId: 'usr_seller_123',
    storeId: 'str_official_store',
    storeName: 'Official Tech Hub'
  });

  assert.strictEqual(item1.totalLineXaf, 1600000);
  assert.strictEqual(item1.sellerId, 'usr_seller_123');

  const order = new Order({
    buyerId: 'usr_buyer_alice',
    sellerId: 'usr_seller_123',
    items: [item1],
    subtotalXaf: 1600000,
    shippingFeeXaf: 3000,
    totalAmountXaf: 1603000,
    deliveryMethod: DELIVERY_METHOD.HOME_DELIVERY
  });

  assert.ok(order.orderNumber.startsWith('KM-'), 'Order number must start with KM- prefix');
  assert.strictEqual(order.totalAmountXaf, 1603000);
  assert.strictEqual(order.paymentStatus, PAYMENT_STATUS.PENDING, 'Payment status must be pending (payment deferred)');
  assert.strictEqual(order.fulfillmentStatus, FULFILLMENT_STATUS.PROCESSING);

  const json = order.toJSON();
  assert.strictEqual(json.buyerId, 'usr_buyer_alice');
  assert.strictEqual(json.sellerId, 'usr_seller_123');
  assert.strictEqual(json.items[0].totalLineXaf, 1600000);

  console.log('    ✓ Order and OrderItem entities validated successfully.\n');
  console.log('ALL COMMERCE CORE UNIT TESTS PASSED.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
