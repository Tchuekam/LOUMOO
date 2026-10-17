/**
 * LOUMOO Integration Tests — Host posts a STAY to the Travel vertical
 * ---------------------------------------------------------------------------
 * Proves the end-to-end requirement: when a host posts a stay it is created in
 * the TRAVEL vertical, stays hidden until published, never shows in the
 * markethub (it is not a listing), and only its owner can manage it.
 *
 *   1. Any authenticated user can create a stay (draft → INACTIVE).
 *   2. A draft is hidden from the public Travel feed.
 *   3. The host sees their own draft via /hotels/mine; other hosts do not.
 *   4. Another host cannot publish someone else's stay.
 *   5. Publishing makes it live in the Travel feed; the same id is NOT a
 *      markethub listing (404) — proving it routed to Travel, not the catalogue.
 *   6. Unpublishing hides it again.
 */

require('../setup');
const assert = require('assert');
const { request, createUser, cleanup } = require('../helpers/harness');

function idsOf(res) {
  const items = (res.body && (res.body.items || res.body.data)) || [];
  return (Array.isArray(items) ? items : []).map(h => h.id);
}

const STAY = {
  name: 'Résidence Akwa Palm',
  propertyType: 'SERVICED_APARTMENT',
  description: 'A calm serviced residence in the heart of Bonapriso, five minutes from Akwa.',
  city: 'Douala',
  location: 'Rue Njo-Njo, Bonapriso, Douala',
  currency: 'XAF',
  starLabel: '4-star',
  amenities: ['WIFI', 'POOL', 'BREAKFAST'],
  priceFrom: 45000,
  status: 'INACTIVE', // a draft, exactly as the studio's first autosave sends it
  contact: { phone: '+237699112233', checkIn: '14:00', checkOut: '11:00' },
  rooms: [{ name: 'Deluxe Suite', price: 45000, capacity: 2, totalInventory: 8, cancellationPolicy: 'FREE_CANCELLATION_24H' }]
};

async function run() {
  console.log('  Travel host posting: a stay routes to Travel, not the markethub...');

  const hostA = await createUser({ stage: 'ready', suffix: 'hostA' });
  const hostB = await createUser({ stage: 'ready', suffix: 'hostB' });

  /* 1. Any authenticated user can create a stay (requireAuth only). */
  const created = await request('POST', '/api/v1/travel/hotels', { token: hostA.token, body: STAY });
  assert.strictEqual(created.status, 201, `create stay -> 201 (got ${created.status}: ${JSON.stringify(created.body)})`);
  const hotel = created.body.data || created.body.hotel;
  assert.ok(hotel && hotel.id, 'created stay has an id');
  const hotelId = hotel.id;
  assert.strictEqual(hotel.status, 'INACTIVE', 'a freshly posted stay is a hidden draft');
  assert.strictEqual(hotel.ownerId, hostA.id, 'the stay is owned by its creator');
  console.log(`    [1] created draft stay ${hotelId} (owner ${hostA.id})`);

  /* 2. A draft is hidden from the public Travel feed. */
  let publicFeed = await request('GET', '/api/v1/travel/hotels?limit=200');
  assert.strictEqual(publicFeed.status, 200);
  assert.ok(!idsOf(publicFeed).includes(hotelId), 'a draft must NOT appear in the public Travel feed');
  console.log('    [2] draft hidden from the public Travel feed');

  /* 3. The host sees their own draft; another host does not. */
  const mineA = await request('GET', '/api/v1/travel/hotels/mine', { token: hostA.token });
  assert.strictEqual(mineA.status, 200);
  assert.ok(idsOf(mineA).includes(hotelId), 'the host sees their own draft in /hotels/mine');

  const mineB = await request('GET', '/api/v1/travel/hotels/mine', { token: hostB.token });
  assert.strictEqual(mineB.status, 200);
  assert.ok(!idsOf(mineB).includes(hotelId), 'another host does not see it');
  console.log('    [3] /hotels/mine is owner-scoped');

  /* 4. Another host cannot publish someone else's stay. */
  const steal = await request('POST', `/api/v1/travel/hotels/${hotelId}/publish`, { token: hostB.token });
  assert.ok(steal.status === 403 || steal.status === 404, `host B cannot publish A's stay (got ${steal.status})`);
  console.log(`    [4] a non-owner cannot publish it (${steal.status})`);

  /* 5. Publishing makes it live in Travel; the id is NOT a markethub listing. */
  const published = await request('POST', `/api/v1/travel/hotels/${hotelId}/publish`, { token: hostA.token });
  assert.strictEqual(published.status, 200, `owner publishes -> 200 (got ${published.status}: ${JSON.stringify(published.body)})`);
  assert.strictEqual((published.body.data || published.body.hotel).status, 'ACTIVE', 'published stay is ACTIVE');

  publicFeed = await request('GET', '/api/v1/travel/hotels?limit=200');
  assert.ok(idsOf(publicFeed).includes(hotelId), 'a published stay appears in the Travel feed');

  const asListing = await request('GET', `/api/v1/listings/${encodeURIComponent(hotelId)}`);
  assert.strictEqual(asListing.status, 404, 'the stay is NOT a markethub listing (routed to Travel, not the catalogue)');
  console.log('    [5] live in Travel; same id is a 404 in the markethub listings');

  /* 6. Unpublishing hides it again. */
  const unpublished = await request('POST', `/api/v1/travel/hotels/${hotelId}/unpublish`, { token: hostA.token });
  assert.strictEqual(unpublished.status, 200);
  publicFeed = await request('GET', '/api/v1/travel/hotels?limit=200');
  assert.ok(!idsOf(publicFeed).includes(hotelId), 'an unpublished stay is hidden again');
  console.log('    [6] unpublish hides it from the Travel feed');

  console.log('  ✓ Travel host posting: stay routes to Travel, hidden-until-published, owner-only, not in markethub.');
}

run()
  .then(() => (typeof cleanup === 'function' ? cleanup() : null))
  .then(() => process.exit(0))
  .catch(err => { console.error('\n  ✗ Travel host posting FAILED:', err && err.stack || err); process.exit(1); });
