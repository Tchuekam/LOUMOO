const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { readFrontendSource } = require('../helpers/frontendSource');

console.log('Testing LOUMOO Travel Mobile-First Redesign Assertions...');

const htmlPath = path.join(__dirname, '../../Commerce App.dc.html');
const html = readFrontendSource();

// 1. Check Travel Hub (is.travel) exists and has balanced tag
assert(html.includes('<sc-if value="{{ is.travel }}">'), 'is.travel conditional must be present');

// 2. Curated Excursions Horizontal Rail
const curatedSectionMatch = html.match(/Curated Excursions[\s\S]*?(?=<!-- ── 3\. POPULAR STAYS)/i);
assert(curatedSectionMatch, 'Curated Excursions section must be present');
const curatedSection = curatedSectionMatch[0];

assert(curatedSection.includes('travel-rail'), 'Curated Excursions must use horizontal travel-rail');
const excursionCards = curatedSection.match(/class="travel-card-compact"/g);
assert(excursionCards && excursionCards.length >= 4, 'Curated excursions must have at least 4 compact cards for horizontal swipe');

// Verify cards do NOT have paragraphs or giant CTA buttons
assert(!curatedSection.includes('<p>'), 'Curated excursions must not contain paragraph elements');
assert(!curatedSection.includes('btn-block'), 'Curated cards must not have oversized block buttons');

// 3. Popular Stays Horizontal Rail in is.travel
const popularStaysMatch = html.match(/Popular stays[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
assert(popularStaysMatch, 'Popular stays section must be present in Travel hub');
assert(popularStaysMatch[0].includes('hotel-card-compact'), 'Popular stays must use compact hotel cards');

// 4. Hotel Search (is.hotelSearch) — premium discovery redesign
const hotelSearchMatch = html.match(/<sc-if value="\{\{ is\.hotelSearch \}\}">([\s\S]*?)(?=<sc-if value="\{\{ is\.hotelDetail \}\}">)/);
assert(hotelSearchMatch, 'is.hotelSearch conditional must be present');
const hotelSearchContent = hotelSearchMatch[1];

assert(!hotelSearchContent.includes('height:240px'), 'Hotel search must NOT contain oversized 240px stacked cards');
assert(hotelSearchContent.includes('travel-rail'), 'Hotel search must contain a horizontal Popular Stays discovery rail');
assert(hotelSearchContent.includes('hotel-card-compact'), 'Hotel search Popular Stays rail must use compact hotel cards');
// The old compact "scan rows" were replaced by premium, spacious result cards
// in a responsive grid (1-col mobile → multi-col desktop).
assert(!hotelSearchContent.includes('hotel-row-compact'), 'Obsolete compact scan rows must be gone');
assert(hotelSearchContent.includes('hotel-result-grid'), 'Verified stays must use the premium result grid');
assert(hotelSearchContent.includes('hotel-result-card'), 'Verified stays must use premium result cards');
// A polished, recoverable empty state (not a blank page).
assert(hotelSearchContent.includes('hotelListEmpty'), 'Hotel search must keep a polished empty state');

// 5. Visual Fatigue Prevention - Text-Led Section
assert(html.includes('Weekend Escapes'), 'Weekend Escapes text-led section must be present for visual rhythm');
assert(html.includes('CONSULAR DESK'), 'Consular desk advisory card must be present');

// 6. Hotel Detail — editorial hero + dedicated mobile/desktop layouts
const hotelDetailMatch = html.match(/<sc-if value="\{\{ is\.hotelDetail \}\}">([\s\S]*?)(?=<sc-if value="\{\{ is\.hotelBooking \}\}">)/);
assert(hotelDetailMatch, 'is.hotelDetail conditional must be present');
const hotelDetailContent = hotelDetailMatch[1];
// Desktop and mobile are two intentional compositions, not one scaled hero.
assert(hotelDetailContent.includes('hotel-hero--mobile'), 'Hotel detail must have a dedicated mobile hero');
assert(hotelDetailContent.includes('hotel-hero--desktop'), 'Hotel detail must have a dedicated desktop hero');
assert(hotelDetailContent.includes('hotel-detail-grid'), 'Hotel detail must use the two-column (content + booking) desktop grid');
// Sticky mobile reserve bar with safe-area handling.
assert(hotelDetailContent.includes('hotel-mobile-reserve'), 'Hotel detail must keep a sticky mobile reserve bar');
assert(hotelDetailContent.includes('hotel-booking-panel'), 'Hotel detail must expose a desktop booking panel');
// The fake 360° viewer (image + pan controls + scene chips) must be gone; real
// external virtual tours are opened via a validated handler instead.
['hotelVirtualTourImage', 'hotelVirtualScene', 'prevVirtualScene', 'nextVirtualScene', 'setVirtualScene'].forEach(dead => {
  assert(!hotelDetailContent.includes(dead), `Fake 360 control "${dead}" must be removed`);
});
assert(hotelDetailContent.includes('openHotelVirtualTour'), 'Real external virtual-tour handler must be wired');

// 7. Line Clamping & Typography utilities
assert(html.includes('class="lc-1"'), 'Line clamping utility lc-1 must be used');
assert(html.includes('font-size:15px') || html.includes('font:700 13px'), 'Compact typography must be used');

// 8. Style Tag Master Inlining Check
assert(html.includes('.travel-rail {') && html.includes('flex-direction: row'), 'travel-rail CSS rule must exist in master <style>');
assert(html.includes('.travel-card-compact {') && html.includes('flex: 0 0 185px'), 'travel-card-compact CSS rule must exist in master <style>');
assert(html.includes('.card-img-wrap {') && html.includes('max-height: 110px'), 'card-img-wrap CSS rule must exist in master <style>');
assert(html.includes('.travel-corridor-card {') && html.includes('flex: 0 0 155px'), 'travel-corridor-card CSS rule must exist in master <style>');

console.log('✓ TEST 1 PASSED: Curated excursions horizontal rail with 4+ compact cards verified');
console.log('✓ TEST 2 PASSED: Absence of paragraphs and oversized CTAs inside cards verified');
console.log('✓ TEST 3 PASSED: Popular Stays rail present with compact hotel cards');
console.log('✓ TEST 4 PASSED: Hotel search upgraded to premium result grid; obsolete scan rows removed');
console.log('✓ TEST 5 PASSED: Text-led sections present for visual rhythm');
console.log('✓ TEST 6 PASSED: Editorial hero with dedicated mobile/desktop layouts; fake 360 removed');
console.log('✓ TEST 7 PASSED: Master stylesheet contains .travel-rail, .travel-card-compact, .card-img-wrap rules');
console.log('\n======================================================================');
console.log('  ALL MOBILE-FIRST TRAVEL REDESIGN INTEGRITY TESTS PASSED 100%!');
console.log('======================================================================');
