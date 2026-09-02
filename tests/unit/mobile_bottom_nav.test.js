const fs = require('fs');
const assert = require('assert');

console.log('Testing LOUMOO Liquid Glass Mobile Bottom Navigation Component & Styles...');

const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

// 1. Verify that .bottom-nav-mobile contains all 7 navigation items
assert.ok(html.includes('class="bottom-nav-mobile"'), 'bottom-nav-mobile container must be present in compiled HTML');
assert.ok(html.includes('aria-label="Go to Home"'), 'Home button must be present');
assert.ok(html.includes('aria-label="Go to Stores"'), 'Store button must be present');
assert.ok(html.includes('aria-label="Go to Compare"'), 'Compare button must be present');
assert.ok(html.includes('aria-label="{{ navUploadLabel }}"'), 'Center upload action button must be present');
assert.ok(html.includes('aria-label="Go to Travel"'), 'Travel button must be present');
assert.ok(html.includes('aria-label="Go to Announcements"'), 'Announce button must be present');
assert.ok(html.includes('aria-label="Go to Profile"'), 'Profile button must be present');

console.log('✓ TEST 1 PASSED: All 7 liquid glass navigation buttons are present with correct aria-labels.');

// 2. Verify Liquid Glass CSS properties
assert.ok(html.includes('backdrop-filter: blur(24px) saturate(160%)'), 'Backdrop blur & saturation filter must be present');
assert.ok(html.includes('border-radius: 9999px'), 'Floating pill shape with rounded border-radius must be present');
assert.ok(html.includes('.bottom-nav-mobile::before'), 'Glass reflection pseudo-element must be present');
assert.ok(html.includes('lm-nav-indicator'), 'Active indicator capsule class must be present');

console.log('✓ TEST 2 PASSED: Liquid Glass CSS material, reflection, and active indicator rules verified.');

// 3. Verify Elevated Center '+' Button
assert.ok(html.includes('.bottom-nav-mobile .nav-upload-btn'), 'Center floating action button styles must be scoped under .bottom-nav-mobile');
assert.ok(html.includes('linear-gradient(145deg, #3b9cff, #0878f9 50%, #005de8)'), 'Center FAB gradient verified');

console.log('✓ TEST 3 PASSED: Center elevated action button styles and gradient verified.');

// 4. Verify Desktop Isolation
assert.ok(html.includes('.bottom-nav-mobile { display: none !important; }') || html.includes('.status-bar, .bottom-nav-mobile { display: none !important; }') || html.includes('.bottom-nav-mobile {\n    display: none !important;\n  }'), 'Desktop breakpoint must strictly hide mobile bottom nav');

console.log('✓ TEST 4 PASSED: Desktop isolation confirmed — bottom nav hidden on desktop (≥1024px).');

// 5. Verify State Getters in Component Runtime
const vm = require('vm');
const scriptMatch = html.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Component script block must exist');

const context = {
  DCLogic: class {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(fnOrObj, cb) {
      if (typeof fnOrObj === 'function') this.state = Object.assign({}, this.state, fnOrObj(this.state));
      else this.state = Object.assign({}, this.state, fnOrObj);
      if (typeof cb === 'function') cb();
    }
  },
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  localStorage: { store: {}, getItem() { return null; }, setItem() {}, removeItem() {} },
  document: { documentElement: { setAttribute() {} } }
};

vm.createContext(context);
vm.runInContext(scriptMatch[1] + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });", context);

const comp = context.comp;
comp.componentDidMount();

let vals = comp.renderVals();
assert.strictEqual(vals.isNavHome, true, 'Home must be active on initial screen');
assert.strictEqual(vals.isNavStore, false, 'Store must be inactive on initial screen');
assert.strictEqual(vals.isNavVs, false, 'Compare must be inactive on initial screen');

comp.go('store');
vals = comp.renderVals();
assert.strictEqual(vals.isNavHome, false, 'Home must be inactive on store screen');
assert.strictEqual(vals.isNavStore, true, 'Store must be active on store screen');

comp.go('vsCompare');
vals = comp.renderVals();
assert.strictEqual(vals.isNavVs, true, 'Compare must be active on vsCompare screen');

comp.go('travel');
vals = comp.renderVals();
assert.strictEqual(vals.isNavTravel, true, 'Travel must be active on travel screen');

comp.go('announce');
vals = comp.renderVals();
assert.strictEqual(vals.isNavAnnounce, true, 'Announce must be active on announce screen');

comp.go('profile');
vals = comp.renderVals();
assert.strictEqual(vals.isNavProfile, true, 'Profile must be active on profile screen');

console.log('✓ TEST 5 PASSED: Dynamic active state switches verified across all screens.');

console.log('\n======================================================================');
console.log('  ALL MOBILE BOTTOM NAVBAR TESTS PASSED 100%');
console.log('======================================================================\n');
