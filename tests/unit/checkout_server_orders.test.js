/**
 * LOUMOO Unit Tests - Checkout creates the order on the server
 * ---------------------------------------------------------------------------
 * Drives the REAL compiled app (Commerce App.dc.html) in a sandbox, with a fake
 * API that follows the server's rules. The old checkout built the order in the
 * browser and fired the server call with its error swallowed, so no order ever
 * reached a seller and nothing could be delivered. What must hold now:
 *
 *   - a guest is sent to sign in (the bag is kept, checkout is where they return);
 *   - a delivery address with a street and a phone is required, never invented;
 *   - the server creates the order, one per store, with no client total;
 *   - a refusal keeps the bag and says why; items already placed stay placed;
 *   - a double tap cannot place the order twice;
 *   - the order list, the order detail and a tapped notification all work from
 *     the order the SERVER holds, and an old device-only order says it was never sent.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const Circuit = require('../../src/services/deliveryCircuit');

// Values read out of the sandbox have the sandbox's own Array/Object prototypes, which
// deepStrictEqual treats as different from the host's: compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));
const sleep = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(predicate, what, ms = 2000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (predicate()) return;
    await sleep(5);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

function buildApp(apiRef, windowExtras = {}) {
  const html = fs.readFileSync(path.resolve(__dirname, '../../Commerce App.dc.html'), 'utf8');
  const match = html.match(/<script\s+type=["']text\/x-dc["'][^>]*>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'Commerce App.dc.html must contain the app script');

  const toasts = [];
  const sandbox = {
    console, Math, Date, JSON, Promise, String, Number, Boolean, Array, Object, RegExp, Error, Set, Map,
    encodeURIComponent, decodeURIComponent, parseInt, parseFloat,
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    document: {
      documentElement: { setAttribute: () => {} },
      body: {},
      hidden: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      getElementById: () => ({ click: () => {}, scrollBy: () => {} }),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ click: () => {}, files: [] })
    },
    window: Object.assign({
      location: { href: 'http://localhost:3000' },
      open: () => ({}),
      addEventListener: () => {},
      removeEventListener: () => {},
      Notification: { permission: 'default' },
      LoumooCircuit: Circuit,
      LoumooPublishing: require('../../src/services/publishingEngine')
    }, windowExtras),
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    },
    DCLogic: class {
      constructor() { this.state = {}; this.props = {}; }
      setState(updater, cb) {
        this.state = Object.assign({}, this.state, typeof updater === 'function' ? updater(this.state) : updater);
        if (cb) cb();
      }
    },
    getClerk: () => null,
    getPublishing: () => sandbox.window.LoumooPublishing,
    getGuard: () => null,
    friendlyError: (e) => (e && e.message) || String(e)
  };
  // The app's own getApi() reads window.LoumooAPI, so that is where the fake goes.
  Object.defineProperty(sandbox.window, 'LoumooAPI', { get: () => apiRef.current, configurable: true });
  vm.createContext(sandbox);
  vm.runInContext(match[1] + '\nvar comp = new Component();', sandbox);
  const comp = sandbox.comp;
  assert.ok(comp, 'the app component builds');
  comp.toast = (m) => toasts.push(m);
  comp._unmounted = false;
  return { comp, toasts, sandbox };
}

const STORE_OF = { l1: 'Tech Shop', l2: 'Tech Shop', l3: 'Books Corner' };
const PRICE = { l1: 50000, l2: 3000, l3: 4000 };

/** A fake API that behaves like the server's order endpoint. */
function fakeServer() {
  const server = { payloads: [], keys: [], orders: [], notifications: [], seq: 0, hold: null, failWith: null };
  server.api = {
    createOrder: async (payload, options) => {
      server.payloads.push(JSON.parse(JSON.stringify(payload)));
      server.keys.push((options && options.idempotencyKey) || null);
      if (server.failWith) {
        // A transport/5xx failure AFTER the server may have stored the order: the reply is lost.
        const status = server.failWith;
        server.failWith = null;
        const err = new Error('Service unavailable');
        err.status = status;
        throw err;
      }
      if (server.hold) await server.hold;
      for (const it of payload.items) {
        if (!(it.listingId in STORE_OF)) {
          const err = new Error(`Listing with id '${it.listingId}' was not found`);
          err.status = 404; err.code = 'NOT_FOUND';
          throw err;
        }
      }
      if (server.reply === 'empty') return null;
      // Mirror the server: a store pickup has no rider leg, so it is charged no
      // delivery fee, and the method the buyer chose is the method the order gets.
      const method = payload.deliveryMethod === 'STORE_PICKUP' ? 'STORE_PICKUP' : 'HOME_DELIVERY';
      const fee = method === 'STORE_PICKUP' ? 0 : 1500;
      const sub = payload.items.reduce((n, it) => n + PRICE[it.listingId] * it.quantity, 0);
      const order = {
        id: `ord_${++server.seq}`, orderNumber: `KM-T-${server.seq}`, buyerId: 'b', sellerId: 's', sellerPhone: '699334455',
        subtotalXaf: sub, shippingFeeXaf: fee, totalAmountXaf: sub + fee,
        items: payload.items.map((it) => ({ listingId: it.listingId, title: it.title, unitPriceXaf: PRICE[it.listingId], quantity: it.quantity, storeName: STORE_OF[it.listingId], storePhone: '699334455', imageUrl: null })),
        shippingAddress: payload.shippingAddress, deliveryMethod: method, paymentStatus: 'pending', fulfillmentStatus: 'processing', createdAt: new Date().toISOString()
      };
      server.orders.unshift(order);
      return order;
    },
    getOrders: async () => ({ orders: server.orders, total: server.orders.length }),
    getNotifications: async () => server.notifications
  };
  return server;
}

