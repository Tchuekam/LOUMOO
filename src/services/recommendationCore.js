/**
 * LOUMOO Discovery Engine — pure scoring core
 * ===========================================================================
 * The brain of the For You system, as a single source of truth shared by the
 * server (`require`) and the browser (global `window.LoumooRecoCore`). It is
 * PURE: no network, no DOM, no storage, no wall-clock reads except through an
 * injected `nowMs`. Everything here is deterministic given its inputs (and an
 * optional injectable RNG for the exploration step), which is what lets the
 * unit tests pin the maths on both runtimes.
 *
 * What it does, end to end:
 *   facets(item)            → the weighted taste dimensions an item occupies
 *   applyEvent(profile, …)  → fold one interaction into a decayed profile
 *   decayProfile(profile,…) → age a profile's weights toward "now"
 *   scoreItem(item, ctx)    → relevance of one item to one profile right now
 *   rankFeed(items, ctx,…)  → score → diversity re-rank → exploration → page
 *   moreLikeThis(seed, …)   → content/co-visitation neighbours of an item
 *
 * See docs/RECOMMENDATION_ENGINE.md for the model and invariants.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api; // Node / server
  }
  if (typeof root !== 'undefined' && root) {
    root.LoumooRecoCore = api; // browser global
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function () {
  'use strict';

  // ── Tunable constants ────────────────────────────────────────────────────
  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * MINUTE;

  // Two clocks. Short-term adapts within a sitting; long-term is stable taste.
  const HALF_LIFE_SHORT_MS = 30 * MINUTE;
  const HALF_LIFE_LONG_MS = 21 * DAY;

  // How much the in-the-moment profile counts vs. the durable one, at score time.
  const SHORT_TERM_BLEND = 0.6;

  // Intent weight per event type (before decay). Behaviour, not surveys.
  const EVENT_WEIGHTS = Object.freeze({
    impression: 0.08,
    dwell: 0.4, // scaled by dwell time, see dwellBoost()
    click: 1.0,
    view: 1.0,
    pdp_dwell: 2.0, // scaled by time on page
    search: 0.8,
    save: 3.0,
    unsave: -3.0,
    add_to_cart: 4.0,
    remove_from_cart: -1.5,
    purchase: 6.0,
    contact_seller: 4.0,
    follow_store: 4.0,
    not_interested: -6.0,
    hide_store: -10.0
  });

  // Per-facet multiplier: a shared brand says less about taste than a subcategory.
  const FACET_WEIGHT = Object.freeze({
    category: 1.0,
    subcategory: 1.3,
    brand: 0.9,
    store: 0.8,
    priceBand: 0.5,
    city: 0.3,
    keyword: 0.5
  });

  // Score term weights.
  const DEFAULT_WEIGHTS = Object.freeze({
    affinity: 3.2,
    coVisitation: 1.6,
    trending: 1.1,
    quality: 0.8,
    freshness: 0.5,
    context: 0.6,
    seenPenalty: 1.8,
    fatiguePenalty: 1.2
  });

  // Feed shaping.
  const DEFAULT_LAMBDA = 0.72; // MMR: relevance vs. diversity
  const DEFAULT_EXPLORE_RATIO = 0.15; // share of slots given to discovery
  const MAX_PER_BASE_TITLE = 1; // near-dup suppression inside one page
  const MAX_PER_STORE = 3;
  const MAX_PER_SUBCATEGORY = 5;
  const RECENT_ITEMS_CAP = 40;
  const PROFILE_FACET_CAP = 240; // keep the weight maps bounded
  const MIN_WEIGHT = 0.01; // prune dust after decay
  const SEEN_HALF_LIFE_MS = 45 * MINUTE;

  const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'pro', 'max', 'plus', 'new', 'set', 'pcs',
    'avec', 'pour', 'les', 'des', 'une', 'de', 'la', 'le', 'du', 'en', 'et',
    'go', 'gb', 'ram', 'ssd', 'ml', 'cm', 'mm', 'kg', 'xaf', 'fcfa'
  ]);

  // ── Small pure helpers ───────────────────────────────────────────────────

  /** Digits-only price parse. Handles "XAF 187.200", "187 200 FCFA", 187200. */
  function toXaf(v) {
    if (typeof v === 'number' && isFinite(v)) return v;
    const digits = String(v == null ? '' : v).replace(/[^0-9]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  /** Effective (what-you-pay) price across both data shapes: take the minimum. */
  function effectivePrice(item) {
    if (!item) return 0;
    const a = toXaf(item.priceNumeric != null ? item.priceNumeric : item.price);
    const hasSale = item.salePriceNumeric != null || item.salePrice != null;
    const b = hasSale ? toXaf(item.salePriceNumeric != null ? item.salePriceNumeric : item.salePrice) : Infinity;
    const lo = Math.min(a || Infinity, b || Infinity);
    return lo === Infinity ? 0 : lo;
  }

  /** Log-scale price into coarse bands so "same budget" items cluster. */
  function priceBand(xaf) {
    const p = toXaf(xaf);
    if (p <= 0) return 0;
    return Math.max(0, Math.min(9, Math.floor(Math.log10(p))));
  }

  /** Strip accents, lowercase, trim. */
  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().trim();
  }

  /** Title with a trailing "(#2)" style duplicate marker removed. */
  function baseTitle(title) {
    return norm(title).replace(/\s*\(#\d+\)\s*$/, '').replace(/\s+/g, ' ').trim();
  }

  /** Meaningful tokens from a title/query for the keyword facet. */
  function tokenize(text) {
    const out = [];
    const seen = {};
    const words = norm(text).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      if (/^\d+$/.test(w)) continue;
      if (seen[w]) continue;
      seen[w] = 1;
      out.push(w);
      if (out.length >= 8) break;
    }
    return out;
  }

  function storeKey(item) {
    return norm(item && (item.storeName || item.store || item.merchant) || '');
  }

  /**
   * The weighted facets an item occupies: a map facetKey -> weight.
   * Keyword facets are split across the title's tokens.
   */
  function facets(item) {
    const f = {};
    if (!item) return f;
    const add = (type, raw, mult) => {
      const v = norm(raw);
      if (!v) return;
      f[type + ':' + v] = (f[type + ':' + v] || 0) + FACET_WEIGHT[type] * (mult == null ? 1 : mult);
    };
    add('category', item.category);
    add('subcategory', item.subcategory);
    add('brand', item.brand);
    const sk = storeKey(item);
    if (sk) f['store:' + sk] = (f['store:' + sk] || 0) + FACET_WEIGHT.store;
    f['priceBand:' + priceBand(effectivePrice(item))] = FACET_WEIGHT.priceBand;
    const city = norm(item.storeCity || item.merchantCity || item.city);
    if (city) f['city:' + city] = FACET_WEIGHT.city;
    const toks = tokenize(item.title || item.name);
    for (let i = 0; i < toks.length; i++) {
      f['keyword:' + toks[i]] = (f['keyword:' + toks[i]] || 0) + FACET_WEIGHT.keyword / Math.sqrt(toks.length);
    }
    return f;
  }

  function decayFactor(ageMs, halfLifeMs) {
    if (!(ageMs > 0)) return 1;
    return Math.pow(0.5, ageMs / halfLifeMs);
  }

  function dwellBoost(ms, capMs) {
    const t = Math.max(0, toXaf(ms));
    const cap = capMs || 15000;
    return Math.min(1, t / cap); // 0..1, saturating
  }

  /**
   * A tiny deterministic PRNG (mulberry32) seeded from a number or string.
   * Passing one as ctx.rng makes rankFeed's exploration reproducible for a given
   * epoch, so a feed can be re-derived identically — the basis for a stable,
   * append-only client feed and duplicate-free server pagination.
   */
  function makeRng(seed) {
    let a;
    if (typeof seed === 'number') { a = seed >>> 0; }
    else { a = 0; const s = String(seed == null ? '' : seed); for (let i = 0; i < s.length; i++) a = (Math.imul(a ^ s.charCodeAt(i), 2654435761)) >>> 0; }
    a = (a || 1) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ── Profile ──────────────────────────────────────────────────────────────

  function createProfile() {
    return {
      short: {}, // facetKey -> weight (fast clock)
      long: {}, // facetKey -> weight (slow clock)
      suppressedItems: {}, // itemId -> ts (not interested)
      hiddenStores: {}, // storeKey -> ts
      recent: [], // [{id, ts}] most-recent-first, for covis + "continue"
      eventCount: 0,
      decayedAt: 0
    };
  }

  function _pruneMap(map, cap) {
    const keys = Object.keys(map);
    for (let i = 0; i < keys.length; i++) {
      if (Math.abs(map[keys[i]]) < MIN_WEIGHT) delete map[keys[i]];
    }
    const left = Object.keys(map);
    if (left.length > cap) {
      left.sort((a, b) => Math.abs(map[b]) - Math.abs(map[a]));
      for (let i = cap; i < left.length; i++) delete map[left[i]];
    }
  }

  /** Age both weight maps to `nowMs`. Idempotent given the same now. */
  function decayProfile(profile, nowMs) {
    if (!profile) return createProfile();
    const last = profile.decayedAt || nowMs;
    const age = Math.max(0, nowMs - last);
    if (age > 0) {
      const ds = decayFactor(age, HALF_LIFE_SHORT_MS);
      const dl = decayFactor(age, HALF_LIFE_LONG_MS);
      let k;
      for (k in profile.short) if (Object.prototype.hasOwnProperty.call(profile.short, k)) profile.short[k] *= ds;
      for (k in profile.long) if (Object.prototype.hasOwnProperty.call(profile.long, k)) profile.long[k] *= dl;
      _pruneMap(profile.short, PROFILE_FACET_CAP);
      _pruneMap(profile.long, PROFILE_FACET_CAP);
    }
    profile.decayedAt = nowMs;
    return profile;
  }

  /**
   * Fold one event into the profile. The event carries its item's facets (or
   * an item object we can derive them from) so scoring never needs the catalogue.
   * `nowMs` defaults to the event ts.
   */
  function applyEvent(profile, event, nowMs) {
    if (!profile) profile = createProfile();
    if (!event || !event.type) return profile;
    const now = nowMs != null ? nowMs : (event.ts || 0);
    decayProfile(profile, now);

    const type = event.type;
    const store = norm(event.storeName || event.store || (event.item && storeKey(event.item)) || '');

    // Hard controls short-circuit the weight maths.
    if (type === 'not_interested') {
      if (event.itemId) profile.suppressedItems[event.itemId] = now;
    } else if (type === 'hide_store') {
      if (store) profile.hiddenStores[store] = now;
    }

    let base = EVENT_WEIGHTS[type];
    if (base == null) return profile;
    if (type === 'dwell') base *= dwellBoost(event.dwellMs, 15000);
    if (type === 'pdp_dwell') base *= dwellBoost(event.dwellMs, 60000);
    if (base === 0) { profile.eventCount++; return profile; }

    // Which facets to move: an explicit facet map, or derive from the item, or
    // (for search) the query tokens.
    let f = event.facets;
    if (!f && event.item) f = facets(event.item);
    if (!f && type === 'search' && event.query) {
      f = {};
      const toks = tokenize(event.query);
      for (let i = 0; i < toks.length; i++) f['keyword:' + toks[i]] = FACET_WEIGHT.keyword;
      if (event.category) f['category:' + norm(event.category)] = FACET_WEIGHT.category;
    }
    if (!f || !Object.keys(f).length) {
      // A store follow with no item still moves the store facet.
      if ((type === 'follow_store' || type === 'hide_store') && store) {
        f = {}; f['store:' + store] = FACET_WEIGHT.store;
      } else {
        profile.eventCount++;
        return profile;
      }
    }

    for (const key in f) {
      if (!Object.prototype.hasOwnProperty.call(f, key)) continue;
      const delta = base * f[key];
      profile.short[key] = (profile.short[key] || 0) + delta;
      // Long clock gets a damped share of transient events, full share of strong ones.
      const longShare = (type === 'impression' || type === 'dwell') ? 0.25 : 1;
      profile.long[key] = (profile.long[key] || 0) + delta * longShare;
    }

    // Track recent views for co-visitation + "continue where you left off".
    if ((type === 'click' || type === 'view') && event.itemId) {
      profile.recent = profile.recent.filter((r) => r.id !== event.itemId);
      profile.recent.unshift({ id: event.itemId, ts: now });
      if (profile.recent.length > RECENT_ITEMS_CAP) profile.recent.length = RECENT_ITEMS_CAP;
    }

    _pruneMap(profile.short, PROFILE_FACET_CAP);
    _pruneMap(profile.long, PROFILE_FACET_CAP);
    profile.__rev = (profile.__rev || 0) + 1; // invalidate the cosine-norm cache
    profile.eventCount++;
    return profile;
  }

  /** Merge a guest profile into a user profile on sign-in (additive). */
  function mergeProfiles(target, source, nowMs) {
    const t = target || createProfile();
    if (!source) return t;
    decayProfile(t, nowMs);
    decayProfile(source, nowMs);
    const mergeMap = (dst, src) => { for (const k in src) if (Object.prototype.hasOwnProperty.call(src, k)) dst[k] = (dst[k] || 0) + src[k]; };
    mergeMap(t.short, source.short);
    mergeMap(t.long, source.long);
    Object.assign(t.suppressedItems, source.suppressedItems || {});
    Object.assign(t.hiddenStores, source.hiddenStores || {});
    const ids = {};
    t.recent = (t.recent || []).concat(source.recent || [])
      .sort((a, b) => b.ts - a.ts)
      .filter((r) => (ids[r.id] ? false : (ids[r.id] = 1)));
    if (t.recent.length > RECENT_ITEMS_CAP) t.recent.length = RECENT_ITEMS_CAP;
    t.eventCount = (t.eventCount || 0) + (source.eventCount || 0);
    _pruneMap(t.short, PROFILE_FACET_CAP);
    _pruneMap(t.long, PROFILE_FACET_CAP);
    t.__rev = (t.__rev || 0) + 1; // invalidate the cosine-norm cache after merge
    return t;
  }

  // ── Scoring terms ──────────────────────────────────────────────────────────

  function _blendedWeight(profile, key) {
    return SHORT_TERM_BLEND * (profile.short[key] || 0) +
      (1 - SHORT_TERM_BLEND) * (profile.long[key] || 0);
  }

  function _profileNorm(profile) {
    // Cached cosine denominator for the blended vector. Keyed on BOTH the decay
    // timestamp AND a mutation counter (__rev): a same-millisecond applyEvent
    // changes the weights without advancing decayedAt, so without __rev the cache
    // would return a pre-mutation norm and distort every affinity in that pass.
    if (profile.__norm != null && profile.__normAt === profile.decayedAt && profile.__normRev === profile.__rev) return profile.__norm;
    let sum = 0;
    const seen = {};
    const acc = (map) => { for (const k in map) { if (seen[k]) continue; seen[k] = 1; const w = _blendedWeight(profile, k); sum += w * w; } };
    acc(profile.short); acc(profile.long);
    const n = Math.sqrt(sum) || 1;
    profile.__norm = n; profile.__normAt = profile.decayedAt; profile.__normRev = profile.__rev;
    return n;
  }

  /**
   * Cosine-like affinity 0..1, plus the single facet that contributed most
   * (for an honest "because you …" reason). Only positive profile weights pull
   * an item up; negatives (from not-interested facets) push it down.
   */
  function affinity(profile, itemFacets) {
    const pn = _profileNorm(profile);
    let dot = 0, itemSq = 0, topKey = null, topContrib = 0;
    for (const k in itemFacets) {
      if (!Object.prototype.hasOwnProperty.call(itemFacets, k)) continue;
      const iw = itemFacets[k];
      itemSq += iw * iw;
      const pw = _blendedWeight(profile, k);
      if (pw === 0) continue;
      const c = pw * iw;
      dot += c;
      if (c > topContrib) { topContrib = c; topKey = k; }
    }
    const inorm = Math.sqrt(itemSq) || 1;
    const cos = dot / (pn * inorm);
    // Squash into 0..1 (negatives from disliked facets map below 0.5).
    return { score: 1 / (1 + Math.exp(-2.2 * cos)), topKey: topKey, raw: cos };
  }

  function quality(item) {
    if (!item) return 0;
    const rating = parseFloat(item.rating != null ? item.rating : (item.storeRating || 0)) || 0;
    const reviews = toXaf(item.reviewCount != null ? item.reviewCount : item.reviewsCount);
    const sold = toXaf(item.soldCount);
    const r = Math.max(0, Math.min(1, (rating - 3) / 2)); // 3★→0, 5★→1
    const pop = Math.min(1, Math.log10(1 + reviews + sold) / 3); // ~1000 interactions → 1
    return 0.6 * r + 0.4 * pop;
  }

  function freshness(item, nowMs) {
    const ts = Date.parse(item && (item.publishedAt || item.createdAt) || '') || 0;
    if (!ts) return 0.4; // unknown/curated: neutral-ish
    const ageDays = Math.max(0, (nowMs - ts) / DAY);
    return Math.max(0, Math.min(1, 1 - ageDays / 120)); // linear decay over ~4 months
  }

  function _dominant(profile, prefix) {
    let bestKey = null, best = 0;
    const scan = (map) => { for (const k in map) { if (k.indexOf(prefix) !== 0) continue; const w = _blendedWeight(profile, k); if (w > best) { best = w; bestKey = k; } } };
    scan(profile.short); scan(profile.long);
    return bestKey ? bestKey.slice(prefix.length) : null;
  }

  function contextMatch(profile, item) {
    let s = 0;
    const city = _dominant(profile, 'city:');
    if (city && norm(item.storeCity || item.merchantCity || item.city) === city) s += 0.5;
    const band = _dominant(profile, 'priceBand:');
    if (band != null && String(priceBand(effectivePrice(item))) === band) s += 0.5;
    return s;
  }

  function trendingScore(item, trendingMap, trendingMax) {
    if (!trendingMap) return 0;
    const direct = trendingMap[item.id] || 0;
    const bt = trendingMap['bt:' + baseTitle(item.title || item.name)] || 0;
    const v = Math.max(direct, bt);
    if (!v) return 0;
    const max = trendingMax || 1;
    return Math.min(1, Math.log10(1 + v) / Math.log10(1 + max));
  }

  function coVisitationScore(item, covisMap) {
    if (!covisMap) return 0;
    return Math.min(1, (covisMap[item.id] || 0));
  }

  function seenPenalty(itemId, seenMap, nowMs) {
    if (!seenMap || !seenMap[itemId]) return 0;
    const last = seenMap[itemId];
    // Fully penalise a just-shown item; fade over ~45 min.
    return decayFactor(Math.max(0, nowMs - last), SEEN_HALF_LIFE_MS);
  }

  function isExcluded(item, profile) {
    if (!item) return true;
    if (item.inStock === false) return true;
    if (profile) {
      if (profile.suppressedItems && profile.suppressedItems[item.id]) return true;
      const sk = storeKey(item);
      if (sk && profile.hiddenStores && profile.hiddenStores[sk]) return true;
    }
    return false;
  }

  /**
   * Score one item against the full context. Returns { score, breakdown } where
   * breakdown feeds reasonFor().
   */
  function scoreItem(item, ctx) {
    const weights = ctx.weights || DEFAULT_WEIGHTS;
    const nowMs = ctx.nowMs || 0;
    const profile = ctx.profile || createProfile();
    const iFacets = ctx._facetsCache && ctx._facetsCache[item.id] ? ctx._facetsCache[item.id] : facets(item);

    const aff = affinity(profile, iFacets);
    const q = quality(item);
    const fr = freshness(item, nowMs);
    const cx = contextMatch(profile, item);
    const tr = trendingScore(item, ctx.trendingMap, ctx.trendingMax);
    const cv = coVisitationScore(item, ctx.covisMap);
    const seen = seenPenalty(item.id, ctx.seenMap, nowMs);

    const score =
      weights.affinity * aff.score +
      weights.coVisitation * cv +
      weights.trending * tr +
      weights.quality * q +
      weights.freshness * fr +
      weights.context * cx -
      weights.seenPenalty * seen;

    return {
      score: score,
      breakdown: { affinity: aff.score, affinityTop: aff.topKey, coVisitation: cv, trending: tr, quality: q, freshness: fr, context: cx, seen: seen }
    };
  }

  // ── Reasons (honest, human) ─────────────────────────────────────────────────

  function _prettyFacet(key) {
    if (!key) return '';
    const i = key.indexOf(':');
    const type = key.slice(0, i), val = key.slice(i + 1);
    const title = val.replace(/\b\w/g, (c) => c.toUpperCase());
    if (type === 'brand') return title;
    if (type === 'store') return title;
    if (type === 'subcategory' || type === 'category') return title;
    if (type === 'keyword') return val;
    if (type === 'city') return title;
    return title;
  }

  function reasonFor(breakdown, item) {
    if (!breakdown) return '';
    const b = breakdown;
    // Order by what actually drove the placement.
    if (b.affinity >= 0.62 && b.affinityTop) {
      const type = b.affinityTop.slice(0, b.affinityTop.indexOf(':'));
      const pretty = _prettyFacet(b.affinityTop);
      if (type === 'brand') return 'Because you like ' + pretty;
      if (type === 'store') return 'From ' + pretty + ', a store you browse';
      if (type === 'subcategory' || type === 'category') return 'More ' + pretty + ' for you';
      if (type === 'city') return 'Popular near you';
      if (type === 'keyword') return 'Matches what you search for';
      return 'Picked for you';
    }
    if (b.coVisitation >= 0.5) return 'People who viewed similar items looked at this';
    if (b.trending >= 0.6) return 'Trending on LOUMOO';
    if (b.context >= 0.5) return 'Popular near you';
    if (b.quality >= 0.7) return 'Highly rated';
    return 'Picked for you';
  }

  // ── Feed assembly: score → MMR diversity → exploration ──────────────────────

  function _similar(a, b) {
    // Cheap item-item similarity for the diversity penalty (0..1).
    if (!a || !b) return 0;
    let s = 0;
    if (baseTitle(a.title || a.name) === baseTitle(b.title || b.name)) return 1;
    if (norm(a.subcategory) && norm(a.subcategory) === norm(b.subcategory)) s += 0.5;
    else if (norm(a.category) && norm(a.category) === norm(b.category)) s += 0.25;
    if (norm(a.brand) && norm(a.brand) === norm(b.brand)) s += 0.3;
    if (storeKey(a) && storeKey(a) === storeKey(b)) s += 0.2;
    return Math.min(1, s);
  }

  /**
   * Rank a candidate pool into a page.
   * ctx: { profile, trendingMap, trendingMax, covisMap, seenMap, nowMs, weights, rng }
   * opts: { limit, lambda, exploreRatio, maxPerBaseTitle, maxPerStore, maxPerSubcategory, offset }
   */
  function rankFeed(items, ctx, opts) {
    opts = opts || {};
    const limit = opts.limit || 24;
    const lambda = opts.lambda != null ? opts.lambda : DEFAULT_LAMBDA;
    const exploreRatio = opts.exploreRatio != null ? opts.exploreRatio : DEFAULT_EXPLORE_RATIO;
    const maxBt = opts.maxPerBaseTitle || MAX_PER_BASE_TITLE;
    const maxStore = opts.maxPerStore || MAX_PER_STORE;
    const maxSub = opts.maxPerSubcategory || MAX_PER_SUBCATEGORY;
    const rng = ctx.rng || Math.random;
    const profile = ctx.profile || createProfile();
    const hasTaste = Object.keys(profile.short).length + Object.keys(profile.long).length > 0;

    // 1. Score all eligible candidates once.
    const facetsCache = {};
    const scored = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || !it.id || isExcluded(it, profile)) continue;
      facetsCache[it.id] = facets(it);
      const s = scoreItem(it, Object.assign({}, ctx, { _facetsCache: facetsCache }));
      scored.push({ item: it, base: s.score, breakdown: s.breakdown });
    }
    scored.sort((a, b) => b.base - a.base);

    // 2. Split into an exploit pool (top) and an explore pool (the long tail of
    //    things the user has little evidence on) for the bandit slots.
    const exploreSlots = hasTaste ? Math.round(limit * exploreRatio) : 0;
    const chosen = [];
    const usedBt = {}, usedStore = {}, usedSub = {};
    const canPlace = (it) => {
      const bt = baseTitle(it.title || it.name);
      const sk = storeKey(it) || '∅';
      const sub = norm(it.subcategory) || norm(it.category) || '∅';
      if ((usedBt[bt] || 0) >= maxBt) return false;
      if ((usedStore[sk] || 0) >= maxStore) return false;
      if ((usedSub[sub] || 0) >= maxSub) return false;
      return true;
    };
    const place = (entry, reasonOverride) => {
      const it = entry.item;
      const bt = baseTitle(it.title || it.name);
      const sk = storeKey(it) || '∅';
      const sub = norm(it.subcategory) || norm(it.category) || '∅';
      usedBt[bt] = (usedBt[bt] || 0) + 1;
      usedStore[sk] = (usedStore[sk] || 0) + 1;
      usedSub[sub] = (usedSub[sub] || 0) + 1;
      const out = Object.assign({}, it);
      out._recoScore = entry.base;
      out._recoBreakdown = entry.breakdown;
      out._recoReason = reasonOverride || reasonFor(entry.breakdown, it);
      out._recoExplore = !!reasonOverride;
      chosen.push(out);
    };

    // 3. MMR greedy selection over the exploit pool.
    // Normalise the raw relevance score to 0..1 (min-max over the scored pool)
    // so it is on the SAME scale as the 0..1 similarity penalty. Without this,
    // `base` spans several units while `maxSim` maxes at 1, so the diversity
    // term (<= 1-lambda) can never overcome a realistic relevance gap and the
    // MMR re-rank is effectively inert (lambda stops mattering).
    const pool = scored.slice();
    let bMax = -Infinity, bMin = Infinity;
    for (let i = 0; i < scored.length; i++) {
      if (scored[i].base > bMax) bMax = scored[i].base;
      if (scored[i].base < bMin) bMin = scored[i].base;
    }
    const bRange = (bMax - bMin) || 1;
    const takeMmr = (targetCount) => {
      while (chosen.length < targetCount && pool.length) {
        let bestIdx = -1, bestVal = -Infinity;
        for (let i = 0; i < pool.length; i++) {
          const cand = pool[i];
          if (!canPlace(cand.item)) continue;
          let maxSim = 0;
          for (let j = 0; j < chosen.length; j++) {
            const sim = _similar(cand.item, chosen[j]);
            if (sim > maxSim) maxSim = sim;
            if (maxSim >= 1) break;
          }
          const rel = (cand.base - bMin) / bRange; // 0..1, comparable to maxSim
          const mmr = lambda * rel - (1 - lambda) * maxSim;
          if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
        }
        if (bestIdx === -1) break; // nothing placeable under the caps
        const picked = pool.splice(bestIdx, 1)[0];
        place(picked);
      }
    };

    takeMmr(limit - exploreSlots);

    // 4. Exploration: sample from the mid/low pool, biased toward items whose
    //    dominant facet is NOT already strong in the profile (a light bandit).
    if (exploreSlots > 0 && pool.length) {
      const tail = pool.filter((e) => canPlace(e.item));
      // Weight = freshness/quality * randomness, lower for already-strong facets.
      const weighted = tail.map((e) => {
        const f = e.breakdown;
        const novelty = 1 - Math.min(1, f.affinity); // reward low-affinity (unknown) items
        const w = (0.4 + 0.6 * novelty) * (0.5 + 0.5 * (f.quality + f.trending)) * (0.5 + rng());
        return { e: e, w: w };
      }).sort((x, y) => y.w - x.w);
      for (let i = 0; i < weighted.length && chosen.length < limit; i++) {
        const e = weighted[i].e;
        if (!canPlace(e.item)) continue;
        place(e, 'Something new to discover');
        const idx = pool.indexOf(e);
        if (idx !== -1) pool.splice(idx, 1);
      }
    }

    // 5. Top up (relaxing the per-store/subcat caps) so a page is never short.
    if (chosen.length < limit && pool.length) {
      for (let i = 0; i < pool.length && chosen.length < limit; i++) {
        const bt = baseTitle(pool[i].item.title || pool[i].item.name);
        if ((usedBt[bt] || 0) >= maxBt) continue; // never relax the near-dup cap
        place(pool[i]);
        pool.splice(i, 1); i--;
      }
    }

    return chosen;
  }

  /**
   * Neighbours of a seed item for "More like this" / people-also-viewed.
   * Blends content similarity with a provided co-visitation map for the seed.
   */
  function moreLikeThis(seed, items, ctx, opts) {
    opts = opts || {};
    const limit = opts.limit || 12;
    const covis = (ctx && ctx.covisMap) || {};
    const seedBt = baseTitle(seed && (seed.title || seed.name));
    const profile = (ctx && ctx.profile) || createProfile();
    const out = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || !it.id || it.id === (seed && seed.id)) continue;
      if (baseTitle(it.title || it.name) === seedBt) continue; // skip exact dupes of the seed
      if (isExcluded(it, profile)) continue;
      const sim = _similar(seed, it);
      const cv = Math.min(1, covis[it.id] || 0);
      if (sim <= 0 && cv <= 0) continue;
      const q = quality(it);
      out.push({ item: it, s: 0.6 * sim + 0.9 * cv + 0.2 * q });
    }
    out.sort((a, b) => b.s - a.s);
    // Diversify the related strip lightly too.
    const picked = [], usedBt = {};
    for (let i = 0; i < out.length && picked.length < limit; i++) {
      const it = out[i].item;
      const bt = baseTitle(it.title || it.name);
      if (usedBt[bt]) continue;
      usedBt[bt] = 1;
      const o = Object.assign({}, it);
      o._recoScore = out[i].s;
      picked.push(o);
    }
    return picked;
  }

  return {
    // constants (exposed for tests + the client runtime)
    HALF_LIFE_SHORT_MS, HALF_LIFE_LONG_MS, SHORT_TERM_BLEND,
    EVENT_WEIGHTS, FACET_WEIGHT, DEFAULT_WEIGHTS,
    DEFAULT_LAMBDA, DEFAULT_EXPLORE_RATIO, MAX_PER_BASE_TITLE,
    RECENT_ITEMS_CAP, SEEN_HALF_LIFE_MS,
    // helpers
    toXaf, effectivePrice, priceBand, norm, baseTitle, tokenize, facets,
    decayFactor, dwellBoost, makeRng,
    // profile
    createProfile, decayProfile, applyEvent, mergeProfiles,
    // scoring
    affinity, quality, freshness, contextMatch, trendingScore,
    coVisitationScore, seenPenalty, isExcluded, scoreItem, reasonFor,
    // feed
    rankFeed, moreLikeThis
  };
});
