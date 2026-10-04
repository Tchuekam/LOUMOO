/**
 * Unit Test: Recommendation Core (Discovery Engine scoring brain)
 * ===========================================================================
 * Pins the model and the invariants documented in docs/RECOMMENDATION_ENGINE.md.
 * The core is pure and deterministic given an injected `nowMs` and `rng`, which
 * is exactly what lets these assertions be stable on every run.
 */

const assert = require('assert');
const CORE = require('../../src/services/recommendationCore');

// A deterministic RNG so the exploration step is reproducible in tests.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const T0 = 1_700_000_000_000; // a fixed "now" baseline (ms)

function mkItem(over) {
  return Object.assign({
    id: 'i_' + Math.random().toString(36).slice(2, 8),
    title: 'Generic Item',
    category: 'electronics',
    subcategory: 'smartphones',
    brand: 'Acme',
    storeName: 'Acme Store',
    price: 'XAF 100.000',
    rating: 4.6,
    reviewCount: 120,
    inStock: true
  }, over || {});
}

// A realistic, varied catalogue so diversity/exploration have room to act.
function buildCatalogue() {
  const items = [];
  const brands = ['Apple', 'Samsung', 'Tecno', 'Xiaomi', 'Sony', 'HP'];
  const subs = ['smartphones', 'laptops', 'audio', 'wearables', 'gaming'];
  for (let i = 0; i < 60; i++) {
    items.push(mkItem({
      id: 'elec_' + i,
      title: brands[i % brands.length] + ' Model ' + i,
      category: 'electronics',
      subcategory: subs[i % subs.length],
      brand: brands[i % brands.length],
      storeName: 'Store ' + (i % 8),
      price: 'XAF ' + (50 + i) + '.000',
      rating: 4 + (i % 10) / 10,
      reviewCount: 10 + i
    }));
  }
  // Some non-electronics so "out of profile" items exist.
  const fashionBrands = ['Nike', 'Zara', 'Gucci'];
  for (let i = 0; i < 20; i++) {
    items.push(mkItem({
      id: 'fash_' + i,
      title: fashionBrands[i % 3] + ' Piece ' + i,
      category: 'fashion',
      subcategory: 'footwear',
      brand: fashionBrands[i % 3],
      storeName: 'Boutique ' + (i % 4),
      price: 'XAF ' + (30 + i) + '.000',
      rating: 4.2,
      reviewCount: 25 + i
    }));
  }
  return items;
}

function ctxFor(profile, over) {
  return Object.assign({
    profile: profile,
    trendingMap: {},
    trendingMax: 1,
    covisMap: {},
    seenMap: {},
    nowMs: T0,
    rng: mulberry32(42)
  }, over || {});
}