const ADDRESS = { id: 'a1', isDefault: true, recipientName: 'Awa Njoya', phoneNumber: '622222222', streetAddress: 'Rue 1, Bonanjo', city: 'Douala' };
const bag = () => [
  { id: 'l1', name: 'Phone', priceXaf: 50000, qty: 1, store: 'Tech Shop', image: 'phone.jpg' },
  { id: 'l2', name: 'Case', priceXaf: 3000, qty: 2, store: 'Tech Shop', image: 'case.jpg' },
  { id: 'l3', name: 'Novel', priceXaf: 4000, qty: 1, store: 'Books Corner', image: 'novel.jpg' }
];

async function testGuestAndAddress() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp, toasts } = buildApp(apiRef);

  // A guest is sent to sign in, keeping the bag and the way back.
  comp.setState({ authStatus: 'guest', cartItems: bag(), addressesList: [ADDRESS], screen: 'checkout' });
  comp.renderVals().placeOrder();
  assert.strictEqual(comp.state.screen, 'signIn', 'a guest is sent to sign in');
  assert.strictEqual(comp.state.postAuthRedirect, 'checkout', 'and returns to checkout afterwards');
  assert.strictEqual(comp.state.cartItems.length, 3, 'the bag is kept');
  assert.strictEqual(server.payloads.length, 0, 'nothing was sent');
  assert.ok(toasts.some((t) => /Sign in/i.test(t)));

  // No address: the rider would have nowhere to go, so nothing is invented.
  for (const addressesList of [[], [{ ...ADDRESS, streetAddress: '' }], [{ ...ADDRESS, phoneNumber: '12' }]]) {
    comp.setState({ authStatus: 'authenticated', screen: 'checkout', cartItems: bag(), addressesList, selectedDeliveryAddress: null, regPhone: '', regCity: '', regFirstName: '', regLastName: '', orderError: '' });
    comp.renderVals().placeOrder();
    assert.ok(/delivery address/i.test(comp.state.orderError), 'it asks for a real address');
    assert.strictEqual(server.payloads.length, 0, 'and sends nothing');
    assert.strictEqual(comp.state.placingOrder, false);
  }

  // The card must not invent a destination it does not have: with nothing on file
  // it shows no name, no address, and flags that one must be added — the old bug
  // was a fabricated "Rue Joss, Bonanjo…" shown while the order refused the empty
  // address, so the screen and the action disagreed.
  comp.setState({ authStatus: 'authenticated', screen: 'checkout', cartItems: bag(), addressesList: [], selectedDeliveryAddress: null, regPhone: '', regCity: '', regFirstName: '', regLastName: '' });
  const empty = comp.renderVals();
  assert.strictEqual(empty.checkoutHasDestination, false, 'with nothing on file, there is no destination');
  assert.strictEqual(empty.checkoutRecipientName, '', 'and no invented recipient name');
  assert.strictEqual(empty.checkoutDeliveryAddress, '', 'and no invented street');
}

