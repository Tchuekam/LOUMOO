/**
 * LOUMOO Unit Test Suite: Seller WhatsApp Redirection & Store Contact Integration
 * ---------------------------------------------------------------------------------
 * Validates:
 * 1. CatalogRepository exposes store phone numbers (phoneNumber, whatsapp, storePhone, sellerPhone).
 * 2. OrderItem & Order domain aggregates maintain storePhone, sellerPhone, and sellerWhatsapp.
 * 3. OrderRepository findListingById, saveOrder, and _mapRowToOrder roundtrip seller contact phone numbers.
 * 4. Component.contactSellerWhatsApp properly normalizes Cameroon and international numbers (wa.me/237...).
 * 5. Component.contactSellerWhatsApp constructs order-specific message with orderNumber, item, and price.
 * 6. Component.placeOrder snapshots storePhone onto cart items and placed order aggregate.
 * 7. Component.renderVals().ordersList exposes sellerPhone and sellerWhatsapp for orders view.
 * 8. Component.saveStoreSettingsAll submits phoneNumber to api.updateStore.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { Order, OrderItem } = require('../../server/modules/commerce/domain/Order');
const { OrderRepository } = require('../../server/modules/commerce/infrastructure/OrderRepository');
const CatalogRepository = require('../../server/modules/catalog/infrastructure/CatalogRepository');

async function run() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TEST: SELLER WHATSAPP REDIRECTION & STORE CONTACT INTEGRATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // ── 1. CatalogRepository Store Phone Projection ──
  console.log('[1/6] Verifying CatalogRepository store phone projection on cards and details...');
  const mockListing = {
    id: 'prod_test_phone_1',
    store_id: 'store_tech_1',
    title: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship phone',
    category_id: 'tech',
    base_price_minor: 850000,
    currency: 'XAF',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    rating: 4.9,
    rating_count: 24,
    order_count: 12,
    created_at: new Date().toISOString()
  };

  const mockStore = {
    id: 'store_tech_1',
    name: 'TechHub Douala',
    slug: 'techhub-douala',
    logo_url: 'https://images.loumoo.com/techhub.webp',
    phone_number: '+237699112233',
    is_verified: true,
    verification_tier: 'VERIFIED_BUSINESS',
    rating: 4.8,
    rating_count: 50,
    metadata: { city: 'Douala', phone: '+237699112233' }
  };

  const card = CatalogRepository._formatProductCard(mockListing, 'https://images.loumoo.com/s24.webp', mockStore, []);
  assert.strictEqual(card.phoneNumber, '+237699112233', 'card.phoneNumber must match store phone');
  assert.strictEqual(card.storePhone, '+237699112233', 'card.storePhone must match store phone');
  assert.strictEqual(card.sellerPhone, '+237699112233', 'card.sellerPhone must match store phone');

  const curatedFirst = CatalogRepository._curatedCards()[0];
  if (curatedFirst) {
    const detail = CatalogRepository._curatedDetail(curatedFirst.id);
    assert.ok(detail.store, 'Curated detail must have store object');
    assert.ok(detail.store.phoneNumber !== undefined, 'Curated detail must have store.phoneNumber defined');
    assert.ok(detail.store.whatsapp !== undefined, 'Curated detail must have store.whatsapp defined');
  }
  console.log('  ✓ CatalogRepository cleanly exposes store phone on product cards and details');

  // ── 2. OrderItem and Order Domain Aggregates ──
  console.log('\n[2/6] Verifying OrderItem and Order domain aggregates store contact fields...');
  const orderItem = new OrderItem({
    listingId: 'lst_123',
    title: 'Sony WH-1000XM5',
    unitPriceXaf: 250000,
    quantity: 1,
    sellerId: 'usr_seller_1',
    storeId: 'store_tech_1',
    storeName: 'TechHub Douala',
    storePhone: '699112233'
  });

  assert.strictEqual(orderItem.storePhone, '699112233');
  assert.strictEqual(orderItem.sellerPhone, '699112233');
  const itemJson = orderItem.toJSON();
  assert.strictEqual(itemJson.storePhone, '699112233');
  assert.strictEqual(itemJson.sellerPhone, '699112233');

  const order = new Order({
    orderNumber: 'LM-TEST01',
    buyerId: 'usr_buyer_1',
    sellerId: 'usr_seller_1',
    sellerPhone: '699112233',
    items: [orderItem],
    subtotalXaf: 250000,
    totalAmountXaf: 253000
  });

  assert.strictEqual(order.sellerPhone, '699112233');
  assert.strictEqual(order.sellerWhatsapp, '699112233');
  const orderJson = order.toJSON();
  assert.strictEqual(orderJson.sellerPhone, '699112233');
  assert.strictEqual(orderJson.sellerWhatsapp, '699112233');
  console.log('  ✓ Order and OrderItem domain aggregates retain and serialize sellerPhone & sellerWhatsapp');

  // ── 3. OrderRepository Persistence & In-Memory Roundtrip ──
  console.log('\n[3/6] Verifying OrderRepository persistence and mapping of seller contact info...');
  const repo = new OrderRepository({ db: null }); // in-memory mode
  const savedOrder = await repo.saveOrder(order);
  const fetchedOrder = await repo.findOrderById(savedOrder.id);
  assert.ok(fetchedOrder, 'Saved order must be resolvable');
  assert.strictEqual(fetchedOrder.sellerPhone, '699112233', 'fetchedOrder.sellerPhone must persist');
  assert.strictEqual(fetchedOrder.sellerWhatsapp, '699112233', 'fetchedOrder.sellerWhatsapp must persist');
  assert.strictEqual(fetchedOrder.items[0].storePhone, '699112233', 'fetchedOrder line item storePhone must persist');

  // Test row mapping roundtrip simulation
  const simulatedDbRow = {
    id: 'ord_db_1',
    order_number: 'LM-DB001',
    buyer_id: 'usr_buyer_2',
    seller_id: 'usr_seller_2',
    total_amount_xaf: 100000,
    items: [
      {
        listingId: 'lst_456',
        title: 'Leather Shoes',
        unitPriceXaf: 100000,
        quantity: 1,
        sellerId: 'usr_seller_2',
        storePhone: '677889900'
      }
    ],
    shipping_address: {
      recipientName: 'Alice',
      _sellerPhone: '677889900',
      _subtotalXaf: 100000,
      _shippingFeeXaf: 3000
    },
    payment_status: 'pending',
    fulfillment_status: 'processing',
    created_at: new Date().toISOString()
  };

  const mappedOrder = repo._mapRowToOrder(simulatedDbRow);
  assert.strictEqual(mappedOrder.sellerPhone, '677889900', 'Mapped order must extract sellerPhone from metadata');
  assert.strictEqual(mappedOrder.sellerWhatsapp, '677889900', 'Mapped order must extract sellerWhatsapp');
  assert.strictEqual(mappedOrder.items[0].storePhone, '677889900', 'Mapped order item must extract storePhone');
  console.log('  ✓ OrderRepository roundtrips seller contact phone across memory and row mappings');

  // ── 4. Frontend Component Sandbox Initialization ──
  console.log('\n[4/6] Initializing Component in VM sandbox for frontend WhatsApp redirection...');
  const appPath = path.resolve(__dirname, '../../Commerce App.dc.html');
  const compiledHtml = fs.readFileSync(appPath, 'utf8');
  const match = compiledHtml.match(/<script\s+type=["']text\/x-dc["'][^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'Commerce App.dc.html must contain an x-dc script block');

  let lastOpenedUrl = null;
  let lastToastMsg = null;
  let lastUpdatedStorePayload = null;

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(fnOrObj, cb) {
      if (typeof fnOrObj === 'function') {
        this.state = Object.assign({}, this.state, fnOrObj(this.state));
      } else {
        this.state = Object.assign({}, this.state, fnOrObj);
      }
      if (typeof cb === 'function') cb();
    }
  }

    const mockApi = {
      updateStore: async (storeId, payload) => {
        lastUpdatedStorePayload = { storeId, payload };
        return { success: true };
      },
      updateStoreProfile: async () => ({ success: true }),
      updateStoreHours: async () => ({ success: true }),
      updateStoreLocation: async () => ({ success: true })
    };

    const sandbox = {
      console,
      DCLogic,
      Promise,
      setTimeout: (fn) => fn(),
      clearTimeout: () => {},
      setInterval: () => {},
      clearInterval: () => {},
      Date,
      Math,
      String,
      Number,
      Boolean,
      Array,
      Object,
      encodeURIComponent,
      decodeURIComponent,
      LoumooAPI: mockApi,
      window: {
        location: { href: '' },
        open: (url) => { lastOpenedUrl = url; return true; },
        navigator: { userAgent: 'NodeTest' },
        LoumooAPI: mockApi
      },
      localStorage: {
        _store: {},
        getItem(k) { return this._store[k] || null; },
        setItem(k, v) { this._store[k] = String(v); },
        removeItem(k) { delete this._store[k]; },
        clear() { this._store = {}; }
      },
      getApi: () => mockApi,
      getClerk: () => null,
      getPublishing: () => null,
      getGuard: () => null,
      friendlyError: (e) => (e && e.message) || String(e)
    };
    sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(match[1] + '\nvar comp = new Component();', sandbox);
  const comp = sandbox.comp;
  assert.ok(comp, 'Component instantiated successfully');

  comp.toast = (msg) => { lastToastMsg = msg; };

  // ── 5. WhatsApp Redirection & Number Normalization ──
  console.log('\n[5/6] Verifying contactSellerWhatsApp redirection, normalization & tailored messaging...');

  // 5a. Order-specific contact with 9-digit local Cameroon number (6XXXXXXXX -> 2376XXXXXXXX)
  lastOpenedUrl = null;
  comp.contactSellerWhatsApp({
    sellerName: 'Orca Electronics',
    phone: '690 12 34 56',
    orderNumber: 'LM-ABC123',
    productTitle: 'MacBook Pro M3',
    price: 'XAF 1 500 000'
  });

  assert.ok(lastOpenedUrl, 'WhatsApp URL must be opened');
  assert.ok(lastOpenedUrl.startsWith('https://wa.me/237690123456?text='), `Normalized wa.me URL expected, received: ${lastOpenedUrl}`);
  const decodedOrderMsg = decodeURIComponent(lastOpenedUrl.split('?text=')[1]);
  assert.ok(decodedOrderMsg.includes('Hello Orca Electronics!'), 'Message must greet seller');
  assert.ok(decodedOrderMsg.includes('LM-ABC123'), 'Message must contain order number');
  assert.ok(decodedOrderMsg.includes('MacBook Pro M3'), 'Message must contain product title');
  assert.ok(decodedOrderMsg.includes('XAF 1 500 000'), 'Message must contain order price');
  assert.ok(decodedOrderMsg.includes('Could you please provide an update on delivery/fulfillment?'), 'Message must ask for delivery status');
  console.log('  ✓ Local 9-digit Cameroon number normalized to 237690123456 with order-tailored message');

  // 5b. General inquiry with already qualified international number (+237 677 88 99 00)
  lastOpenedUrl = null;
  comp.contactSellerWhatsApp({
    sellerName: 'Kamer Tech',
    phone: '+237 677 88 99 00',
    productTitle: 'AirPods Pro 2',
    price: 'XAF 175 000'
  });

  assert.ok(lastOpenedUrl.startsWith('https://wa.me/237677889900?text='), `International formatted number expected, received: ${lastOpenedUrl}`);
  const decodedInquiryMsg = decodeURIComponent(lastOpenedUrl.split('?text=')[1]);
  assert.ok(decodedInquiryMsg.includes('AirPods Pro 2'), 'Inquiry message must reference product');
  assert.ok(decodedInquiryMsg.includes('is it still available?'), 'Inquiry message must ask for availability');
  console.log('  ✓ International format normalized to 237677889900 with availability inquiry message');

  // ── 6. Cart, Order Placement & View Projections ──
  console.log('\n[6/6] Verifying placeOrder, ordersList projection, and store settings save...');

  // Setup cart with an item carrying storePhone
  comp.setState({
    cartItems: [
      {
        id: 'p_phone_101',
        name: 'Dell XPS 15',
        priceXaf: 950000,
        qty: 1,
        store: 'Elite Computers Douala',
        storePhone: '699334455',
        sellerPhone: '699334455'
      }
    ],
    selectedDeliveryAddress: {
      recipientName: 'Rostand Tchuekam',
      phoneNumber: '690 12 34 56',
      city: 'Douala',
      streetAddress: 'Rue Joss, Bonanjo'
    }
  });

  // Call placeOrder
  const initialOrdersCount = (comp.state.orders || []).length;
  comp.renderVals().placeOrder();
  assert.strictEqual(comp.state.orders.length, initialOrdersCount + 1, 'New order must be appended to orders list');
  const placed = comp.state.orders[0];
  assert.strictEqual(placed.sellerPhone, '699334455', 'Placed order must snapshot sellerPhone from cart item');
  assert.strictEqual(placed.sellerWhatsapp, '699334455', 'Placed order must snapshot sellerWhatsapp');
  assert.strictEqual(placed.items[0].storePhone, '699334455', 'Placed order item must retain storePhone');

  // Verify ordersList projection in renderVals()
  const vals = comp.renderVals();
  assert.ok(Array.isArray(vals.ordersList), 'ordersList must be projected');
  assert.ok(vals.ordersList.length > 0, 'ordersList must have elements');
  const firstCard = vals.ordersList[0];
  assert.strictEqual(firstCard.sellerPhone, '699334455', 'ordersList card must expose sellerPhone');
  assert.strictEqual(firstCard.sellerWhatsapp, '699334455', 'ordersList card must expose sellerWhatsapp');

  // Verify saveStoreSettingsAll submits phoneNumber
  lastUpdatedStorePayload = null;
  comp.setState({
    primaryStoreId: 'str_verified_123',
    storePhone: '+237 690 11 22 33'
  });
  comp.renderVals().saveStoreSettingsAll();
  assert.ok(lastUpdatedStorePayload, 'api.updateStore must be called');
  assert.strictEqual(lastUpdatedStorePayload.storeId, 'str_verified_123');
  assert.strictEqual(lastUpdatedStorePayload.payload.phoneNumber, '+237 690 11 22 33', 'phoneNumber must be submitted in store update');
  console.log('  ✓ placeOrder snapshots sellerPhone, ordersList exposes it, and saveStoreSettingsAll persists it');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ALL SELLER WHATSAPP REDIRECTION TESTS PASSED (6/6)!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

module.exports = { run };

if (require.main === module) {
  run().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
