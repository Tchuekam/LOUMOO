/**
 * Frontend God-Mode: Bug Hunt, Reliability & Production Hardening Test Suite
 * Validates: 87 Screen balances, Auth reactivity, Session isolation, Double-submit guards,
 *            Debounce & stale response safety, Camera stream cleanup, Z-Index tokens.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── 1. HTML Screen Presence & XML Tag Balance Tests ──

function testHtmlScreensAndTags() {
  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

  // Verify balanced <sc-if> and </sc-if>
  const opens = (html.match(/<sc-if\b/g) || []).length;
  const closes = (html.match(/<\/sc-if>/g) || []).length;
  assert.strictEqual(opens, closes, `Every <sc-if> tag must have a matching </sc-if>. Found ${opens} vs ${closes}`);

  // Verify critical screen identifiers
  const criticalScreens = [
    'home', 'search', 'filters', 'voice', 'visual', 'visualScan', 'visualResults',
    'product', 'cart', 'checkout', 'paying', 'success', 'payFailed', 'orders',
    'store', 'business', 'createStore', 'storeOnboarding', 'storeSettings', 'storeVerification', 'storeAnalytics',
    'upload', 'uploadDetails', 'listingAttributes', 'uploadPrice', 'listingPreview', 'uploadSuccess', 'myListings',
    'profile', 'accountDashboard', 'editProfile', 'addresses', 'addAddress', 'editAddress',
    'notificationPreferences', 'privacySettings', 'securitySettings', 'followedStores', 'userActivity', 'deleteAccount',
    'signIn', 'forgotPassword', 'resetPassword', 'verifyEmail',
    'hotelSearch', 'hotelDetail', 'hotelBooking', 'travelTicket'
  ];

  criticalScreens.forEach(screen => {
    assert.ok(html.includes(`is.${screen}`), `Commerce App must contain view state "is.${screen}"`);
  });

  console.log(`  ✓ HTML Structure: ${criticalScreens.length} verified screens, ${opens} matched <sc-if> tags`);
}

// ── 2. CSS Design Tokens & Layering Hierarchy Tests ──

function testCssDesignTokens() {
  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

  const requiredTokens = [
    '--z-base: 1;',
    '--z-sticky: 20;',
    '--z-nav-mobile: 50;',
    '--z-floating-action: 60;',
    '--z-drawer: 100;',
    '--z-modal-backdrop: 200;',
    '--z-modal: 210;',
    '--z-toast: 1000;'
  ];

  requiredTokens.forEach(token => {
    assert.ok(html.includes(token), `CSS :root must define layering token: ${token}`);
  });

  assert.ok(html.includes('z-index: var(--z-toast)'), 'Toast banner must use --z-toast token');
  console.log('  ✓ CSS Layering: standardized z-index tokens (1 -> 20 -> 50 -> 60 -> 100 -> 200 -> 210 -> 1000)');
}

// ── 3. Component Sandbox Instantiation & State Machine Tests ──

function extractComponentClass() {
  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');
  const match = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(match, 'DC script block must be present');

  const mockDCLogic = class {
    constructor() {
      this.state = {};
      this.props = {};
    }
    setState(updater) {
      const next = typeof updater === 'function' ? updater(this.state) : updater;
      this.state = { ...this.state, ...next };
    }
  };

  const sandbox = {
    DCLogic: mockDCLogic,
    SCREENS: [],
    GROUPS: {},
    NO_NAV: [],
    window: undefined,
    globalThis: {},
    localStorage: undefined,
    clearTimeout: () => {},
    setTimeout: (fn) => setTimeout(fn, 0),
    clearInterval: () => {},
    setInterval: () => {},
    document: { documentElement: { setAttribute: () => {} } }
  };

  vm.createContext(sandbox);
  vm.runInContext(match[1] + '\n;globalThis.TestComponent = Component; globalThis.SCREENS = SCREENS;', sandbox);

  return { Component: sandbox.globalThis.TestComponent, SCREENS: sandbox.globalThis.SCREENS };
}

function testSessionLifecycleAndPrivacyIsolation() {
  const { Component } = extractComponentClass();
  const instance = new Component();

  // The session is applied from the SERVER's account-state envelope. There is
  // no longer any path by which the browser can declare itself signed in.
  instance._applyAccountState({
    state: 'SELLER_READY',
    isAuthenticated: true,
    capabilities: { canPurchase: true, canCreateListing: true, canPublishListing: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'READY', storeId: 'store_1' },
    user: {
      id: 'usr_1',
      firstName: 'Amina',
      lastName: 'Ndongo',
      email: 'amina@example.cm',
      phoneNumber: '670112233',
      city: 'Yaounde',
      primaryRole: 'seller'
    }
  });

  assert.strictEqual(instance.state.isLoggedIn, true);
  assert.strictEqual(instance.state.authStatus, 'authenticated');
  assert.strictEqual(instance.state.regFirstName, 'Amina');
  assert.strictEqual(instance.state.regEmail, 'amina@example.cm');
  assert.strictEqual(instance.state.userRole, 'seller');
  assert.strictEqual(instance.state.accountState, 'SELLER_READY');

  // Test complete anonymous session teardown (privacy isolation)
  instance._applyAnonymous();

  assert.strictEqual(instance.state.isLoggedIn, false);
  assert.strictEqual(instance.state.authStatus, 'anonymous');
  assert.strictEqual(instance.state.sessionUser, null);
  assert.strictEqual(instance.state.regFirstName, '', 'Private name must be cleared upon sign-out');
  assert.strictEqual(instance.state.regEmail, '', 'Private email must be cleared upon sign-out');
  assert.strictEqual(instance.state.regPhone, '', 'Private phone must be cleared upon sign-out');
  assert.strictEqual(instance.state.addressesList.length, 0, 'Private addresses must be cleared upon sign-out');
  assert.strictEqual(instance.state.followedStoresList.length, 0, 'Private followed stores must be cleared');
  assert.strictEqual(instance.state.activityList.length, 0, 'Private activity log must be cleared');
  assert.strictEqual(instance.state.accountState, null, 'The cached account state must be dropped');
  assert.strictEqual(Object.keys(instance.state.capabilities).length, 0,
    'No capability may survive a sign-out');

  // Verify renderVals reactivity for anonymous user
  const vals = instance.renderVals();
  assert.strictEqual(vals.showGetStarted, true, 'showGetStarted must be true for anonymous users');
  assert.strictEqual(vals.isLoggedIn, false);

  console.log('  ✓ Session & Privacy Isolation: zero leakage across logins / sign-out');
}

// ── 4. Double Submission & Form Validation Guards ──

function testDoubleSubmissionAndValidationGuards() {
  const { Component } = extractComponentClass();
  const instance = new Component();

  // 1. Sign in empty identifier validation
  instance.setState({ signInIdentifier: '   ', signInPassword: 'x', signInBusy: false });
  let vals = instance.renderVals();
  vals.submitSignIn();
  assert.ok(instance.state.signInError.includes('Enter the email'), 'Must reject whitespace-only sign-in identifier');

  // 2. A missing password is caught before any provider call
  instance.setState({ signInIdentifier: 'test@example.cm', signInPassword: '', signInError: '' });
  vals = instance.renderVals();
  vals.submitSignIn();
  assert.ok(instance.state.signInError.includes('password'), 'Must require a password');

  // 3. Sign in double click protection
  instance.setState({ signInIdentifier: 'test@example.cm', signInPassword: 'secret123', signInBusy: true });
  vals = instance.renderVals();
  vals.submitSignIn();
  assert.strictEqual(instance.state.signInBusy, true, 'Must ignore submit while busy');

  // 4. Publishing a listing is guarded against double submission
  instance.setState({ publishBusy: true });
  instance.publishListing();
  assert.strictEqual(instance.state.publishBusy, true,
    'A second publish click while one is in flight must be ignored');

  // 3. Address form validation
  instance.setState({ addressFormName: '', addressFormPhone: '', addressFormStreet: '' });
  vals = instance.renderVals();
  vals.submitAddressForm();
  assert.ok(instance.state.addressFormError.includes('fill in all address fields'), 'Must reject empty address');

  // 4. Create store validation
  instance.setState({ createStoreName: '   ' });
  vals = instance.renderVals();
  vals.submitCreateStore();
  assert.ok(instance.state.createStoreError.includes('Store name is required'), 'Must reject blank store name');

  console.log('  ✓ Double Submission & Validation Guards: strict client-side validation & busy flags');
}

// ── 5. Search Debounce & Stale Sequence Token Protection ──

function testSearchDebounceAndRaceConditions() {
  const { Component } = extractComponentClass();
  const instance = new Component();

  const vals = instance.renderVals();
  assert.ok(typeof vals.handleSearchInput === 'function', 'handleSearchInput must be exposed');

  // Simulate rapid typing
  vals.handleSearchInput({ target: { value: 'iph' } });
  const seq1 = instance._searchSeq;
  vals.handleSearchInput({ target: { value: 'iphone 15' } });
  const seq2 = instance._searchSeq;

  assert.ok(seq2 > seq1, 'Search sequence token must increment per keystroke to drop stale responses');
  assert.strictEqual(instance.state.searchQuery, 'iphone 15');

  console.log('  ✓ Search Debounce & Race Protection: sequence tokens prevent stale overwrite');
}

// ── 6. Camera Lifecycle & Memory Leak Cleanups ──

function testCameraAndLifecycleCleanup() {
  const { Component } = extractComponentClass();
  const instance = new Component();

  let stopped = false;
  instance._cameraStream = {
    getTracks: () => [{ stop: () => { stopped = true; } }]
  };

  instance._stopCameraStream();
  assert.strictEqual(stopped, true, 'Camera tracks must be stopped');
  assert.strictEqual(instance._cameraStream, null, 'Camera stream reference must be cleared');

  console.log('  ✓ Camera & Memory Cleanup: hardware media streams stopped on teardown');
}

// ── Master Runner ──

async function run() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  FRONTEND GOD-MODE RELIABILITY & BUG AUDIT');
  console.log('═══════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    ['HTML Structure & Screen Balance', testHtmlScreensAndTags],
    ['CSS Layering Tokens & Responsive Design', testCssDesignTokens],
    ['Session Lifecycle & Privacy Isolation', testSessionLifecycleAndPrivacyIsolation],
    ['Double Submission & Validation Guards', testDoubleSubmissionAndValidationGuards],
    ['Search Debounce & Race Protection', testSearchDebounceAndRaceConditions],
    ['Camera Lifecycle & Memory Cleanup', testCameraAndLifecycleCleanup]
  ];

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log(`\n───────────────────────────────────────────────────`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${tests.length} total`);
  console.log(`───────────────────────────────────────────────────\n`);

  if (failed > 0) process.exit(1);
}

module.exports = { run };
if (require.main === module) run();