// Store pickup is the other fulfilment path: the buyer collects the order, so no
// street or city is needed — only a name and a phone so the store can reach them.
// The buyer's choice must reach the order, and a pickup is charged no delivery fee.
async function testStorePickup() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp } = buildApp(apiRef);
  const asPickup = (extra) => comp.setState(Object.assign(
    { authStatus: 'authenticated', screen: 'checkout', sel: Object.assign({}, comp.state.sel, { deliv: 'pickup' }) },
    extra
  ));

  // Pickup with no way to reach the buyer is refused — but for the pickup reason,
  // not the delivery-address one, and nothing is sent.
  asPickup({ cartItems: bag(), addressesList: [], selectedDeliveryAddress: null, regPhone: '', regCity: '', regFirstName: '', regLastName: '', orderError: '' });
  comp.renderVals().placeOrder();
  assert.ok(/pickup/i.test(comp.state.orderError), 'pickup still needs a name and phone');
  assert.ok(!/delivery address/i.test(comp.state.orderError), 'but it does not ask for a street it will not use');
  assert.strictEqual(server.payloads.length, 0, 'and sends nothing');

  // A name and phone are enough: no street or city, the order is placed as a
  // STORE_PICKUP, and the server charges no delivery fee.
  asPickup({ cartItems: bag(), orderError: '', regFirstName: 'Awa', regLastName: 'Njoya', regPhone: '622222222' });
  comp.renderVals().placeOrder();
  await waitFor(() => comp.state.screen === 'success', 'the pickup success screen');
  assert.strictEqual(server.payloads.length, 2, 'one order per store, same as delivery');
  for (const p of server.payloads) {
    assert.strictEqual(p.deliveryMethod, 'STORE_PICKUP', 'the buyer\'s pickup choice reaches the order');
    assert.ok(!p.shippingAddress.street, 'no street is sent for a pickup');
  }
  for (const o of comp.state.orders) assert.strictEqual(o.shippingFeeXaf, 0, 'a pickup is charged no delivery fee');
}