async function run() {
  console.log('  Testing Recommendation Core invariants...');

  // ── Helpers: price parsing across both data shapes ──────────────────────
  assert.strictEqual(CORE.toXaf('XAF 187.200'), 187200, 'toXaf parses dotted thousands');
  assert.strictEqual(CORE.toXaf('187 200 FCFA'), 187200, 'toXaf parses spaced thousands');
  assert.strictEqual(CORE.toXaf(187200), 187200, 'toXaf passes numbers through');
  // Curated salePrice is a higher compare-at; live sale_price is a lower discount.
  // effectivePrice must take the minimum (what you actually pay) in both shapes.
  assert.strictEqual(
    CORE.effectivePrice({ price: 'XAF 200.000', salePrice: 'XAF 250.000' }), 200000,
    'effectivePrice ignores a higher compare-at salePrice');
  assert.strictEqual(
    CORE.effectivePrice({ priceNumeric: 200000, salePriceNumeric: 150000 }), 150000,
    'effectivePrice uses a lower discount price');
  console.log('    ✓ price parser + effective price (both data shapes)');

  // ── baseTitle strips the (#n) near-duplicate marker ─────────────────────
  assert.strictEqual(CORE.baseTitle('Tecno Camon 50 (#75)'), 'tecno camon 50', 'baseTitle strips (#n)');
  assert.strictEqual(CORE.baseTitle('Tecno Camon 50'), 'tecno camon 50', 'baseTitle stable without marker');
  console.log('    ✓ baseTitle near-duplicate normalisation');

  // ── Invariant 1: decay is monotonic ─────────────────────────────────────
  // The SAME event, folded in longer ago, must contribute LESS at score time.
  {
    const older = CORE.createProfile();
    CORE.applyEvent(older, { type: 'save', item: mkItem({ brand: 'Acme' }) }, T0 - 60 * 60 * 1000); // 60 min ago
    CORE.decayProfile(older, T0);
    const newer = CORE.createProfile();
    CORE.applyEvent(newer, { type: 'save', item: mkItem({ brand: 'Acme' }) }, T0 - 1 * 60 * 1000); // 1 min ago
    CORE.decayProfile(newer, T0);
    const key = 'brand:acme';
    assert.ok(newer.short[key] > older.short[key],
      `decay monotonic: newer (${newer.short[key]}) should exceed older (${older.short[key]})`);
    assert.ok(older.short[key] > 0, 'an aged save still carries some positive weight');
  }
  console.log('    ✓ invariant 1: decay is monotonic');

  // ── Invariant 2: a single impression never outranks a save ──────────────
  {
    const p = CORE.createProfile();
    const saved = mkItem({ id: 'saved', subcategory: 'laptops', brand: 'Saveco', storeName: 'SaveStore' });
    const impressed = mkItem({ id: 'impr', subcategory: 'audio', brand: 'Imprco', storeName: 'ImprStore' });
    CORE.applyEvent(p, { type: 'save', item: saved }, T0);
    CORE.applyEvent(p, { type: 'impression', item: impressed }, T0);
    const sSaved = CORE.scoreItem(saved, ctxFor(p));
    const sImpr = CORE.scoreItem(impressed, ctxFor(p));
    assert.ok(sSaved.score > sImpr.score,
      `saved item (${sSaved.score.toFixed(3)}) must outrank impressed item (${sImpr.score.toFixed(3)})`);
  }
  console.log('    ✓ invariant 2: a save outranks a lone impression');

  // ── Invariant 3: hard-excluded items never appear in the feed ───────────
  {
    const p = CORE.createProfile();
    // Build some taste so ranking is active.
    CORE.applyEvent(p, { type: 'save', item: mkItem({ brand: 'Apple', subcategory: 'smartphones' }) }, T0);
    const items = buildCatalogue();
    const notInterestedId = items[3].id;
    const hiddenStore = items[5].storeName;
    CORE.applyEvent(p, { type: 'not_interested', itemId: notInterestedId }, T0);
    CORE.applyEvent(p, { type: 'hide_store', storeName: hiddenStore }, T0);
    // Also mark one item out of stock.
    items[7].inStock = false;
    const feed = CORE.rankFeed(items, ctxFor(p), { limit: 40 });
    assert.ok(!feed.some(x => x.id === notInterestedId), 'not-interested item must be absent');
    assert.ok(!feed.some(x => CORE.norm(x.storeName) === CORE.norm(hiddenStore)), 'hidden store must be absent');
    assert.ok(!feed.some(x => x.id === items[7].id), 'out-of-stock item must be absent');
  }
  console.log('    ✓ invariant 3: feed excludes not-interested / hidden-store / out-of-stock');

  // ── Invariant 4: near-duplicates are capped per page ────────────────────
  {
    const p = CORE.createProfile();
    // 10 near-duplicates sharing a base title + 20 distinct items.
    const dups = [];
    for (let i = 0; i < 10; i++) dups.push(mkItem({ id: 'dup_' + i, title: 'iPhone 15 Pro (#' + i + ')' }));
    const distinct = buildCatalogue().slice(0, 20);
    const feed = CORE.rankFeed(dups.concat(distinct), ctxFor(p), { limit: 24 });
    const bt = 'iphone 15 pro';
    const dupCount = feed.filter(x => CORE.baseTitle(x.title) === bt).length;
    assert.ok(dupCount <= CORE.MAX_PER_BASE_TITLE,
      `near-dup cap: ${dupCount} must be <= ${CORE.MAX_PER_BASE_TITLE}`);
  }
  console.log('    ✓ invariant 4: near-duplicates capped per page');

  // ── Invariant 5: exploration surfaces an out-of-profile item ────────────
  {
    const p = CORE.createProfile();
    // Taste purely in electronics/smartphones.
    for (let i = 0; i < 5; i++) {
      CORE.applyEvent(p, { type: 'save', item: mkItem({ category: 'electronics', subcategory: 'smartphones', brand: 'Apple' }) }, T0);
    }
    const feed = CORE.rankFeed(buildCatalogue(), ctxFor(p), { limit: 24 });
    const hasExplore = feed.some(x => x._recoExplore === true);
    const hasFashion = feed.some(x => x.category === 'fashion');
    assert.ok(hasExplore, 'at least one slot must be an exploration pick once the profile is non-empty');
    assert.ok(hasFashion, 'exploration/diversity should surface an out-of-profile (fashion) item');
  }
  console.log('    ✓ invariant 5: exploration surfaces out-of-profile items');

  // ── Invariant 7: a full, non-empty page from the pool alone ─────────────
  {
    const p = CORE.createProfile(); // cold start, no events
    const feed = CORE.rankFeed(buildCatalogue(), ctxFor(p), { limit: 24 });
    assert.strictEqual(feed.length, 24, 'cold-start feed still fills the page');
    assert.ok(feed.every(x => typeof x._recoScore === 'number' && isFinite(x._recoScore)), 'every card has a finite score (no NaN)');
    // Fewer candidates than the limit: returns what exists, never throws.
    const few = CORE.rankFeed(buildCatalogue().slice(0, 5), ctxFor(p), { limit: 24 });
    assert.strictEqual(few.length, 5, 'returns all candidates when the pool is smaller than the limit');
  }
  console.log('    ✓ invariant 7: full page from the pool alone, scores finite');

  // ── moreLikeThis: excludes the seed, ranks same-subcategory/brand higher ─
  {
    const seed = mkItem({ id: 'seed', title: 'Tecno Camon 50 Pro', brand: 'Tecno', subcategory: 'smartphones', category: 'electronics' });
    const sameBrandSub = mkItem({ id: 'same', title: 'Tecno Spark 20', brand: 'Tecno', subcategory: 'smartphones', storeName: 'Phone Hub' });
    const sameCatOnly = mkItem({ id: 'cat', title: 'HP Laptop', brand: 'HP', subcategory: 'laptops', category: 'electronics', storeName: 'Laptop World' });
    const unrelated = mkItem({ id: 'unrel', title: 'Nike Shoe', brand: 'Nike', subcategory: 'footwear', category: 'fashion', storeName: 'Shoe Palace' });
    const seedDup = mkItem({ id: 'seeddup', title: 'Tecno Camon 50 Pro (#2)', brand: 'Tecno', subcategory: 'smartphones', storeName: 'Phone Hub' });
    const pool = [seed, sameBrandSub, sameCatOnly, unrelated, seedDup];
    const neighbours = CORE.moreLikeThis(seed, pool, { profile: CORE.createProfile(), covisMap: {} }, { limit: 10 });
    assert.ok(!neighbours.some(x => x.id === 'seed'), 'moreLikeThis never returns the seed itself');
    assert.ok(!neighbours.some(x => x.id === 'seeddup'), 'moreLikeThis drops exact near-dupes of the seed');
    assert.ok(neighbours.length >= 1, 'moreLikeThis returns neighbours');
    // Same brand + subcategory must rank above category-only.
    const idxSame = neighbours.findIndex(x => x.id === 'same');
    const idxCat = neighbours.findIndex(x => x.id === 'cat');
    assert.ok(idxSame !== -1 && (idxCat === -1 || idxSame < idxCat),
      'same brand+subcategory ranks above a category-only match');
    assert.ok(!neighbours.some(x => x.id === 'unrel'),
      'an unrelated item with no similarity and no co-visitation is not a neighbour');
  }
  console.log('    ✓ moreLikeThis: seed-excluded, relevance-ordered');

  // ── moreLikeThis honours hard excludes too ──────────────────────────────
  {
    const seed = mkItem({ id: 'seed2', title: 'Tecno Camon 50', brand: 'Tecno', subcategory: 'smartphones' });
    const hidden = mkItem({ id: 'hid', title: 'Tecno Spark 10', brand: 'Tecno', subcategory: 'smartphones', storeName: 'BadStore' });
    const p = CORE.createProfile();
    CORE.applyEvent(p, { type: 'hide_store', storeName: 'BadStore' }, T0);
    CORE.applyEvent(p, { type: 'not_interested', itemId: 'supp' }, T0);
    const supp = mkItem({ id: 'supp', title: 'Tecno Pop 8', brand: 'Tecno', subcategory: 'smartphones' });
    const ok = mkItem({ id: 'ok', title: 'Tecno Phantom V', brand: 'Tecno', subcategory: 'smartphones' });
    const res = CORE.moreLikeThis(seed, [seed, hidden, supp, ok], { profile: p, covisMap: {} }, { limit: 10 });
    assert.ok(!res.some(x => x.id === 'hid'), 'moreLikeThis excludes hidden-store items');
    assert.ok(!res.some(x => x.id === 'supp'), 'moreLikeThis excludes not-interested items');
    assert.ok(res.some(x => x.id === 'ok'), 'a clean neighbour still comes through');
  }
  console.log('    ✓ moreLikeThis: respects hidden-store / not-interested');

  // ── mergeProfiles stitches a guest profile into the account on sign-in ──
  {
    const guest = CORE.createProfile();
    CORE.applyEvent(guest, { type: 'save', item: mkItem({ brand: 'Guestco' }) }, T0);
    const user = CORE.createProfile();
    CORE.applyEvent(user, { type: 'save', item: mkItem({ brand: 'Userco' }) }, T0);
    const merged = CORE.mergeProfiles(user, guest, T0);
    assert.ok(merged.short['brand:guestco'] > 0 && merged.short['brand:userco'] > 0,
      'merged profile carries both the guest and the account taste');
  }
  console.log('    ✓ mergeProfiles stitches guest taste on sign-in');

  // ── makeRng is deterministic and seed-dependent ─────────────────────────
  {
    const r1 = CORE.makeRng('abc'); const r2 = CORE.makeRng('abc');
    const a = [r1(), r1(), r1()]; const b = [r2(), r2(), r2()];
    assert.deepStrictEqual(a, b, 'same seed yields the same sequence');
    assert.ok(a.every(x => x >= 0 && x < 1), 'rng output stays in [0,1)');
    const r3 = CORE.makeRng('xyz');
    assert.notDeepStrictEqual([r3(), r3(), r3()], a, 'a different seed yields a different sequence');
  }
  console.log('    ✓ makeRng deterministic + seed-dependent');

  // ── rankFeed is reproducible given a seeded rng (stable feed + pagination) ─
  {
    const p = CORE.createProfile();
    CORE.applyEvent(p, { type: 'save', item: mkItem({ brand: 'Apple', subcategory: 'smartphones' }) }, T0);
    const items = buildCatalogue();
    const run = () => CORE.rankFeed(items, ctxFor(p, { rng: CORE.makeRng(99) }), { limit: 24 }).map(x => x.id);
    assert.deepStrictEqual(run(), run(), 'identical (items, ctx, seeded rng) -> identical order');
  }
  console.log('    ✓ rankFeed reproducible under a seeded rng');

  // ── cosine-norm cache invalidates on a same-millisecond profile mutation ─
  // Prime the norm cache, then mutate the profile at the SAME nowMs; the scored
  // affinity must equal that of an equivalent profile built fresh (no stale norm).
  {
    const probe = mkItem({ id: 'probe', brand: 'Nike', subcategory: 'footwear', category: 'fashion' });
    const mk = () => mkItem({ brand: 'Nike', subcategory: 'footwear', category: 'fashion' });
    const fresh = CORE.createProfile();
    for (let i = 0; i < 5; i++) CORE.applyEvent(fresh, { type: 'purchase', item: mk() }, T0);
    const freshAff = CORE.scoreItem(probe, ctxFor(fresh)).breakdown.affinity;
    const primed = CORE.createProfile();
    CORE.applyEvent(primed, { type: 'purchase', item: mk() }, T0);
    CORE.scoreItem(probe, ctxFor(primed)); // caches the norm at this (decayedAt, rev)
    for (let i = 0; i < 4; i++) CORE.applyEvent(primed, { type: 'purchase', item: mk() }, T0); // mutate, same tick
    const primedAff = CORE.scoreItem(probe, ctxFor(primed)).breakdown.affinity;
    assert.ok(Math.abs(primedAff - freshAff) < 1e-9,
      `norm cache must invalidate on same-tick mutation (primed=${primedAff}, fresh=${freshAff})`);
  }
  console.log('    ✓ cosine-norm cache invalidates on same-tick mutation');

  console.log('  ✓ Recommendation Core: all invariants hold');
}

if (require.main === module) {
  run().then(() => console.log('[PASS] recommendation_core.test.js')).catch(e => { console.error('[FAIL]', e); process.exit(1); });
}

module.exports = { run };
