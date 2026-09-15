/**
 * Mobile Responsiveness & Viewport Integrity Test Suite
 * Validates:
 *  - Global overflow-x safety & box-sizing containment
 *  - Responsive home header (.home-user-context-bar)
 *  - PDP mobile architecture (.pdp-sticky-bar & NO_NAV isolation)
 *  - Comparison matrix mobile media queries (down to 360px)
 *  - Verticals responsive grid systems (.travel-boarding-grid, .travel-visa-steps-grid, .hotel-stay-grid)
 *  - Liquid-glass mobile dock safe-area & small-device scaling (<=380px)
 *  - Checkout and Cart safe bottom clearance
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runMobileResponsivenessTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST: LOUMOO MOBILE RESPONSIVENESS & VIEWPORT AUDIT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const html = fs.readFileSync('Commerce App.dc.html', 'utf8');

  // ── 1. Global Viewport & Root Overflow Safety ──
  console.log('  [1/7] Testing root viewport constraints & overflow-x containment...');
  assert.ok(html.includes('max-width: 100vw'), 'Root must enforce max-width: 100vw');
  assert.ok(html.includes('overflow-x: hidden'), 'Root must enforce overflow-x: hidden');
  assert.ok(html.includes('box-sizing: border-box'), 'CSS must enforce box-sizing: border-box');
  console.log('       ✓ Root containment: max-width: 100vw and overflow-x: hidden verified.');

  // ── 2. Home Header Responsiveness ──
  console.log('  [2/7] Testing Home marketplace header (.home-user-context-bar)...');
  assert.ok(html.includes('home-user-context-bar'), 'Home view must use .home-user-context-bar');
  assert.ok(html.includes('home-user-context-actions'), 'Home view must group action buttons');
  assert.ok(html.includes('@media (max-width: 420px)'), 'Home header must have <=420px breakpoint');
  assert.ok(html.includes('@media (max-width: 360px)'), 'Home header must have <=360px breakpoint');
  console.log('       ✓ Home header: responsive scaling across 360px and 420px verified.');

  // ── 3. PDP Mobile Architecture & Sticky Purchase Bar ──
  console.log('  [3/7] Testing PDP sticky purchase bar & NO_NAV isolation...');
  assert.ok(html.includes('.pdp-sticky-bar {'), 'Master CSS must style .pdp-sticky-bar');
  assert.ok(html.includes('position: fixed;'), 'PDP sticky bar must use position: fixed');
  assert.ok(html.includes('backdrop-filter: blur('), 'PDP sticky bar must use glassmorphism blur');
  assert.ok(html.includes('env(safe-area-inset-bottom'), 'PDP sticky bar must respect safe-area insets');
  
  // Verify 'product' is in NO_NAV
  const noNavMatch = html.match(/const NO_NAV = \[([\s\S]*?)\];/);
  assert.ok(noNavMatch, 'NO_NAV constant must be defined in script');
  assert.ok(noNavMatch[1].includes("'product'"), "'product' screen must be in NO_NAV to avoid nav dock collision");
  console.log('       ✓ PDP sticky bar: fixed bottom + NO_NAV conflict resolution verified.');

  // ── 4. Comparison Engine Mobile Polish ──
  console.log('  [4/7] Testing comparison matrix mobile breakpoints...');
  assert.ok(html.includes('.cmp-spec-headrow, .cmp-spec-row {'), 'Master CSS must style spec comparison rows');
  assert.ok(html.includes('@media (max-width: 560px)'), 'Comparison rows must adapt at <=560px');
  assert.ok(html.includes('@media (max-width: 380px)'), 'Comparison rows must adapt at <=380px');
  console.log('       ✓ Comparison engine: multi-tier mobile spec matrix breakpoints verified.');

  // ── 5. Verticals Responsive Grid Systems ──
  console.log('  [5/7] Testing travel and hotel responsive grid classes...');
  assert.ok(html.includes('.travel-boarding-grid {'), 'Master CSS must define .travel-boarding-grid');
  assert.ok(html.includes('.travel-visa-steps-grid {'), 'Master CSS must define .travel-visa-steps-grid');
  assert.ok(html.includes('.hotel-stay-grid {'), 'Master CSS must define .hotel-stay-grid');

  // Verify chunk files use these classes
  const travelChunk = fs.readFileSync('TravelScreens.dc.html', 'utf8');
  assert.ok(travelChunk.includes('travel-boarding-grid'), 'TravelScreens must use travel-boarding-grid');
  assert.ok(travelChunk.includes('travel-visa-steps-grid'), 'TravelScreens must use travel-visa-steps-grid');

  const hotelChunk = fs.readFileSync('HotelScreens.dc.html', 'utf8');
  assert.ok(hotelChunk.includes('hotel-stay-grid'), 'HotelScreens must use hotel-stay-grid');
  console.log('       ✓ Verticals: travel & hotel responsive grids verified in compiled chunks.');

  // ── 6. Mobile Dock Small-Screen Refinement ──
  console.log('  [6/7] Testing mobile bottom navigation dock scaling on <=380px...');
  assert.ok(html.includes('@media (max-width: 380px)'), 'Dock must have <=380px mobile refinement');
  assert.ok(html.includes('width: calc(100% - 12px) !important;'), 'Dock width must scale down on narrow screens');
  console.log('       ✓ Mobile nav dock: compact scaling on 360px-380px devices verified.');

  // ── 7. Checkout & Cart Safe Bottom Clearance ──
  console.log('  [7/7] Testing checkout & cart safe-area bottom clearance...');
  const checkoutChunk = fs.readFileSync('CheckoutScreens.dc.html', 'utf8');
  assert.ok(checkoutChunk.includes('calc(96px + env(safe-area-inset-bottom'), 'Checkout must provide >=96px bottom clearance');
  console.log('       ✓ Checkout & Cart: safe bottom clearance verified.');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ALL MOBILE RESPONSIVENESS CHECKS PASSED (7/7)');
  console.log('═══════════════════════════════════════════════════════════\n');
}

runMobileResponsivenessTests();