// The buyer can prefer a delivery provider at checkout. The picker shows real,
// selectable facts; the chosen provider's fee is the fee shown; and the choice is
// sent with the order as preferredDriverId (home delivery only).
async function testProviderPreference() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp } = buildApp(apiRef);
  const oneStore = [{ id: 'l1', name: 'Phone', priceXaf: 50000, qty: 1, store: 'Tech Shop', image: 'p.jpg' }];
  comp.setState({
    authStatus: 'authenticated', screen: 'checkout', cartItems: oneStore, addressesList: [ADDRESS],
    providers: [
      { id: 'rider_a', name: 'Alain', vehicleType: 'motorbike', rating: { average: 4.5, count: 12 }, completedDeliveries: 42, openDeliveries: 0, feeXaf: 2500, serviceAreas: ['douala'], isAgency: false },
      { id: 'agency_f', name: 'FastMove', vehicleType: null, rating: null, completedDeliveries: 0, openDeliveries: 1, feeXaf: 1800, serviceAreas: ['douala'], isAgency: true }
    ],
    providersCity: 'Douala', selectedProviderId: 'rider_a'
  });

  const vals = comp.renderVals();
  assert.strictEqual(vals.checkoutShowProviders, true, 'the picker shows for a home delivery with an address');
  // The chosen provider's fee is the fee shown (items 50 000 + rider 2 500).
  assert.ok(/52 500/.test(vals.cartTotal), 'the chosen provider\'s fee is in the total: ' + vals.cartTotal);
  const card = vals.checkoutProviders.find((p) => p.id === 'rider_a');
  assert.strictEqual(card.selected, true, 'the chosen provider is marked selected');
  assert.ok(/42 deliveries/.test(card.completedLabel), 'a real completed-delivery count is shown');
  assert.ok(/2 500/.test(card.feeLabel), 'the provider\'s fee is shown');
  assert.strictEqual(card.vehicleLabel, 'Motorbike');
  const agency = vals.checkoutProviders.find((p) => p.id === 'agency_f');
  assert.strictEqual(agency.kindLabel, 'Agency', 'an agency is labelled as one');
  assert.strictEqual(agency.ratingLabel, 'New', 'no reviews shows "New", not a fabricated score');

  vals.placeOrder();
  await waitFor(() => comp.state.screen === 'success', 'the success screen');
  assert.strictEqual(server.payloads.length, 1, 'one store, one order');
  assert.strictEqual(server.payloads[0].preferredDriverId, 'rider_a', 'the buyer\'s chosen provider is sent with the order');

  // Tapping the selected provider again clears the preference (it is optional).
  comp.setState({ cartItems: oneStore, screen: 'checkout' });
  comp.renderVals().checkoutProviders.find((p) => p.id === 'rider_a').select();
  assert.strictEqual(comp.state.selectedProviderId, null, 'tapping the chosen provider clears it');
}

async function testHappyPath() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp, toasts } = buildApp(apiRef);
  comp.setState({ authStatus: 'authenticated', cartItems: bag(), addressesList: [ADDRESS], screen: 'checkout' });

  const vals = comp.renderVals();
  assert.strictEqual(vals.placeOrderLabel, 'PLACE ORDER · XAF 61 000', 'the button shows the total the order will have');
  assert.strictEqual(vals.cartTotal, 'XAF 61 000', 'items (60 000) + the Douala delivery fee (1 000), and no escrow fee that is never charged');
  vals.placeOrder();
  assert.strictEqual(comp.state.placingOrder, true, 'the button is busy straight away');
  assert.strictEqual(comp.renderVals().placeOrderLabel, 'PLACING YOUR ORDER…');

  await waitFor(() => comp.state.screen === 'success', 'the success screen');
  assert.strictEqual(server.payloads.length, 2, 'one order per store');
  assert.deepStrictEqual(server.payloads.map((p) => p.items.map((i) => i.listingId)), [['l1', 'l2'], ['l3']]);
  for (const p of server.payloads) {
    assert.ok(!('totalAmountXaf' in p) && !('totalXaf' in p) && !('orderNumber' in p), 'no client total or number: the server prices and numbers the order');
    assert.strictEqual(p.deliveryMethod, 'HOME_DELIVERY');
    assert.strictEqual(p.shippingAddress.street, 'Rue 1, Bonanjo');
    assert.strictEqual(p.shippingAddress.phone, '622222222');
  }
  assert.strictEqual(server.payloads[0].items[0].unitPriceXaf, 50000, 'the shown price is sent so a stale price is caught');
  assert.deepStrictEqual(plain(comp.state.orders.map((o) => o.id).sort()), ['ord_1', 'ord_2'], 'the app holds the SERVER\'s orders');
  assert.ok(comp.state.orders.every((o) => o.serverSynced && /^KM-T-/.test(o.orderNumber)), 'with the server\'s numbers');
  assert.strictEqual(comp.state.cartItems.length, 0, 'the bag is empty once everything is placed');
  assert.strictEqual(comp.state.placingOrder, false);
  assert.strictEqual(comp.state.orders.find((o) => o.id === 'ord_1').items[0].image, 'phone.jpg', 'the picture the shopper saw is kept');

  const v = comp.renderVals();
  assert.strictEqual(v.lastOrdersTitle, '2 orders placed!');
  assert.strictEqual(v.lastOrdersHasMore, true);
  assert.ok(/2 stores/.test(v.lastOrdersMoreNote) && /KM-T-1/.test(v.lastOrdersMoreNote) && /KM-T-2/.test(v.lastOrdersMoreNote));
  assert.strictEqual(v.lastOrderId, 'ord_1', 'the success strip and Track button point at a real order');
  assert.ok(toasts.some((t) => /placed/i.test(t)));
}

