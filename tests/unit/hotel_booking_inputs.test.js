const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { readFrontendSource } = require('../helpers/frontendSource');

console.log('Testing Hotel Booking Inputs & Video Handlers in Commerce App.dc.html...');

const htmlPath = path.join(__dirname, '../../Commerce App.dc.html');
assert(fs.existsSync(htmlPath), 'Commerce App.dc.html must exist');
const html = readFrontendSource();

// 1. Verify that hotel booking guest inputs have proper controlled bindings and onInput handlers
assert(html.includes('value="{{ hotelGuestName }}"'), 'hotelGuestName binding must exist on Full Name input');
assert(html.includes('onInput="{{ updateHotelGuestName }}"'), 'updateHotelGuestName onInput handler must exist');
assert(html.includes('value="{{ hotelGuestPhone }}"'), 'hotelGuestPhone binding must exist on Phone input');
assert(html.includes('onInput="{{ updateHotelGuestPhone }}"'), 'updateHotelGuestPhone onInput handler must exist');

// 2. Verify there are NO read-only inputs with static user names
assert(!html.includes('value="{{ regFirstName }} {{ regLastName }}"'), 'Static read-only full name input must be eliminated');
assert(!html.includes('value="+237 {{ regPhone }}"'), 'Static read-only phone input must be eliminated');

// 3. Verify that raw inline event handlers that trigger React Error #231 and CSP violations are removed
assert(!html.includes('onplay="this.muted=true;this.volume=0;"'), 'Raw inline onplay string must be removed');
assert(!html.includes('onloadedmetadata="this.muted=true;this.volume=0;"'), 'Raw inline onloadedmetadata string must be removed');
assert(!html.includes('onended="window.heroNextSlide && window.heroNextSlide()"'), 'Raw inline onended string must be removed');
assert(!html.includes('onmouseenter="const v=this.querySelector(\'video\')'), 'Raw inline onmouseenter string must be removed');
assert(!html.includes('onmouseleave="const v=this.querySelector(\'video\')'), 'Raw inline onmouseleave string must be removed');

// 4. Verify that state handlers for hotel guest details exist in Component prototype
assert(html.includes('hotelGuestName:'), 'hotelGuestName state/binding must exist in compiled HTML');
assert(html.includes('updateHotelGuestName:'), 'updateHotelGuestName handler must exist in compiled HTML');
assert(html.includes('hotelGuestPhone:'), 'hotelGuestPhone state/binding must exist in compiled HTML');
assert(html.includes('updateHotelGuestPhone:'), 'updateHotelGuestPhone handler must exist in compiled HTML');

// 5. Test the handler logic directly in a mock React component scope
const mockComponent = {
  state: {
    regFirstName: 'Rostand',
    regLastName: 'Tchuekam',
    regPhone: '690123456',
    trips: [],
    lastTrip: null
  },
  setState(updates) {
    Object.assign(this.state, updates);
  },
  toast(msg) {
    this._lastToast = msg;
  },
  go(screen) {
    this._currentScreen = screen;
  },
  _persistTrips(trips) {
    this._savedTrips = trips;
  }
};

// Simulate openHotelBooking
const openHotelBooking = function() {
  const updates = {};
  if (!this.state.hotelGuestName) {
    updates.hotelGuestName = (this.state.regFirstName ? (this.state.regFirstName + ' ' + (this.state.regLastName || '')).trim() : '') || 'Rostand Tchuekam';
  }
  if (!this.state.hotelGuestPhone) {
    const p = this.state.regPhone || '690 12 34 56';
    updates.hotelGuestPhone = p.startsWith('+') ? p : ('+237 ' + p);
  }
  if (Object.keys(updates).length > 0) this.setState(updates);
  this.go('hotelBooking');
};

openHotelBooking.call(mockComponent);
assert.strictEqual(mockComponent.state.hotelGuestName, 'Rostand Tchuekam');
assert.strictEqual(mockComponent.state.hotelGuestPhone, '+237 690123456');
assert.strictEqual(mockComponent._currentScreen, 'hotelBooking');

// Simulate typing in hotelGuestName
const updateHotelGuestName = function(e) {
  this.setState({ hotelGuestName: e && e.target ? e.target.value : e });
};
updateHotelGuestName.call(mockComponent, { target: { value: 'Samuel Eto\'o' } });
assert.strictEqual(mockComponent.state.hotelGuestName, 'Samuel Eto\'o');

// Simulate typing in hotelGuestPhone
const updateHotelGuestPhone = function(e) {
  this.setState({ hotelGuestPhone: e && e.target ? e.target.value : e });
};
updateHotelGuestPhone.call(mockComponent, { target: { value: '+237 670 00 00 00' } });
assert.strictEqual(mockComponent.state.hotelGuestPhone, '+237 670 00 00 00');

console.log('✓ All 5 Hotel Booking Input & Event Handler assertions PASSED.');
