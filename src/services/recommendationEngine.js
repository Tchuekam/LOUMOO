/**
 * LOUMOO Discovery Engine — browser runtime
 * ===========================================================================
 * The client half of the For-You system. It:
 *   • gives every visitor a stable anonymous id (stitched to their account on
 *     sign-in by the server),
 *   • captures interactions (impression, dwell, click, save, cart, purchase,
 *     search, feedback) and flushes them to the server in batches via
 *     navigator.sendBeacon,
 *   • keeps a LOCAL decayed preference profile in localStorage so the feed
 *     re-ranks instantly, in the browser, as the user acts — no round-trip,
 *     works for guests and offline,
 *   • enriches that local ranking with cross-user signals (trending,
 *     co-visitation) fetched from the server once per session.
 *
 * It exposes `window.LoumooReco`. Everything is wrapped so a failure here can
 * never break the app; when the core or storage is unavailable, callers fall
 * back to the catalogue's natural order.
 *
 * The scoring maths live in recommendationCore.js (shared with the server).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var CORE = window.LoumooRecoCore || null;
  var LS = (function () {
    try { var t = '__reco_t'; window.localStorage.setItem(t, '1'); window.localStorage.removeItem(t); return window.localStorage; } catch (e) { return null; }
  })();

  var K_VISITOR = 'loumoo_visitor_id';
  var K_PROFILE = 'loumoo_reco_profile';
  var K_SEEN = 'loumoo_reco_seen';

  var FLUSH_EVERY_MS = 6000;
  var FLUSH_AT = 15; // events
  var IMPRESSION_MIN_MS = 650; // visible this long before it counts
  var SEEN_CAP = 600;
  var SERVER_REFRESH_MS = 4 * 60 * 1000;

  function nowMs() { return Date.now(); }
  function safeParse(s, fb) { try { return s ? JSON.parse(s) : fb; } catch (e) { return fb; } }
  function lsGet(k, fb) { if (!LS) return fb; try { return LS.getItem(k); } catch (e) { return fb; } }
  function lsSet(k, v) { if (!LS) return; try { LS.setItem(k, v); } catch (e) { /* quota/full */ } }

  function uuid() {
    try {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    } catch (e) { /* fall through */ }
    return 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  // ── Identity ────────────────────────────────────────────────────────────────
  var _visitorId = (function () {
    var v = lsGet(K_VISITOR, null);
    if (!v) { v = uuid(); lsSet(K_VISITOR, v); }
    return v;
  })();

  // ── Local profile + seen map ─────────────────────────────────────────────────
  var _profile = (function () {
    var raw = safeParse(lsGet(K_PROFILE, null), null);
    if (raw && CORE) return raw;
    return CORE ? CORE.createProfile() : { short: {}, long: {}, suppressedItems: {}, hiddenStores: {}, recent: [], eventCount: 0, decayedAt: nowMs() };
  })();
  var _seen = safeParse(lsGet(K_SEEN, null), {}) || {};

  var _profileDirty = false;
  var _rankVersion = 0; // bumped whenever the profile changes, to invalidate the memoized feed

  function persistProfile() {
    lsSet(K_PROFILE, JSON.stringify(_profile));
  }
  function persistSeen() {
    // Trim to the most-recent SEEN_CAP before persisting.
    var keys = Object.keys(_seen);
    if (keys.length > SEEN_CAP) {
      keys.sort(function (a, b) { return _seen[b] - _seen[a]; });
      var next = {};
      for (var i = 0; i < SEEN_CAP; i++) next[keys[i]] = _seen[keys[i]];
      _seen = next;
    }
    lsSet(K_SEEN, JSON.stringify(_seen));
  }

  // ── Server signal cache (trending + co-visitation) ──────────────────────────
  var _serverSignals = { trendingMap: {}, trendingMax: 1, covisMap: {}, at: 0 };

  function getApi() {
    return window.LoumooAPI || (typeof globalThis !== 'undefined' ? globalThis.LoumooAPI : null) || null;
  }

  function refreshServerSignals(force) {
    var api = getApi();
    if (!api || !api.getRecoTrending) return;
    if (!force && (nowMs() - _serverSignals.at) < SERVER_REFRESH_MS) return;
    _serverSignals.at = nowMs();
    try {
      api.getRecoTrending({ limit: 60 }).then(function (res) {
        var items = (res && res.items) || [];
        var map = {}, max = 1;
        for (var i = 0; i < items.length; i++) {
          // Server returns items already scored; approximate a trend weight by rank.
          var w = items.length - i;
          map[items[i].id] = w;
          if (w > max) max = w;
        }
        _serverSignals.trendingMap = map;
        _serverSignals.trendingMax = max;
        _rankVersion++;
      }).catch(function () { /* offline: local ranking still works */ });
    } catch (e) { /* ignore */ }
  }

  // ── Event buffer + flush ─────────────────────────────────────────────────────
  var _buf = [];
  var _flushTimer = null;

  function scheduleFlush() {
    if (_flushTimer) return;
    _flushTimer = setTimeout(function () { _flushTimer = null; flush(false); }, FLUSH_EVERY_MS);
  }

  function flush(useBeacon) {
    if (!_buf.length) return;
    var batch = _buf.splice(0, _buf.length);
    var payload = { visitorId: _visitorId, events: batch };
    var url = '/api/v1/recommendations/events';
    // Prefer sendBeacon on unload (fire-and-forget, survives navigation).
    if (useBeacon && navigator && navigator.sendBeacon) {
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) return;
      } catch (e) { /* fall through to fetch */ }
    }
    var api = getApi();
    if (api && api.recordRecoEvents) {
      try { api.recordRecoEvents(payload).catch(function () { /* dropped */ }); return; } catch (e) { /* fall through */ }
    }
    try {
      window.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true, credentials: 'same-origin' }).catch(function () {});
    } catch (e) { /* give up silently */ }
  }

  // ── Core event path ───────────────────────────────────────────────────────────
  function facetsOf(item) {
    if (!item) return {};
    return {
      itemId: item.id,
      category: item.category || null,
      subcategory: item.subcategory || null,
      brand: item.brand || null,
      storeName: item.storeName || item.store || item.merchant || null,
      priceXaf: item.priceNumeric != null ? item.priceNumeric : (item.price || null),
      city: item.storeCity || item.merchantCity || item.city || null
    };
  }

  /** Record one event: update the local profile immediately, buffer for server. */
  function track(ev) {
    if (!ev || !ev.type) return;
    try {
      if (CORE) {
        CORE.applyEvent(_profile, {
          type: ev.type === 'pdp_dwell' ? 'pdp_dwell' : ev.type,
          itemId: ev.itemId || null,
          storeName: ev.storeName || null,
          dwellMs: ev.dwellMs || null,
          query: ev.query || null,
          category: ev.category || null,
          facets: ev.item ? CORE.facets(ev.item) : null,
          item: ev.item || null
        }, nowMs());
        _profileDirty = true;
        _rankVersion++;
        persistProfile();
      }
    } catch (e) { /* ignore */ }
    // Strip the heavy item object before sending; keep only facets.
    var wire = {
      type: ev.type, itemId: ev.itemId || null,
      category: ev.category || (ev.item && ev.item.category) || null,
      subcategory: ev.subcategory || (ev.item && ev.item.subcategory) || null,
      brand: ev.brand || (ev.item && ev.item.brand) || null,
      storeName: ev.storeName || (ev.item && (ev.item.storeName || ev.item.store)) || null,
      priceXaf: ev.priceXaf != null ? ev.priceXaf : (ev.item && (ev.item.priceNumeric != null ? ev.item.priceNumeric : ev.item.price)) || null,
      city: ev.city || (ev.item && (ev.item.storeCity || ev.item.merchantCity)) || null,
      dwellMs: ev.dwellMs || null, query: ev.query || null,
      position: ev.position != null ? ev.position : null, surface: ev.surface || null
    };
    _buf.push(wire);
    if (_buf.length >= FLUSH_AT) flush(false); else scheduleFlush();
  }

  /** Convenience wrappers that pull facets straight from an item object. */
  function note(kind, item, extra) {
    var f = facetsOf(item);
    track({
      type: kind, item: item, itemId: f.itemId,
      category: f.category, subcategory: f.subcategory, brand: f.brand,
      storeName: f.storeName, priceXaf: f.priceXaf, city: f.city,
      dwellMs: extra && extra.dwellMs, position: extra && extra.position, surface: extra && extra.surface
    });
  }

  function search(query, category) {
    track({ type: 'search', query: String(query || ''), category: category || null, surface: 'search' });
  }

  // ── Impression + dwell via a shared IntersectionObserver ─────────────────────
  var _io = null;
  var _elState = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  function ensureObserver() {
    if (_io || typeof IntersectionObserver === 'undefined') return _io;
    _io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var en = entries[i];
        var st = _elState && _elState.get(en.target);
        if (!st) continue;
        if (en.isIntersecting && en.intersectionRatio >= 0.5) {
          if (!st.enteredAt) st.enteredAt = nowMs();
          if (!st.impressionTimer) {
            st.impressionTimer = setTimeout((function (s) {
              return function () {
                if (!s.impressed) { s.impressed = true; note('impression', s.item, { position: s.position, surface: s.surface }); }
              };
            })(st), IMPRESSION_MIN_MS);
          }
        } else {
          if (st.impressionTimer) { clearTimeout(st.impressionTimer); st.impressionTimer = null; }
          if (st.enteredAt) {
            var dwell = nowMs() - st.enteredAt;
            st.enteredAt = 0;
            if (st.impressed && dwell > 900) note('dwell', st.item, { dwellMs: dwell, position: st.position, surface: st.surface });
          }
        }
      }
    }, { threshold: [0, 0.5, 1] });
    return _io;
  }

  /**
   * Register a card element for impression/dwell tracking. Idempotent per
   * element (safe to call from a DC ref that fires on every render).
   */
  function watch(el, item, opts) {
    if (!el || !item || !item.id) return;
    try {
      var io = ensureObserver();
      if (!io || !_elState) return;
      var existing = _elState.get(el);
      if (existing) { existing.item = item; existing.position = opts && opts.position; existing.surface = (opts && opts.surface) || 'home_feed'; return; }
      _elState.set(el, { item: item, position: opts && opts.position, surface: (opts && opts.surface) || 'home_feed', enteredAt: 0, impressed: false, impressionTimer: null });
      io.observe(el);
    } catch (e) { /* ignore */ }
  }

  // ── Ranking (local-first, memoized) ──────────────────────────────────────────
  var _rankCache = { version: -1, poolLen: -1, limit: -1, out: null };

  function markSeen(items) {
    if (!items || !items.length) return;
    var t = nowMs();
    for (var i = 0; i < items.length; i++) if (items[i] && items[i].id) _seen[items[i].id] = t;
    persistSeen();
  }

  /**
   * Rank a pool of full item objects into a personalized order. Memoized on
   * (rankVersion, poolLength, limit) so the DC render loop can call it freely.
   */
  function rankHome(pool, opts) {
    opts = opts || {};
    var limit = opts.limit || 24;
    if (!CORE || !pool || !pool.length) return (pool || []).slice(0, limit);
    if (_rankCache.out && _rankCache.version === _rankVersion && _rankCache.poolLen === pool.length && _rankCache.limit === limit) {
      return _rankCache.out;
    }
    var out;
    try {
      out = CORE.rankFeed(pool, {
        profile: _profile,
        trendingMap: _serverSignals.trendingMap,
        trendingMax: _serverSignals.trendingMax,
        covisMap: _serverSignals.covisMap,
        seenMap: _seen,
        nowMs: nowMs()
      }, { limit: limit });
    } catch (e) {
      out = pool.slice(0, limit);
    }
    _rankCache = { version: _rankVersion, poolLen: pool.length, limit: limit, out: out };
    markSeen(out);
    return out;
  }

  function similarLocal(seed, pool, opts) {
    if (!CORE || !seed || !pool) return [];
    try {
      return CORE.moreLikeThis(seed, pool, { profile: _profile, covisMap: _serverSignals.covisMap }, { limit: (opts && opts.limit) || 12 });
    } catch (e) { return []; }
  }

  function recentItemIds(n) {
    return (_profile.recent || []).slice(0, n || 12).map(function (r) { return r.id; });
  }

  // ── Controls ──────────────────────────────────────────────────────────────────
  function feedback(action, item, storeName) {
    try {
      if (CORE) {
        if (action === 'not_interested' && item) CORE.applyEvent(_profile, { type: 'not_interested', itemId: item.id }, nowMs());
        else if (action === 'hide_store') CORE.applyEvent(_profile, { type: 'hide_store', storeName: storeName || (item && (item.storeName || item.store)) }, nowMs());
        _rankVersion++; persistProfile();
      }
    } catch (e) { /* ignore */ }
    var api = getApi();
    if (api && api.recoFeedback) {
      try {
        api.recoFeedback({ action: action, itemId: item && item.id, storeName: storeName || (item && (item.storeName || item.store)), category: item && item.category, visitorId: _visitorId, surface: 'home_feed' }).catch(function () {});
      } catch (e) { /* ignore */ }
    }
  }

  function reset() {
    try { _profile = CORE ? CORE.createProfile() : { short: {}, long: {}, suppressedItems: {}, hiddenStores: {}, recent: [], eventCount: 0, decayedAt: nowMs() }; } catch (e) { /* ignore */ }
    _seen = {}; _rankVersion++;
    persistProfile(); persistSeen();
    var api = getApi();
    if (api && api.recoFeedback) { try { api.recoFeedback({ action: 'reset', visitorId: _visitorId }).catch(function () {}); } catch (e) { /* ignore */ } }
  }

  function why(item) {
    if (!item) return '';
    if (item._recoReason) return item._recoReason;
    try {
      if (!CORE) return '';
      var s = CORE.scoreItem(item, { profile: _profile, trendingMap: _serverSignals.trendingMap, trendingMax: _serverSignals.trendingMax, covisMap: _serverSignals.covisMap, seenMap: _seen, nowMs: nowMs() });
      return CORE.reasonFor(s.breakdown, item);
    } catch (e) { return ''; }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────────
  function onVisibility() { if (document.visibilityState === 'hidden') flush(true); }
  try {
    window.addEventListener('pagehide', function () { flush(true); }, { passive: true });
    window.addEventListener('beforeunload', function () { flush(true); });
    document.addEventListener('visibilitychange', onVisibility);
  } catch (e) { /* ignore */ }

  // Prime cross-user signals shortly after boot and on an interval.
  try { setTimeout(function () { refreshServerSignals(true); }, 1200); } catch (e) { /* ignore */ }

  window.LoumooReco = {
    version: 1,
    getVisitorId: function () { return _visitorId; },
    track: track,
    note: note,
    search: search,
    watch: watch,
    rankHome: rankHome,
    similarLocal: similarLocal,
    recentItemIds: recentItemIds,
    refreshSignals: refreshServerSignals,
    feedback: feedback,
    reset: reset,
    why: why,
    flush: function () { flush(false); },
    _profile: function () { return _profile; } // debug
  };
})();