async function testRefusalKeepsTheBag() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp } = buildApp(apiRef);
  comp.setState({
    authStatus: 'authenticated', screen: 'checkout', addressesList: [ADDRESS],
    cartItems: [
      { id: 'l1', name: 'Phone', priceXaf: 50000, qty: 1, store: 'Tech Shop' },
      { id: 'elec-1', name: 'MacBook Pro', priceXaf: 1200000, qty: 1, store: 'Orca Electronics' }
    ]
  });
  comp.renderVals().placeOrder();
  await waitFor(() => !comp.state.placingOrder && comp.state.orderError, 'the refusal');

  assert.strictEqual(comp.state.screen, 'checkout', 'the shopper stays on checkout');
  assert.strictEqual(comp.state.orders.length, 1, 'the order that went through is kept');
  assert.deepStrictEqual(plain(comp.state.cartItems.map((i) => i.id)), ['elec-1'], 'only what was NOT ordered stays in the bag');
  assert.ok(/1 order was placed/.test(comp.state.orderError), 'it says what did go through');
  assert.ok(/MacBook Pro is a showcase item/.test(comp.state.orderError), 'and names the item that cannot be ordered, in plain words');
  assert.ok(!/elec-1|Listing with id/.test(comp.state.orderError), 'with no internal id');
  assert.deepStrictEqual(plain(comp.state.orderErrorItemIds), ['elec-1']);
  assert.strictEqual(comp.renderVals().orderErrorHasItems, true);

  comp.renderVals().removeUnavailableItems();
  assert.strictEqual(comp.state.cartItems.length, 0, 'the refused item is removed from the bag');
  assert.strictEqual(comp.state.orderError, '', 'and the message clears');
  assert.strictEqual(comp.state.screen, 'cart', 'an empty bag goes back to the bag screen');

  // The server answering without an order is a failure, not a success.
  const server2 = fakeServer(); server2.reply = 'empty';
  const apiRef2 = { current: server2.api };
  const second = buildApp(apiRef2);
  second.comp.setState({ authStatus: 'authenticated', screen: 'checkout', addressesList: [ADDRESS], cartItems: bag().slice(0, 1) });
  second.comp.renderVals().placeOrder();
  await waitFor(() => !second.comp.state.placingOrder && second.comp.state.orderError, 'the unconfirmed order');
  assert.strictEqual(second.comp.state.orders.length, 0, 'an unconfirmed order is not shown as placed');
  assert.strictEqual(second.comp.state.cartItems.length, 1, 'and the bag is kept');
  assert.notStrictEqual(second.comp.state.screen, 'success');
}

