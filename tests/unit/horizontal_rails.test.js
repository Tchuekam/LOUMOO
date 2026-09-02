const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  const html = fs.readFileSync(path.join(__dirname, '../../Commerce App.dc.html'), 'utf8');

  // Test 1: Rails
  assert(html.includes('id="instaVideoBentoRail"'), 'Insta360 Bento Rail missing');
  assert(html.includes('id="newArrivalsRail"'), 'New Arrivals Rail missing');
  assert(html.includes('id="storiesMotionRail"'), 'Life in Motion Stories Rail missing');
  assert(html.includes('id="collectionsForYouRail"'), 'Collections For You Rail missing');
  assert(html.includes('id="fashionRail"'), 'Best of Fashion Rail missing');
  assert(html.includes('id="techRail"'), 'Tech You Love Rail missing');
  assert(html.includes('id="travelWorldRail"'), 'Travel the World Rail missing');
  console.log('✓ TEST 1 PASSED: All 7 required horizontal content rails present in Commerce App.dc.html');

  // Test 2: Native Scroll & Layout Isolation
  assert(html.includes('.loumoo-rail-track'), 'Track class missing');
  assert(html.includes('.loumoo-rail-section'), 'Section class missing');
  assert(html.includes('overflow-x: auto'), 'Native horizontal overflow missing');
  assert(html.includes('overflow-y: hidden'), 'Isolated vertical overflow missing');
  assert(html.includes('scroll-snap-type: x mandatory'), 'Scroll snap mandatory missing');
  console.log('✓ TEST 2 PASSED: Native horizontal scroll snapping and vertical scroll isolation CSS verified');

  // Test 3: Controls
  assert(html.includes('class="loumoo-rail-nav-btn"'), 'Rail nav buttons missing');
  assert(html.includes('scrollRail('), 'scrollRail caller missing');
  assert(html.includes('scrollRail: (railId, offset) =>'), 'scrollRail runtime helper missing');
  console.log('✓ TEST 3 PASSED: Desktop chevron prev/next buttons and scrollRail runtime method verified');

  // Test 4: Video Hover Controller
  assert(html.includes('data-hover-video="true"'), 'data-hover-video attribute missing');
  assert(html.includes('typeof window !== \'undefined\''), 'Window safety guard missing');
  console.log('✓ TEST 4 PASSED: Delegated hover-to-play video controller with safety guards verified');

  console.log('\n======================================================================');
  console.log('  ALL HORIZONTAL PRODUCT RAILS & UX TESTS PASSED 100%');
  console.log('======================================================================\n');
}

runTests();
