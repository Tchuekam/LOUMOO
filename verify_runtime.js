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

  // Registration is real: it creates an account with the identity provider.
  // Without an email address the wizard must NOT advance, and must say why.
  vals.continueFromIdentity();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardIdentity') {
    throw new Error(`Missing email must keep the user on the identity step, got '${comp.state.screen}'`);
  }
  if (!/email/i.test(comp.state.regError || '')) {
    throw new Error(`Expected an actionable email error, got '${comp.state.regError}'`);
  }

  vals.updateRegEmail({ target: { value: 'samuel.etoo@example.cm' } });
  vals = comp.renderVals();
  vals.continueFromIdentity();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardIdentity' || !/password/i.test(comp.state.regError || '')) {
    throw new Error(`A weak or missing password must be refused, got '${comp.state.regError}'`);
  }

  vals.updateRegPassword({ target: { value: 'a-strong-passphrase-1' } });
  vals = comp.renderVals();
  vals.continueFromIdentity();
  vals = comp.renderVals();

  // In this sandbox the Clerk SDK is absent, so registration cannot proceed.
  // The correct behaviour is to stay put with an explanation — never to
  // pretend an account was created.
  if (comp.state.screen !== 'onboardIdentity') {
    throw new Error(`Without an identity provider the wizard must not advance, got '${comp.state.screen}'`);
  }
  if (!comp.state.regError) {
    throw new Error('A failed registration must produce a visible error, not silence');
  }
  console.log("  · Registration correctly refuses to proceed without an identity provider");

  // Simulate the server having confirmed the account, which is the only way
  // the real application ever reaches the rest of the wizard.
  comp._applyAccountState({
    state: 'ONBOARDING_IN_PROGRESS',
    isAuthenticated: true,
    capabilities: { canCompleteOnboarding: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'IN_PROGRESS', percentage: 40, nextStep: 'PERSONAL_INFO', steps: [] },
    seller: { status: 'NONE', storeId: null },
    user: { id: 'usr_1', firstName: 'Samuel', lastName: 'Etoo', email: 'samuel.etoo@example.cm' }
  });
  comp.setState({ emailVerifyState: 'verified' });
  comp.go('onboardBuyer');
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
  // Completion is a SERVER decision. With no gateway reachable here, the
  // wizard must surface that rather than marking the user onboarded locally.
  vals.completeOnboarding();
  vals = comp.renderVals();
  if (comp.state.screen === 'onboardSuccess') {
    throw new Error('Onboarding must not be declared complete without the server confirming it');
  }
  console.log("✓ TEST 1 PASSED: Buyer wizard routes correctly; completion stays server-authoritative.");

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
  vals.updateRegEmail({ target: { value: 'jean.kotto@example.cm' } });
  // The verified session the server would have established by this point.
  comp.setState({ authStatus: 'authenticated', isLoggedIn: true, emailVerifyState: 'verified' });
  comp.go('onboardSeller');
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

  /*
   * Regression guard for the faked verification upload.
   *
   * This test used to call `simulateUploadDoc()`, which set docUploaded=true
   * and invented the filename 'CNI_Scanned_Document.pdf' without uploading
   * anything. The test passed while the feature did not exist, which is exactly
   * how the broken pipeline stayed hidden.
   *
   * The fake handlers are gone. What is asserted now is that (a) no simulation
   * handler can come back, and (b) with no API reachable in this sandbox the
   * real handler refuses to mark a document as attached and surfaces an error.
   */
  if (typeof vals.simulateUploadDoc === 'function' || typeof vals.simulateVerDocAttach === 'function') {
    throw new Error('A simulated document-attach handler was reintroduced; verification must never be faked.');
  }

  vals.handleVerificationDocUpload({ target: { files: [{ name: 'cni.png', size: 240000 }] } });
  vals = comp.renderVals();
  if (comp.state.docUploaded) {
    throw new Error('Document reported as attached without a successful upload!');
  }
  if (!comp.state.docUploadError) {
    throw new Error('Expected a visible upload error when the document could not be sent.');
  }
  vals.on.onboardReview();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardReview') {
    throw new Error(`Expected 'onboardReview', got '${comp.state.screen}'`);
  }
  console.log("✓ TEST 2 PASSED: Seller wizard branches correctly through business and verification.");

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
  vals.updateRegEmail({ target: { value: 'rostand@example.cm' } });
  comp.setState({ authStatus: 'authenticated', isLoggedIn: true, emailVerifyState: 'verified' });
  comp.go('onboardBuyer');
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
  // Verification is optional in this branch; the user proceeds to review
  // without attaching a document (no simulated attach exists any more).
  vals.on.onboardReview();
  vals = comp.renderVals();
  if (comp.state.screen !== 'onboardReview') {
    throw new Error(`Expected 'onboardReview', got '${comp.state.screen}'`);
  }
  // The combined flow must have asked for identity ONCE — the buyer branch
  // came first and the seller branch reused the same answers.
  if (comp.state.regFirstName !== 'Rostand') {
    throw new Error('Combined onboarding must not re-ask for identity details');
  }
  console.log("✓ TEST 3 PASSED: Combined onboarding branches without duplicating identity questions.");

  // =========================================================================
  // TEST 4 & 5: LocalStorage Draft & Session Restoration
  // =========================================================================
  console.log("\n--- Running TEST 4 & 5: Persistence & Session Restoration ---");

  // localStorage must hold NO authentication signal. A "logged in" marker
  // there would be a claim the browser makes about itself, and anyone could
  // set it. Only the onboarding form draft may be cached, as a convenience.
  const authSession = mockLocalStorage.getItem('loumoo_auth_user');
  if (authSession) {
    throw new Error('localStorage must not hold any authentication marker');
  }

  const draft = mockLocalStorage.getItem('loumoo_onboarding_draft');
  if (!draft) {
    throw new Error('Expected the onboarding form draft to be cached for convenience');
  }
  const parsedDraft = JSON.parse(draft);
  if (!('regFirstName' in parsedDraft)) {
    throw new Error('The draft should carry the half-typed form values');
  }
  if ('isLoggedIn' in parsedDraft || 'token' in parsedDraft) {
    throw new Error('The onboarding draft must never carry a session or an auth flag');
  }
  console.log("✓ TEST 4 & 5 PASSED: Only form drafts are cached; no auth signal in localStorage.");

  // =========================================================================
  // TEST 6: A fresh page load starts UNAUTHENTICATED until the server answers
  // =========================================================================
  console.log("\n--- Running TEST 6: Returning User Session Resolution ---");
  const comp2 = vm.runInContext("new Component({ userName: 'Rostand', showAds: true })", context);
  comp2.componentDidMount();

  if (comp2.state.isLoggedIn) {
    throw new Error('A fresh load must not consider itself signed in before the server answers');
  }
  if (comp2.state.authStatus === 'authenticated') {
    throw new Error('Only GET /api/v1/me/state may produce an authenticated status');
  }
  // The draft is still restored, so a returning user does not retype anything.
  if (comp2.state.regFirstName !== parsedDraft.regFirstName) {
    throw new Error('A returning user should find their draft answers restored');
  }
  console.log("✓ TEST 6 PASSED: Session resolves from the server; drafts survive a reload.");

  // =========================================================================
  // TEST 7, 8, 9: Header CTA Reactivity (JOIN <-> UPLOAD)
  // =========================================================================
  console.log("\n--- Running TEST 7, 8, 9: Header CTA Dynamic Behavior ---");
  // A seller-ready session, as the server would report it.
  comp._applyAccountState({
    state: 'SELLER_READY',
    isAuthenticated: true,
    capabilities: { canPurchase: true, canCreateListing: true, canPublishListing: true, canUploadListingMedia: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'READY', storeId: 'store_1' },
    user: { id: 'usr_1', firstName: 'Rostand', lastName: 'Tchuekam' }
  });

  let v = comp.renderVals();
  if (v.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected 'Sell on LOUMOO', got '${v.ctaLabel}'`);
  }
  if (v.canCreateListing !== true) {
    throw new Error('A seller-ready account must be shown as able to create listings');
  }
  v.ctaAction();
  if (comp.state.screen !== 'upload') {
    throw new Error(`Expected navigation to 'upload', got '${comp.state.screen}'`);
  }
  console.log("✓ TEST 9 PASSED: Upload opens listing creation for a seller-ready account.");

  // Sign out
  v.signOut();
  v = comp.renderVals();
  if (v.ctaLabel !== 'Join LOUMOO') {
    throw new Error(`Expected 'Join LOUMOO', got '${v.ctaLabel}'`);
  }
  console.log("✓ TEST 7 PASSED: JOIN label returns on logout.");

  // Sign in.
  // The affordance navigates to the real sign-in screen; it cannot itself make
  // the application signed in. Only an account state supplied by the server
  // can do that, so that is what is applied here.
  v.signIn();
  v = comp.renderVals();
  if (v.ctaLabel !== 'Join LOUMOO') {
    throw new Error(`Tapping sign-in must not authenticate the app; got '${v.ctaLabel}'`);
  }

  comp._applyAccountState({
    state: 'SELLER_READY',
    isAuthenticated: true,
    capabilities: { canPurchase: true, canCreateListing: true, canPublishListing: true },
    contact: { emailVerified: true, phoneVerified: false, phoneVerificationAvailable: false },
    onboarding: { status: 'COMPLETED', percentage: 100, nextStep: null, steps: [] },
    seller: { status: 'READY', storeId: 'store_1' },
    user: { id: 'usr_1', firstName: 'Rostand', lastName: 'Tchuekam' }
  });
  v = comp.renderVals();
  if (v.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected 'Sell on LOUMOO', got '${v.ctaLabel}'`);
  }
  console.log("✓ TEST 8 PASSED: UPLOAD label returns once the SERVER reports a session.");

  console.log("\n======================================================================");
  console.log("  ALL 10 ONBOARDING & RUNTIME TEST MATRIX SCENARIOS PASSED 100%!");
  console.log("======================================================================\n");
} catch (e) {
  console.error("Runtime test error:", e);
  process.exit(1);
}
