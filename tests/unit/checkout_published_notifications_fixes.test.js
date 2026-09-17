/**
 * LOUMOO Test Suite — Verifying Bug Fixes:
 * 1. "What you have published" unified listings & announcements
 * 2. "1. DELIVERY DESTINATION" interactive change & address selection
 * 3. Realtime purchase notifications on product/phone order
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function run() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST: LOUMOO BUG FIXES VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════');

  // ── 1. API Client Order Endpoints ──
  console.log('\n[1/5] Verifying LoumooApiClient Order Endpoints...');
  const loumooApi = require('../../src/services/loumooApi');
  assert.strictEqual(typeof loumooApi.createOrder, 'function', 'createOrder must be a function on LoumooApiClient');
  assert.strictEqual(typeof loumooApi.getOrders, 'function', 'getOrders must be a function on LoumooApiClient');
  assert.strictEqual(typeof loumooApi.getOrder, 'function', 'getOrder must be a function on LoumooApiClient');
  assert.strictEqual(typeof loumooApi.cancelOrder, 'function', 'cancelOrder must be a function on LoumooApiClient');
  console.log('  ✓ LoumooApiClient exposes createOrder, getOrders, getOrder, and cancelOrder');

  // ── 2. Component Sandboxing Setup ──
  console.log('\n[2/5] Initializing Component sandbox from Commerce App.dc.html...');
  const appPath = path.resolve(__dirname, '../../Commerce App.dc.html');
  const html = fs.readFileSync(appPath, 'utf8');

  // Extract Component class script
  const scriptMatch = html.match(/<script\s+type=["']text\/x-dc["'][^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(scriptMatch, 'Component script block must exist in Commerce App.dc.html');
  const componentScript = scriptMatch[1];

  // Create Mock DC Sandbox
  const sandbox = {
    console,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    Math,
    Date,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    parseInt,
    parseFloat,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Error,
    Promise,
    document: {
      documentElement: { setAttribute: () => {} },
      body: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getElementById: () => ({ click: () => {}, scrollBy: () => {} }),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ type: '', accept: '', click: () => {}, files: [] })
    },
    window: {
      location: { href: 'http://localhost:3000' },
      open: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      Notification: {
        permission: 'default',
        requestPermission: () => Promise.resolve('granted')
      },
      LoumooAPI: loumooApi,
      LoumooPublishing: require('../../src/services/publishingEngine')
    },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    DCLogic: class {
      constructor() {
        this.state = {};
        this.props = {};
      }
      setState(updater, cb) {
        if (typeof updater === 'function') {
          this.state = Object.assign({}, this.state, updater(this.state));
        } else {
          this.state = Object.assign({}, this.state, updater);
        }
        if (cb) cb();
      }
    },
    getApi: () => loumooApi,
    getClerk: () => null,
    getPublishing: function() { return sandbox.window.LoumooPublishing; },
    getGuard: () => null,
    friendlyError: (e) => (e && e.message) || String(e)
  };

  vm.createContext(sandbox);
  vm.runInContext(componentScript + "\nvar comp = new Component();", sandbox);
  const comp = sandbox.comp;
  assert.ok(comp, 'Component instantiated successfully');
  console.log('  ✓ Component instantiated in sandbox');

  // ── 3. Test Delivery Destination Change & Address Selection ──
  console.log('\n[3/5] Verifying Delivery Destination customization in checkout...');
  // Initial state check with default profile
  comp.setState({
    regFirstName: 'Rostand',
    regLastName: 'Tchuekam',
    regPhone: '690 12 34 56',
    regCity: 'Douala',
    addressesList: [
      {
        id: 'addr_home',
        recipientName: 'Rostand Tchuekam',
        phoneNumber: '690 12 34 56',
        streetAddress: 'Rue Joss, Bonanjo Commercial District',
        city: 'Douala',
        region: 'Littoral',
        isDefault: true
      },
      {
        id: 'addr_office',
        recipientName: 'Rostand T. (Office)',
        phoneNumber: '670 99 88 77',
        streetAddress: 'Boulevard de la Liberté, Akwa',
        city: 'Douala',
        region: 'Littoral',
        isDefault: false
      }
    ],
    cartItems: [
      { id: 'phone_1', name: 'Samsung Galaxy S25 Ultra Titanium', priceXaf: 850000, qty: 1, store: 'Orca Electronics' }
    ]
  });

  let vals = comp.renderVals();
  assert.strictEqual(vals.checkoutRecipientName, 'Rostand Tchuekam');
  assert.strictEqual(vals.checkoutRecipientPhone, '690 12 34 56');
  assert.ok(vals.checkoutDeliveryAddress.includes('Rue Joss, Bonanjo'), 'Default address should display Rue Joss');
  assert.strictEqual(typeof vals.changeDeliveryDestination, 'function', 'changeDeliveryDestination must be a function');

  // Simulate clicking "CHANGE"
  vals.changeDeliveryDestination();
  assert.strictEqual(comp.state.checkoutReturn, true, 'checkoutReturn must be set to true');
  assert.strictEqual(comp.state.screen, 'addresses', 'Screen must navigate to addresses');

  vals = comp.renderVals();
  assert.strictEqual(typeof vals.selectCheckoutAddress, 'function', 'selectCheckoutAddress must be a function');

  // Select the second address (Office)
  const officeAddr = comp.state.addressesList[1];
  vals.selectCheckoutAddress(officeAddr);

  assert.strictEqual(comp.state.checkoutReturn, false, 'checkoutReturn must be cleared');
  assert.strictEqual(comp.state.screen, 'checkout', 'Screen must return to checkout');
  assert.strictEqual(comp.state.selectedDeliveryAddress.id, 'addr_office');

  vals = comp.renderVals();
  assert.strictEqual(vals.checkoutRecipientName, 'Rostand T. (Office)', 'Recipient name must update to office address');
  assert.strictEqual(vals.checkoutRecipientPhone, '670 99 88 77', 'Phone must update to office phone');
  assert.ok(vals.checkoutDeliveryAddress.includes('Boulevard de la Liberté, Akwa'), 'Address must update to office address');
  console.log('  ✓ Delivery destination changes dynamically and re-renders on checkout');

  // ── 4. Test Realtime Purchase Notification & Unified Catalogue ──
  console.log('\n[4/5] Verifying Realtime Purchase Notification on simulated phone order...');
  // Ensure authenticated user placing order
  comp.setState({
    authStatus: 'authenticated',
    notifications: []
  });

  vals = comp.renderVals();
  assert.strictEqual(vals.notifHasUnread, false);

  // Place order with phone in bag
  vals.placeOrder();

  assert.strictEqual(comp.state.screen, 'success', 'Screen must navigate to success screen');
  assert.ok(comp.state.lastOrder, 'lastOrder must be created');
  assert.ok(comp.state.lastOrder.orderNumber.startsWith('LM-'), 'Order number format verified');

  // Check notifications state
  assert.ok(comp.state.notifications.length > 0, 'Notifications array must receive realtime order notification');
  const notif = comp.state.notifications[0];
  assert.ok(notif.title.includes('confirmed'), 'Notification title should state confirmed');
  assert.ok(notif.body.includes('Samsung Galaxy S25 Ultra'), 'Notification body should mention the purchased phone');
  assert.strictEqual(notif.read, false, 'New notification must be unread');

  vals = comp.renderVals();
  assert.strictEqual(vals.notifHasUnread, true, 'notifHasUnread must be true');
  assert.strictEqual(vals.notifBadgeLabel, '1', 'notifBadgeLabel must show 1 unread notification');
  assert.ok(vals.notifList.length > 0, 'notifList must contain the order item');
  console.log('  ✓ Realtime order confirmation notification generated and displayed on phone purchase');

  // ── 5. Test Unified Catalogue Loading ("What you have published") ──
  console.log('\n[5/5] Verifying "What you have published" unified catalogue...');
  // Mock API getSellerListings and getSellerAnnouncements
  sandbox.getApi = () => ({
    ...loumooApi,
    getSellerListings: () => Promise.resolve({
      listings: [
        { id: 'lst_1', title: 'iPhone 16 Pro Max', status: 'PUBLISHED', base_price_minor: 950000, created_at: '2026-09-10T10:00:00Z' }
      ],
      tabCounts: { all: 1, live: 1, drafts: 0, sold: 0, paused: 0, archived: 0 }
    }),
    getSellerAnnouncements: () => Promise.resolve({
      announcements: [
        { id: 'ann_1', title: 'Flash Sale 50% Off Phones', status: 'PUBLISHED', type: 'PROMOTION', kind: 'BROADCAST', created_at: '2026-09-12T10:00:00Z' }
      ]
    })
  });

  comp.setState({
    store: { id: 'store_123', name: 'Orca Electronics' },
    primaryStoreId: 'store_123'
  });

  await comp.loadSellerListings();

  assert.strictEqual(comp.state.sellerListings.length, 2, 'sellerListings must contain both the listing and announcement');
  assert.strictEqual(comp.state.sellerListings[0].id, 'ann_1', 'More recent announcement must sort first');
  assert.strictEqual(comp.state.sellerListings[1].id, 'lst_1', 'Listing must sort second');
  assert.strictEqual(comp.state.sellerTabCounts.all, 2, 'Tab count all must include both');

  const v = comp.renderVals();
  assert.strictEqual(v.sellerListingCards.length, 2, 'sellerListingCards must project both items');
  assert.strictEqual(v.sellerListingCards[0].kind, 'BROADCAST', 'First card must be recognized as BROADCAST');
  assert.strictEqual(v.sellerListingCards[1].kind, 'PRODUCT', 'Second card must be recognized as PRODUCT');

  console.log('  ✓ Unified catalogue seamlessly merges listings and broadcasts with accurate tab counts');
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ALL BUG FIX TESTS PASSED (5/5)!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

module.exports = { run };

if (require.main === module) {
  run().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}