async function testDoubleTap() {
  const server = fakeServer();
  let release; server.hold = new Promise((r) => { release = r; });
  const apiRef = { current: server.api };
  const { comp } = buildApp(apiRef);
  comp.setState({ authStatus: 'authenticated', screen: 'checkout', addressesList: [ADDRESS], cartItems: bag().slice(0, 1) });
  const vals = comp.renderVals();
  vals.placeOrder();
  vals.placeOrder();                 // an impatient second tap, before the first answer
  comp.renderVals().placeOrder();    // and a third, from a re-render
  await sleep(20);
  assert.strictEqual(server.payloads.length, 1, 'three taps place the order once');
  release();
  await waitFor(() => comp.state.screen === 'success', 'success');
  assert.strictEqual(server.payloads.length, 1);
  assert.strictEqual(comp.state.orders.length, 1);
}

async function testOrdersAndDetail() {
  const server = fakeServer();
  const apiRef = { current: server.api };
  const { comp } = buildApp(apiRef);
  comp.setState({ authStatus: 'authenticated', screen: 'checkout', addressesList: [ADDRESS], cartItems: bag().slice(0, 2) });
  comp.renderVals().placeOrder();
  await waitFor(() => comp.state.screen === 'success', 'success');

  // An older order that only ever existed on this device.
  comp.setState({ orders: comp.state.orders.concat([{ orderNumber: 'LM-OLD', status: 'pending', paymentMethod: 'MTN MoMo', items: [{ id: 'z', name: 'Old', qty: 1, priceXaf: 1000 }], itemCount: 1, totalXaf: 4000, seller: 'Shop', createdAt: Date.now() - 1e8 }]) });
  let v = comp.renderVals();
  const real = v.ordersList.find((o) => o.id === 'ord_1');
  const old = v.ordersList.find((o) => o.orderNumber === 'LM-OLD');
  assert.strictEqual(real.canOpen, true);
  assert.strictEqual(real.notSent, false);
  assert.strictEqual(real.statusLabel, 'PREPARING');
  assert.strictEqual(old.canOpen, false, 'an order the server never saw cannot be tracked');
  assert.strictEqual(old.notSent, true);
  assert.strictEqual(old.statusLabel, 'NOT SENT');

  // The detail is that order, with the server's numbers and a Track button bound to its id.
  v.openOrderById('ord_1');
  assert.strictEqual(comp.state.screen, 'orderDetail');
  v = comp.renderVals();
  assert.strictEqual(v.orderView.id, 'ord_1');
  assert.strictEqual(v.orderView.orderNumber, 'KM-T-1');
  assert.strictEqual(v.orderView.canTrack, true);
  assert.strictEqual(v.orderView.subtotalLabel, 'XAF 56 000');
  assert.strictEqual(v.orderView.shippingLabel, 'XAF 1 500', 'the server\'s delivery fee');
  assert.strictEqual(v.orderView.totalLabel, 'XAF 57 500');
  assert.deepStrictEqual(plain(v.orderView.items.map((i) => i.name)), ['Phone', 'Case']);
  assert.strictEqual(v.orderView.seller, 'Tech Shop');
  assert.ok(!/iPhone 15|748|LM-94820/.test(JSON.stringify(v.orderView)), 'no mock data');

  // The old order opens to an honest note, not a Track button.
  comp.setState({ currentOrder: comp.state.orders.find((o) => o.orderNumber === 'LM-OLD') });
  v = comp.renderVals();
  assert.strictEqual(v.orderView.canTrack, false);
  assert.ok(/saved on this device only/.test(v.orderView.noTrackNote));

  // Nothing open: an empty view, never someone else's order.
  comp.setState({ currentOrder: null });
  assert.strictEqual(comp.renderVals().orderView.id, '');

  // The status moves on the server; entering My Orders pulls it in.
  server.orders[server.orders.length - 1].fulfillmentStatus = 'in_transit';
  comp.loadServerOrders();
  await waitFor(() => comp.state.orders.find((o) => o.id === 'ord_1').status === 'in_transit', 'the refreshed status');
  assert.strictEqual(comp.renderVals().ordersList.find((o) => o.id === 'ord_1').statusLabel, 'OUT FOR DELIVERY');
  assert.ok(comp.state.orders.some((o) => o.orderNumber === 'LM-OLD'), 'the old order is still listed');
}

