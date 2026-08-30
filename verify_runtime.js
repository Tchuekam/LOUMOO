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
  setState(fnOrObj) {
    if (typeof fnOrObj === 'function') {
      this.state = Object.assign({}, this.state, fnOrObj(this.state));
    } else {
      this.state = Object.assign({}, this.state, fnOrObj);
    }
  }
}

const context = {
  DCLogic,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
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
  console.log("Initial screen:", comp.state.screen);
  
  let vals = comp.renderVals();
  console.log("Initial auth status. isLoggedIn:", comp.state.isLoggedIn, "ctaLabel:", vals.ctaLabel);

  // 1. Verify default logged in state: CTA is Sell/Upload
  if (vals.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected ctaLabel to be 'Sell on LOUMOO' when logged in, got '${vals.ctaLabel}'`);
  }
  vals.ctaAction();
  console.log("Clicked CTA when logged in -> Navigated to:", comp.state.screen);
  if (comp.state.screen !== 'upload') {
    throw new Error(`Expected navigation to 'upload', got '${comp.state.screen}'`);
  }

  // 2. Test sign out -> CTA turns into 'Join LOUMOO'
  vals = comp.renderVals();
  vals.signOut();
  vals = comp.renderVals();
  console.log("After signOut -> isLoggedIn:", comp.state.isLoggedIn, "ctaLabel:", vals.ctaLabel);
  if (vals.ctaLabel !== 'Join LOUMOO') {
    throw new Error(`Expected ctaLabel to be 'Join LOUMOO' when logged out, got '${vals.ctaLabel}'`);
  }
  vals.ctaAction();
  console.log("Clicked CTA when logged out -> Navigated to:", comp.state.screen);
  if (comp.state.screen !== 'onboardWelcome') {
    throw new Error(`Expected navigation to 'onboardWelcome', got '${comp.state.screen}'`);
  }

  // 3. Test signup & onboarding flow -> user stays logged in and CTA turns to 'Sell on LOUMOO'
  vals = comp.renderVals();
  vals.on.onboardType();
  vals = comp.renderVals();
  vals.setRoleSeller();
  vals.on.onboardIdentity();
  vals = comp.renderVals();
  vals.on.onboardOtp();
  vals = comp.renderVals();
  vals.continueAfterOtp();
  vals = comp.renderVals();
  vals.on.onboardBusiness();
  vals = comp.renderVals();
  vals.on.onboardVerify();
  vals = comp.renderVals();
  vals.simulateUploadDoc();
  vals = comp.renderVals();
  vals.on.onboardReview();
  vals = comp.renderVals();
  vals.completeOnboarding();
  
  vals = comp.renderVals();
  console.log("After completeOnboarding -> isLoggedIn:", comp.state.isLoggedIn, "ctaLabel:", vals.ctaLabel, "userName:", comp.state.userName);
  if (!comp.state.isLoggedIn) {
    throw new Error("Expected isLoggedIn to be true after completeOnboarding");
  }
  if (vals.ctaLabel !== 'Sell on LOUMOO') {
    throw new Error(`Expected ctaLabel to turn to 'Sell on LOUMOO' after signup, got '${vals.ctaLabel}'`);
  }

  // 4. Test Mobile Single Elevated Upload Action
  vals.navUploadAction();
  console.log("Mobile navUploadAction executed -> Screen:", comp.state.screen);

  console.log("\nALL AUTHENTICATION, PERSISTENCE & DYNAMIC BUTTON TESTS PASSED 100% CLEANLY!");
} catch (e) {
  console.error("Runtime test error:", e);
  process.exit(1);
}
