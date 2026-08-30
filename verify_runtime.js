const fs = require('fs');
const vm = require('vm');

const content = fs.readFileSync('Commerce App.dc.html', 'utf8');

const scriptMatch = content.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("Failed to find data-dc-script block!");
  process.exit(1);
}

const scriptCode = scriptMatch[1];

class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  setState(fnOrObj, cb) {
    const prevState = Object.assign({}, this.state);
    if (typeof fnOrObj === 'function') {
      this.state = Object.assign({}, this.state, fnOrObj(this.state));
    } else {
      this.state = Object.assign({}, this.state, fnOrObj);
    }
    // Simulate runtime calling componentDidUpdate like support.js does
    if (typeof this.componentDidUpdate === 'function') {
      this.componentDidUpdate(this.props, prevState);
    }
    if (typeof cb === 'function') cb();
  }
}

const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

const context = {
  DCLogic,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  localStorage: mockLocalStorage,
  document: {
    documentElement: {
      setAttribute: () => {}
    }
  }
};

vm.createContext(context);
try {
  vm.runInContext(scriptCode + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });", context);
  console.log("Component successfully instantiated in JS runtime!");
  
  const comp = context.comp;
  comp.componentDidMount();
  console.log("Initial screen:", comp.state.screen);
  
  let vals = comp.renderVals();

  // =========================================================================
  // TEST 10: Repeated role card clicking (Buy -> Sell -> Both -> Buy) + componentDidUpdate stability
  // =========================================================================
  console.log("\n--- Running TEST 10: Rapid role switching & lifecycle update stability ---");
  for (let i = 0; i < 5; i++) {
    vals.setRoleBuyer();
    vals.setRoleSeller();
    vals.setRoleBoth();
    // Simulate support.js calling componentDidUpdate with only 1 arg (prevProps)
    comp.componentDidUpdate({});
    // Simulate support.js calling componentDidUpdate with 2 args (prevProps, prevState)
    comp.componentDidUpdate({}, { screen: 'onboardType' });
  }
  vals = comp.renderVals();
  if (comp.state.userRole !== 'both') {
    throw new Error(`Expected role 'both', got '${comp.state.userRole}'`);
  }
  console.log("✓ TEST 10 PASSED: Role switching and lifecycle invocations executed with 0 errors.");

  // =========================================================================
  // TEST 1: Guest -> Buy -> Buyer onboarding -> Complete
  // =========================================================================
  console.log("\n--- Running TEST 1: Buyer Onboarding Flow ---");
  vals.signOut();
  vals = comp.renderVals();
  vals.on.onboardWelcome();
  vals = comp.renderVals();
  vals.on.onboardType();
  vals = comp.renderVals();
  vals.setRoleBuyer();
  vals = comp.renderVals();
  vals.continueFromType();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardIdentity') {
    throw new Error(`Expected 'onboardIdentity', got '${comp.state.screen}'`);
  }
  vals.updateRegFirstName({ target: { value: 'Samuel' } });
  vals.updateRegLastName({ target: { value: 'Etoo' } });
  vals.updateRegPhone({ target: { value: '677 88 99 00' } });
  vals.continueFromIdentity();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardOtp') {
    throw new Error(`Expected 'onboardOtp', got '${comp.state.screen}'`);
  }
  vals.continueAfterOtp();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardBuyer') {
    throw new Error(`Expected 'onboardBuyer' for buyer role, got '${comp.state.screen}'`);
  }
  vals.toggleInterestTech();
  vals.toggleInterestFashion();
  vals.togglePriorityVerified();
  vals.continueAfterBuyer();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardReview') {
    throw new Error(`Expected 'onboardReview', got '${comp.state.screen}'`);
  }
  vals.completeOnboarding();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardSuccess' || !comp.state.isLoggedIn) {
    throw new Error("Buyer onboarding did not complete successfully!");
  }
  console.log("✓ TEST 1 PASSED: Buyer onboarding completed cleanly.");

  // =========================================================================
  // TEST 2: Guest -> Sell -> Seller onboarding -> Complete
  // =========================================================================
  console.log("\n--- Running TEST 2: Seller Onboarding Flow ---");
  vals.signOut();
  vals = comp.renderVals();
  vals.on.onboardType();
  vals = comp.renderVals();
  vals.setRoleSeller();
  vals.continueFromType();
  vals = comp.renderVals();
  vals.updateRegFirstName({ target: { value: 'Jean' } });
  vals.updateRegLastName({ target: { value: 'Kotto' } });
  vals.updateRegPhone({ target: { value: '699 11 22 33' } });
  vals.continueFromIdentity();
  vals = comp.renderVals();
  vals.continueAfterOtp();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardSeller') {
    throw new Error(`Expected 'onboardSeller' for seller role, got '${comp.state.screen}'`);
  }
  vals.setSellerPro();
  vals.toggleProdPhysical();
  vals.continueAfterSeller();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardBusiness') {
    throw new Error(`Expected 'onboardBusiness' for pro seller, got '${comp.state.screen}'`);
  }
  vals.updateRegBusinessName({ target: { value: 'Kotto Tech SARL' } });
  vals.on.onboardVerify();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardVerify') {
    throw new Error(`Expected 'onboardVerify', got '${comp.state.screen}'`);
  }
  vals.setVerifyNow();
  vals.simulateUploadDoc();
  vals = comp.renderVals();
  if (!comp.state.docUploaded) {
    throw new Error("Expected docUploaded to be true!");
  }
  vals.on.onboardReview();
  vals = comp.renderVals();
  vals.completeOnboarding();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardSuccess' || !comp.state.isLoggedIn) {
    throw new Error("Seller onboarding did not complete successfully!");
  }
  console.log("✓ TEST 2 PASSED: Seller onboarding completed cleanly.");

  // =========================================================================
  // TEST 3: Guest -> Both -> Combined onboarding -> Complete
  // =========================================================================
  console.log("\n--- Running TEST 3: Combined Both Onboarding Flow ---");
  vals.signOut();
  vals = comp.renderVals();
  vals.on.onboardType();
  vals = comp.renderVals();
  vals.setRoleBoth();
  vals.continueFromType();
  vals = comp.renderVals();
  vals.updateRegFirstName({ target: { value: 'Rostand' } });
  vals.updateRegLastName({ target: { value: 'Tchuekam' } });
  vals.updateRegPhone({ target: { value: '690 12 34 56' } });
  vals.continueFromIdentity();
  vals = comp.renderVals();
  vals.continueAfterOtp();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardBuyer') {
    throw new Error(`Expected 'onboardBuyer' first in combined flow, got '${comp.state.screen}'`);
  }
  vals.continueAfterBuyer();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardSeller') {
    throw new Error(`Expected transition to 'onboardSeller' in combined flow, got '${comp.state.screen}'`);
  }
  vals.setSellerPro();
  vals.continueAfterSeller();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardBusiness') {
    throw new Error(`Expected 'onboardBusiness', got '${comp.state.screen}'`);
  }
  vals.on.onboardVerify();
  vals = comp.renderVals();
  vals.simulateUploadDoc();
  vals.on.onboardReview();
  vals = comp.renderVals();
  vals.completeOnboarding();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardSuccess' || !comp.state.isLoggedIn) {
    throw new Error("Combined onboarding did not complete successfully!");
  }
  console.log("✓ TEST 3 PASSED: Combined onboarding completed without duplicating identity questions.");

  // =========================================================================
  // TEST 4 & 5: LocalStorage Draft & Session Restoration
  // =========================================================================
  console.log("\n--- Running TEST 4 & 5: Persistence & Session Restoration ---");
  const authSession = mockLocalStorage.getItem('loumoo_auth_user');
  if (!authSession || !JSON.parse(authSession).isLoggedIn) {
    throw new Error("Expected auth user to be persisted in localStorage!");
  }
  console.log("✓ TEST 4 & 5 PASSED: Session properly saved in localStorage.");

  // =========================================================================
  // TEST 6: Authenticated User skips onboarding on reload
  // =========================================================================
  console.log("\n--- Running TEST 6: Returning Authenticated User ---");
  const comp2 = vm.runInContext("new Component({ userName: 'Rostand', showAds: true })", context);
  comp2.componentDidMount();
  if (!comp2.state.isLoggedIn) {
    throw new Error("Expected comp2 to restore authenticated state automatically!");
  }
  console.log("✓ TEST 6 PASSED: Authenticated user does not see onboarding again.");

  // =========================================================================
  // TEST 7, 8, 9: Header CTA Reactivity (JOIN <-> UPLOAD)
  // =========================================================================
  console.log("\n--- Running TEST 7, 8, 9: Header CTA Dynamic Behavior ---");
  // Logged in seller
  let v = comp.renderVals();
  if (v.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected 'Sell on LOUMOO', got '${v.ctaLabel}'`);
  }
  v.ctaAction();
  if (comp.state.screen !== 'upload') {
    throw new Error(`Expected navigation to 'upload', got '${comp.state.screen}'`);
  }
  console.log("✓ TEST 9 PASSED: Upload opens listing creation flow for seller.");

  // Sign out
  v.signOut();
  v = comp.renderVals();
  if (v.ctaLabel !== 'Join LOUMOO') {
    throw new Error(`Expected 'Join LOUMOO', got '${v.ctaLabel}'`);
  }
  console.log("✓ TEST 7 PASSED: JOIN label returns on logout.");

  // Sign in
  v.signIn();
  v = comp.renderVals();
  if (v.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected 'Sell on LOUMOO', got '${v.ctaLabel}'`);
  }
  console.log("✓ TEST 8 PASSED: UPLOAD label returns on login.");

  console.log("\n======================================================================");
  console.log("  ALL 10 ONBOARDING & RUNTIME TEST MATRIX SCENARIOS PASSED 100%!");
  console.log("======================================================================\n");
} catch (e) {
  console.error("Runtime test error:", e);
  process.exit(1);
}