async function testNotifications() {
  const server = fakeServer();
  const opened = [];
  const apiRef = { current: server.api };
  const { comp, toasts } = buildApp(apiRef);
  // Loaded in Node, the circuit module looks for the screens on the host's global
  // (in a browser that global is window); the spies go where it looks.
  global.LoumooDeliveryTracking = { open: (o) => opened.push(['track', o]) };
  global.LoumooSellerDispatch = { open: (o) => opened.push(['dispatch', o]) };
  global.LoumooRiderHub = { open: () => opened.push(['rider']) };
  try {
    await runNotificationChecks(comp, server, toasts, opened);
  } finally {
    delete global.LoumooDeliveryTracking;
    delete global.LoumooSellerDispatch;
    delete global.LoumooRiderHub;
  }
}

async function runNotificationChecks(comp, server, toasts, opened) {
  comp.setState({ authStatus: 'authenticated', screen: 'home' });
  const when = new Date().toISOString();
  server.notifications = [
    { id: 's1', title: 'New order KM-1 to deliver', body: 'Arrange a rider from Deliveries.', tone: 'sale', read: false, createdAt: when, metadata: { audience: 'seller', action: 'open_dispatch', orderId: 'ord_1' } },
    { id: 'r1', title: 'New delivery assigned', body: 'Open LOUMOO to accept or decline it.', tone: 'accent', read: false, createdAt: when, metadata: { audience: 'rider', action: 'open_rider_hub', deliveryId: 'dlv_1', orderId: 'ord_1' } },
    { id: 'b1', title: 'A rider accepted your delivery', body: 'Alain will pick up your order.', tone: 'success', read: false, createdAt: when, metadata: { audience: 'buyer', action: 'track_order', deliveryId: 'dlv_1', orderId: 'ord_1' } },
    { id: 'x1', title: 'Welcome', body: 'Hi', tone: 'accent', read: false, createdAt: when, metadata: {} }
  ];
  comp.loadServerNotifications({ announce: true });
  await waitFor(() => comp.state.notifications.length === 4, 'the feed');
  assert.ok(toasts.some((t) => /to deliver/.test(t) && /\+3 more/.test(t)), 'a live arrival is announced: ' + toasts.join(' | '));
  assert.ok(comp.state.notifications.every((n) => n.metadata), 'the routing metadata is kept');

  const list = comp.renderVals().notifList;
  const byTitle = (re) => list.find((n) => re.test(n.title));
  assert.deepStrictEqual(plain(list.map((n) => n.openLabel).sort()), ['', 'Open deliveries', 'Open rider jobs', 'Track order']);
  assert.strictEqual(byTitle(/Welcome/).canOpen, false, 'a note with no screen has no button');

  byTitle(/to deliver/).open();
  byTitle(/assigned/).open();
  byTitle(/accepted/).open();
  assert.deepStrictEqual(opened, [['dispatch', { orderId: 'ord_1' }], ['rider'], ['track', { deliveryId: 'dlv_1' }]], 'each opens the screen for the part its reader plays');

  // Signed out: nothing is read, and nothing throws.
  const before = comp.state.notifications.length;
  comp.setState({ authStatus: 'guest' });
  assert.doesNotThrow(() => comp.loadServerNotifications({ announce: true }));
  assert.strictEqual(comp.state.notifications.length, before);
}

async function run() {
  console.log('  Testing checkout and orders against the server\'s rules...');
  await testGuestAndAddress();
  await testStorePickup();
  await testProviderPreference();
  await testHappyPath();
  await testRefusalKeepsTheBag();
  await testDoubleTap();
  await testOrdersAndDetail();
  await testNotifications();
  console.log('    ✓ Orders are created on the server, one per store, with honest errors; orders, detail and notifications work from them.');
}

module.exports = { run };
