/**
 * Unit Test: Authenticated UI State & Get Started Banner Disappearance
 */

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

async function run() {
  console.log('  Testing Authenticated UI State & Get Started Banner Visibility...');

  const content = fs.readFileSync('Commerce App.dc.html', 'utf8');
  const scriptMatch = content.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(scriptMatch, 'Must find data-dc-script block');

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
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); },
      removeItem(k) { delete this.store[k]; }
    },
    document: { documentElement: { setAttribute: () => {} } }
  };

  vm.createContext(context);
  vm.runInContext(scriptCode + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });", context);
  const comp = context.comp;

  // 1. Initial default state (Logged in) -> Get Started must be hidden
  let vals = comp.renderVals();
  assert.strictEqual(comp.state.isLoggedIn, true);
  assert.strictEqual(vals.showGetStarted, false, 'Get Started banner must be hidden when logged in');

  // 2. Sign out -> Get Started banner must reappear
  vals.signOut();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.isLoggedIn, false);
  assert.strictEqual(vals.showGetStarted, true, 'Get Started banner must be visible when logged out');

  // 3. Sign in -> Get Started banner must disappear immediately
  vals.signIn();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.isLoggedIn, true);
  assert.strictEqual(vals.showGetStarted, false, 'Get Started banner must disappear immediately after sign-in');

  // 4. Complete onboarding -> Get Started banner must remain hidden
  vals.signOut();
  vals = comp.renderVals();
  vals.completeOnboarding();
  vals = comp.renderVals();
  assert.strictEqual(comp.state.isLoggedIn, true);
  assert.strictEqual(vals.showGetStarted, false, 'Get Started banner must remain hidden after completeOnboarding');

  console.log('    ✓ Authenticated UI & Get Started banner visibility tests passed.');
}

module.exports = { run };
