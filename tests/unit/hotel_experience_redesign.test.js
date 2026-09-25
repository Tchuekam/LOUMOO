/**
 * LOUMOO — Premium Hotel Experience Redesign Integrity Suite
 * ---------------------------------------------------------------------------
 * Guards the frontend contract of the redesigned Travel > Hotels vertical:
 *  • dedicated mobile + desktop layouts (two intentional compositions)
 *  • premium discovery/search, detail hero, rooms, spaces, booking
 *  • REAL external virtual tours (validated URL, safe new-tab navigation)
 *    with NO fake 360° viewer / pan controls / scene chips left behind
 *  • the existing booking flow (selectHotelRoomId → openHotelBooking) intact
 *  • responsive safety (breakpoints, safe-area) and loading/error/empty states
 *
 * Scope is hotel-only; it must not assert anything about other verticals.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '../..');
const shell = fs.readFileSync(path.join(ROOT, 'Commerce App.dc.html'), 'utf8');
const hotel = fs.readFileSync(path.join(ROOT, 'HotelScreens.dc.html'), 'utf8');
const hotelCss = fs.readFileSync(path.join(ROOT, 'src', 'styles', 'hotel.css'), 'utf8');

console.log('Testing LOUMOO Premium Hotel Experience Redesign...');

// ── 1. All four hotel screens still exist and the chunk is well-formed ──
['is.hotelSearch', 'is.hotelDetail', 'is.hotelBooking', 'is.hotelVoucher'].forEach(s => {
  assert(hotel.includes(s), `Hotel chunk must contain ${s}`);
});
const opens = (hotel.match(/<sc-if\b/g) || []).length;
const closes = (hotel.match(/<\/sc-if>/g) || []).length;
assert.strictEqual(opens, closes, `Every <sc-if> in the hotel chunk must be balanced (${opens} vs ${closes})`);
console.log('  ✓ [1] Four hotel screens present; sc-if balanced');

// ── 2. The shell links the dedicated, hotel-scoped stylesheet ──
assert(shell.includes('href="./src/styles/hotel.css"'), 'Shell must load the hotel stylesheet');
assert(fs.existsSync(path.join(ROOT, 'public', 'src', 'styles', 'hotel.css')), 'hotel.css must be published to public/');
console.log('  ✓ [2] Hotel stylesheet linked and published');

// ── 3. Dedicated desktop AND mobile layouts (not one scaled to the other) ──
['hotel-hero--mobile', 'hotel-hero--desktop', 'hotel-detail-grid', 'hotel-booking-panel', 'hotel-mobile-reserve']
  .forEach(cls => assert(hotel.includes(cls), `Hotel detail must use ${cls}`));
// The stylesheet must actually distinguish the two at the 1024px breakpoint.
assert(hotelCss.includes('@media (min-width: 1024px)'), 'hotel.css must define a >=1024px desktop layout');
assert(hotelCss.includes('@media (min-width: 768px) and (max-width: 1023px)'), 'hotel.css must define tablet behaviour');
assert(/\.hotel-hero--desktop\s*\{\s*display:\s*none/.test(hotelCss), 'Desktop hero must be hidden on mobile by default');
assert(/\.hotel-booking-panel\s*\{\s*display:\s*none/.test(hotelCss), 'Desktop booking panel must be hidden on mobile by default');
console.log('  ✓ [3] Dedicated mobile & desktop layouts with real breakpoints');

// ── 4. Narrow-phone safeguards + safe-area handling (no overflow, no clipping) ──
['@media (max-width: 420px)', '@media (max-width: 380px)', '@media (max-width: 360px)']
  .forEach(bp => assert(hotelCss.includes(bp), `hotel.css must handle ${bp}`));
assert(hotelCss.includes('env(safe-area-inset-bottom'), 'Sticky reserve bar must respect safe-area-inset-bottom');
assert(hotelCss.includes('overflow-x: hidden'), 'Hotel shells must guard against horizontal overflow');
assert(hotelCss.includes('prefers-reduced-motion'), 'Hotel motion must respect prefers-reduced-motion');
console.log('  ✓ [4] Narrow-phone breakpoints, safe-area & reduced-motion honoured');

// ── 5. Premium discovery/search & rooms ──
assert(hotel.includes('hotel-result-grid') && hotel.includes('hotel-result-card'), 'Search must use premium result cards');
assert(hotel.includes('hotel-room-grid') && hotel.includes('hotel-room-card'), 'Detail must use premium room cards');
assert(hotel.includes('hotel-skeleton-card') || hotel.includes('hotel-skel'), 'Loading states must use layout-preserving skeletons');
assert(hotel.includes('selectHotelRoomId'), 'Room selection (selectHotelRoomId) must be preserved');
assert(hotel.includes('openHotelBooking'), 'Booking entry (openHotelBooking) must be preserved');
console.log('  ✓ [5] Premium search & room cards; booking flow preserved');

// ── 6. REAL external virtual tours, gated by a validated URL ──
// Every tour CTA is opened through the validated handler...
assert(hotel.includes('openHotelVirtualTour'), 'Virtual-tour CTA must call the external handler');
// ...and is only rendered when a URL exists (hotel / room / space guards).
['hotelDetailCard.hasVirtualTour', 'room.hasVirtualTour', 'space.hasVirtualTour']
  .forEach(g => assert(hotel.includes(g), `Virtual-tour CTA must be guarded by ${g}`));
// The handler validates https + host and opens a new, isolated tab.
assert(shell.includes('openHotelVirtualTour'), 'openHotelVirtualTour must be defined in the runtime');
assert(shell.includes("window.open(u, '_blank', 'noopener,noreferrer')"), 'External tour must open with _blank + noopener,noreferrer');
assert(shell.includes('readTourUrl'), 'A URL reader/validator (readTourUrl) must exist');
assert(/https:\\\/\\\/|https:\/\//.test(shell), 'Tour URL validation must require an https URL');
console.log('  ✓ [6] External virtual tours: validated URL, safe new-tab, guarded CTA');

// ── 7. No fake 360° viewer / pan controls / scene chips anywhere ──
['hotelVirtualTourImage', 'hotelVirtualScene', 'hotelVirtualTourSceneTitle', 'prevVirtualScene', 'nextVirtualScene', 'setVirtualScene', 'VISITE VIRTUELLE', 'Pan Left', 'Pan Right']
  .forEach(dead => {
    assert(!hotel.includes(dead), `Obsolete fake-360 artefact "${dead}" must be removed from the hotel chunk`);
    assert(!shell.includes(dead), `Obsolete fake-360 artefact "${dead}" must be removed from the shell`);
  });
console.log('  ✓ [7] All fake-360 controls removed (chunk + shell)');

// ── 8. Favourite & share actions present (compact, accessible icon buttons) ──
assert(hotel.includes('toggleHotelFavorite'), 'Favourite action must be present');
assert(hotel.includes('shareHotelDetail'), 'Share action must be present');
assert(hotel.includes('aria-label="Save to favourites"') && hotel.includes('aria-label="Share this stay"'),
  'Favourite & share buttons must carry accessible labels');
console.log('  ✓ [8] Favourite & share icon actions present and labelled');

console.log('\n======================================================================');
console.log('  ALL PREMIUM HOTEL EXPERIENCE REDESIGN TESTS PASSED');
console.log('======================================================================');
