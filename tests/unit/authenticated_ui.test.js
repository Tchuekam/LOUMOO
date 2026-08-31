/**
 * LOUMOO — Authenticated UI State
 * ---------------------------------------------------------------------------
 * The header CTA, the "Get Started" banner and every gated action must reflect
 * the SERVER's account state, and nothing else.
 *
 * The previous version of this suite asserted that calling `signIn()` flipped
 * the UI to a signed-in state. That was the bug: a button handler could make
 * the application believe someone was authenticated. The application now
 * starts signed-out and only a server-supplied account state can change that.
 */

require('../setup');
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function loadComponent() {
  const content = fs.readFileSync('Commerce App.dc.html', 'utf8');
  const scriptMatch = content.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'Must find data-dc-script block');

  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(fnOrObj) {
      this.state = typeof fnOrObj === 'function'
        ? Object.assign({}, this.state, fnOrObj(this.state))
        : Object.assign({}, this.state, fnOrObj);
    }
  }

  const navigations = [];

  const context = {
    DCLogic,
    console,
    setTimeout: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
    setInterval: () => {},
    Promise,
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); },
      removeItem(k) { delete this.store[k]; }
    },
    document: { documentElement: { setAttribute: () => {} } },
    navigations
  };

  vm.createContext(context);
  vm.runInContext(
    scriptMatch[1] + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });",
    context
  );

  const comp = context.comp;
  comp.go = (screen) => { navigations.push(screen); comp.state.screen = screen; };

  return { comp, navigations, context };
}

async function run() {
  console.log('  Testing authenticated UI state...');

  const { comp, navigations } = loadComponent();

  /* ── 1. The app starts signed OUT until the server says otherwise ─────── */

  assert.strictEqual(comp.state.isLoggedIn, false,
    'The application must not assume it is signed in before the server answers');
  assert.strictEqual(comp.state.authStatus, 'unknown',
    'Before the session resolves the state is "unknown", not "anonymous" — so the ' +
    'promotional CTA does not flash for a returning user');

  let vals = comp.renderVals();
  assert.strictEqual(vals.showGetStarted, false,
    'The Get Started banner must not appear while the session is still resolving');

  /* ── 2. Resolving to anonymous shows the promotional CTA ──────────────── */

  comp._applyAnonymous();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.authStatus, 'anonymous');
  assert.strictEqual(vals.showGetStarted, true,
    'Once the session is known to be absent, the Get Started banner appears');
  assert.strictEqual(vals.canCreateListing, false);
  assert.strictEqual(vals.canPurchase, false);

  /* ── 3. A button handler CANNOT authenticate the application ──────────── */

  const before = comp.state.isLoggedIn;
  vals.signIn();
  assert.strictEqual(comp.state.isLoggedIn, before,
    'Calling the sign-in affordance must NOT mark the application signed in');
  assert.strictEqual(navigations[navigations.length - 1], 'signIn',
    'It must navigate to the real sign-in screen instead');

  /* ── 4. Only a server account state grants capabilities ───────────────── */

  comp._applyAccountState({
    state: 'ACCOUNT_READY',
    isAuthenticated: true,
    capabilities: {
      canPurchase: true, canSaveItems: true, canStartSelling: true,
      canCreateListing: false, canPublishListing: false, canUploadListingMedia: false
    },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'NONE', storeId: null },
    user: { id: 'usr_1', firstName: 'Amina', lastName: 'Nkeng', email: 'amina@loumoo.cm', city: 'douala' }
  });

  vals = comp.renderVals();
  assert.strictEqual(comp.state.isLoggedIn, true);
  assert.strictEqual(vals.showGetStarted, false,
    'A signed-in user never sees the Get Started banner');
  assert.strictEqual(vals.canPurchase, true);
  assert.strictEqual(vals.canCreateListing, false,
    'A buyer must not be shown as able to create listings');
  assert.strictEqual(vals.accountStateLabel, 'ACCOUNT_READY');

  /* ── 5. Seller-ready state unlocks the selling affordances ────────────── */

  comp._applyAccountState({
    state: 'SELLER_READY',
    isAuthenticated: true,
    capabilities: {
      canPurchase: true, canSaveItems: true, canStartSelling: true,
      canCreateListing: true, canPublishListing: true, canUploadListingMedia: true
    },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'READY', storeId: 'store_1' },
    user: { id: 'usr_1', firstName: 'Amina', lastName: 'Nkeng', primaryStoreId: 'store_1' }
  });

  vals = comp.renderVals();
  assert.strictEqual(vals.canCreateListing, true);
  assert.strictEqual(comp.state.userRole, 'seller');

  /* ── 6. Signing out wipes every trace of the principal ────────────────── */

  vals.signOut();
  vals = comp.renderVals();

  assert.strictEqual(comp.state.isLoggedIn, false);
  assert.strictEqual(comp.state.authStatus, 'anonymous');
  assert.strictEqual(comp.state.sessionUser, null);
  assert.strictEqual(comp.state.accountState, null);
  assert.strictEqual(Object.keys(comp.state.capabilities).length, 0,
    'Every cached capability must be dropped on sign-out');
  assert.strictEqual(comp.state.regEmail, '',
    'The previous user\'s email must not survive into the next session on a shared device');
  assert.strictEqual(comp.state.dashboard, null);
  assert.strictEqual(vals.showGetStarted, true);

  /* ── 7. Phone verification is only offered when it is real ────────────── */

  comp._applyAccountState({
    state: 'ACCOUNT_READY',
    isAuthenticated: true,
    capabilities: { canPurchase: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'NONE', storeId: null },
    user: { id: 'usr_1', firstName: 'Amina' }
  });
  vals = comp.renderVals();
  assert.strictEqual(vals.phoneVerificationAvailable, false,
    'The UI must not offer phone verification the platform cannot perform');

  comp._applyAccountState({
    state: 'ACCOUNT_READY',
    isAuthenticated: true,
    capabilities: { canPurchase: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: true },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'NONE', storeId: null },
    user: { id: 'usr_1', firstName: 'Amina' }
  });
  vals = comp.renderVals();
  assert.strictEqual(vals.phoneVerificationAvailable, true);

  console.log('    ✓ Authenticated UI reflects server account state and nothing else');
}

module.exports = { run };

if (require.main === module) {
  run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
