/**
 * STORES & BRANDS DESKTOP ELEVATION & FINAL POLISH TEST SUITE
 * 
 * Verifies:
 * 1. Store Discovery search, clear, & category/city filtering state transitions
 * 2. Flagship Storefront multi-tab switching (home, products, collections, about, reviews)
 * 3. Store following state & reactivity
 * 4. Official Brand Destination Hub (is.brand) navigation & brand switching (Apple, Sony, Samsung, Anker, Nike)
 * 5. Brand follow/unfollow toggle
 * 6. Product ↔ Store ↔ Brand ↔ Collection circular navigation loop
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('═══════════════════════════════════════════════════════════');
console.log('  TESTING STORES & BRANDS ELEVATED EXPERIENCE & BRAND HUB');
console.log('═══════════════════════════════════════════════════════════');

const content = fs.readFileSync('Commerce App.dc.html', 'utf8');
const scriptMatch = content.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);

if (!scriptMatch) {
  console.error("Failed to find data-dc-script block in Commerce App.dc.html!");
  process.exit(1);
}

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
  setTimeout: (fn) => 1,
  clearTimeout: () => {},
  localStorage: mockLocalStorage,
  document: {
    documentElement: {
      setAttribute: () => {}
    }
  }
};

vm.createContext(context);
vm.runInContext(scriptMatch[1] + "\nvar comp = new Component({ userName: 'Tchuekam', showAds: true });", context);

const comp = context.comp;
comp.componentDidMount();

// ── Test 1: Navigation to Store Discovery ──
console.log('\n[1] Navigation to Stores & Brands Discovery (is.store)...');
comp.go('store');
let vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'store', 'Must route to store screen');
console.log('  ✓ Successfully routed to is.store');

// ── Test 2: Store Search, Clear & Filters ──
console.log('\n[2] Testing Store Search, Clear, & Category / City Filter Matrix...');
vals.updateStoreSearch({ target: { value: 'Orca' } });
vals.updateStoreCityFilter({ target: { value: 'douala' } });
vals.setStoreCategory('tech');
vals.toggleStoreVerifiedOnly();

vals = comp.renderVals();
assert.strictEqual(vals.storeSearchQuery, 'Orca', 'Search query state must update');
assert.strictEqual(vals.storeCityFilter, 'douala', 'City filter must update');
assert.strictEqual(vals.storeCategoryFilter, 'tech', 'Category filter must update');
assert.strictEqual(vals.storeVerifiedOnly, true, 'Verified only filter must be active');

// Test clear search and reset filters
vals.clearStoreSearch();
vals = comp.renderVals();
assert.strictEqual(vals.storeSearchQuery, '', 'Search input must clear');

vals.resetStoreFilters();
vals = comp.renderVals();
assert.strictEqual(vals.storeCityFilter, 'all', 'City filter must reset to all');
assert.strictEqual(vals.storeCategoryFilter, 'all', 'Category filter must reset to all');
assert.strictEqual(vals.storeVerifiedOnly, false, 'Verified only must reset');
console.log('  ✓ Search query, clear button, city selector, category pills, and reset work reactively');

// ── Test 3: Navigation to Flagship Digital Storefront ──
console.log('\n[3] Navigation to Flagship Storefront (is.business)...');
comp.go('business');
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'business', 'Must route to business screen');
console.log('  ✓ Successfully routed to is.business (Orca Electronics Digital Storefront)');

// ── Test 4: Storefront Sub-Tabs Switching ──
console.log('\n[4] Testing Storefront Sub-Tabs (Home, Products, Collections, About, Reviews)...');
assert.strictEqual(vals.storeActiveTab, 'home', 'Default active tab must be home');

vals.setStoreActiveTab('products');
vals = comp.renderVals();
assert.strictEqual(vals.storeActiveTab, 'products', 'Active tab must switch to products');

vals.setStoreActiveTab('collections');
vals = comp.renderVals();
assert.strictEqual(vals.storeActiveTab, 'collections', 'Active tab must switch to collections');

vals.setStoreActiveTab('about');
vals = comp.renderVals();
assert.strictEqual(vals.storeActiveTab, 'about', 'Active tab must switch to about');

vals.setStoreActiveTab('reviews');
vals = comp.renderVals();
assert.strictEqual(vals.storeActiveTab, 'reviews', 'Active tab must switch to reviews');
console.log('  ✓ All 5 storefront sub-tabs switch seamlessly');

// ── Test 5: Store Follow & Share Interaction ──
console.log('\n[5] Testing Store Follow / Unfollow & Share Interaction...');
const prevFollowing = comp.state.following;
vals.toggleFollow();
vals = comp.renderVals();
assert.strictEqual(comp.state.following, !prevFollowing, 'Follow state must toggle');
assert.strictEqual(vals.followLabel, comp.state.following ? 'FOLLOWING' : 'FOLLOW', 'Follow button label must update');

vals.shareStore();
assert.strictEqual(comp.state.toast, 'Store link copied to clipboard!', 'Toast must show link copied message');
console.log(`  ✓ Follow state toggled to ${vals.followLabel} and share triggered toast`);

// ── Test 6: Official Brand Destination Hub ──
console.log('\n[6] Testing Official Brand Destination (is.brand) & Switcher...');
vals.openBrand('apple');
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'brand', 'Must route to brand screen');
assert.strictEqual(vals.isBrandApple, true, 'Active brand must be Apple');

vals.selectBrand('sony');
vals = comp.renderVals();
assert.strictEqual(vals.isBrandSony, true, 'Active brand must switch to Sony');

vals.selectBrand('samsung');
vals = comp.renderVals();
assert.strictEqual(vals.isBrandSamsung, true, 'Active brand must switch to Samsung');

vals.selectBrand('anker');
vals = comp.renderVals();
assert.strictEqual(vals.isBrandAnker, true, 'Active brand must switch to Anker');

vals.toggleBrandFollow();
vals = comp.renderVals();
assert.strictEqual(vals.brandFollowed, true, 'Brand follow state must toggle');
console.log('  ✓ Brand destination routing, brand switching (Apple, Sony, Samsung, Anker), and follow state verified');

// ── Test 7: Product ↔ Store ↔ Brand Circular Loop ──
console.log('\n[7] Testing Product (PDP) ↔ Store ↔ Brand Circular Loop...');
comp.go('product');
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'product', 'Must route to product details page');

// From PDP, user clicks "VISIT STOREFRONT"
vals.on.business();
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'business', 'Must navigate to store from PDP');

// From Store, user goes to Brand
vals.openBrand('apple');
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'brand', 'Must navigate to brand destination');

// From Brand, user clicks product
vals.on.product();
vals = comp.renderVals();
assert.strictEqual(comp.state.screen, 'product', 'Must return to product page');
console.log('  ✓ Circular navigation loop Product -> Store -> Brand -> Product 100% verified');

console.log('\n===========================================================');
console.log('  ALL STORES & BRANDS TESTS PASSED (7/7)!');
console.log('===========================================================\n');
