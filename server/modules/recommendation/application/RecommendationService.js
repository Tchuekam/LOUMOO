/**
 * LOUMOO Discovery Engine — application service
 * ===========================================================================
 * Orchestrates the recommendation pipeline on the server:
 *
 *   recordEvents  ingest a batch, update the subject's decayed profile, stitch
 *                 a guest to their account on sign-in, respect the opt-out.
 *   getFeed       rank the candidate pool for the subject (personalized, or
 *                 trending/recency when personalization is off or cold).
 *   getSimilar    "more like this" + people-also-viewed for an item.
 *   getTrending   non-personalized trending (opt-out / cold fallback).
 *   getProfile    the subject's own learned taste, for "Why am I seeing this?".
 *   feedback      not_interested / hide_store / reset controls.
 *
 * Trending (distinct subjects per item in a window) and co-visitation (items
 * seen by the same subject) are computed from the event log and cached.
 */

const core = require('../../../../src/services/recommendationCore.js');
const repo = require('../infrastructure/RecommendationRepository');
const candidates = require('../infrastructure/CandidateProvider');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

let PrivacyPreferencesUseCase = null;
try { PrivacyPreferencesUseCase = require('../../identity/application/PrivacyPreferencesUseCase'); } catch (e) { /* optional */ }

const NS = 'reco';
const TRENDING_KEY = 'reco:trending';
const TRENDING_TTL = 120;
const STITCH_TTL = 86400; // once per day per (visitor,user)
const IMPRESSION_DEDUP_TTL = 900;
const RECENT_WINDOW_MS = 7 * 24 * 3600 * 1000;
const POSITIVE_TYPES = ['click', 'view', 'save', 'add_to_cart', 'purchase'];
const MAX_EVENTS_PER_BATCH = 50;

const VALID_EVENTS = new Set(Object.keys(core.EVENT_WEIGHTS).concat(['pdp_dwell', 'remove_from_cart']));

class RecommendationService {
  // ── Ingestion ─────────────────────────────────────────────────────────────

  async recordEvents(ctx, payload) {
    const userId = (ctx && ctx.userId) || null;
    const visitorId = payload && payload.visitorId ? String(payload.visitorId).slice(0, 80) : null;
    const subjectId = userId || visitorId;
    if (!subjectId) return { recorded: 0, reason: 'no-subject' };

    // Honour the personalization opt-out: learn nothing.
    if (userId && !(await this._personalizationOn(userId))) {
      return { recorded: 0, reason: 'opted-out' };
    }

    // Stitch a guest's history onto the account the first time both ids appear.
    if (userId && visitorId && visitorId !== userId) {
      await this._stitch(visitorId, userId);
    }

    const raw = Array.isArray(payload && payload.events) ? payload.events.slice(0, MAX_EVENTS_PER_BATCH) : [];
    const now = Date.now();
    const rows = [];
    const accepted = [];
    for (let i = 0; i < raw.length; i++) {
      const e = raw[i] || {};
      const type = String(e.type || e.event_type || '').trim();
      if (!VALID_EVENTS.has(type)) continue;

      // Dedup repeated impressions of the same item per subject (cost + noise).
      if (type === 'impression' && e.itemId) {
        const dkey = `imp:${subjectId}:${e.itemId}`;
        const seen = await CacheService.get(dkey, NS);
        if (seen) continue;
        try { await CacheService.set(dkey, 1, IMPRESSION_DEDUP_TTL, NS); } catch (x) { /* non-fatal */ }
      }

      const norm = {
        type: type,
        itemId: e.itemId ? String(e.itemId).slice(0, 80) : null,
        category: e.category ? String(e.category).slice(0, 64) : null,
        subcategory: e.subcategory ? String(e.subcategory).slice(0, 64) : null,
        brand: e.brand ? String(e.brand).slice(0, 80) : null,
        storeName: e.storeName ? String(e.storeName).slice(0, 160) : null,
        priceXaf: e.priceXaf != null ? core.toXaf(e.priceXaf) : null,
        city: e.city ? String(e.city).slice(0, 80) : null,
        dwellMs: e.dwellMs != null ? Math.max(0, Math.min(600000, core.toXaf(e.dwellMs))) : null,
        query: e.query ? String(e.query).slice(0, 120) : null,
        position: e.position != null ? core.toXaf(e.position) : null,
        surface: e.surface ? String(e.surface).slice(0, 32) : null,
        ts: now
      };
      accepted.push(norm);
      rows.push({
        subject_id: subjectId,
        subject_kind: userId ? 'user' : 'visitor',
        user_id: userId,
        event_type: type === 'pdp_dwell' ? 'dwell' : type, // DB enum maps pdp_dwell→dwell
        item_id: norm.itemId,
        category: norm.category,
        subcategory: norm.subcategory,
        brand: norm.brand,
        store_name: norm.storeName,
        price_xaf: norm.priceXaf,
        city: norm.city,
        metadata: {
          dwellMs: norm.dwellMs, query: norm.query, position: norm.position,
          surface: norm.surface, kind: type
        }
      });
    }

    if (!accepted.length) return { recorded: 0 };

    await repo.insertEvents(rows);

    // Fold into the live profile.
    const profile = await this._loadProfile(subjectId);
    for (let i = 0; i < accepted.length; i++) {
      core.applyEvent(profile, this._eventForCore(accepted[i]), now);
    }
    await this._saveProfile(subjectId, userId ? 'user' : 'visitor', userId, profile);

    return { recorded: accepted.length };
  }

  _eventForCore(e) {
    // The core wants facets or an item; we pass the denormalised facets directly.
    const facets = {};
    const W = core.FACET_WEIGHT;
    if (e.category) facets['category:' + core.norm(e.category)] = W.category;
    if (e.subcategory) facets['subcategory:' + core.norm(e.subcategory)] = W.subcategory;
    if (e.brand) facets['brand:' + core.norm(e.brand)] = W.brand;
    if (e.storeName) facets['store:' + core.norm(e.storeName)] = W.store;
    if (e.priceXaf) facets['priceBand:' + core.priceBand(e.priceXaf)] = W.priceBand;
    if (e.city) facets['city:' + core.norm(e.city)] = W.city;
    return {
      type: e.type, itemId: e.itemId, storeName: e.storeName,
      dwellMs: e.dwellMs, query: e.query, category: e.category,
      facets: Object.keys(facets).length ? facets : null, ts: e.ts
    };
  }

  // ── Feed ────────────────────────────────────────────────────────────────────

  async getFeed(ctx, params) {
    const userId = (ctx && ctx.userId) || null;
    const visitorId = params && params.visitorId ? String(params.visitorId).slice(0, 80) : null;
    const subjectId = userId || visitorId;
    const limit = Math.max(1, Math.min(60, parseInt(params && params.limit, 10) || 24));
    const offset = Math.max(0, parseInt(params && params.cursor, 10) || 0);

    const personalized = !userId || (await this._personalizationOn(userId));
    const pool = await candidates.getPool();
    const now = Date.now();

    if (!personalized || !subjectId) {
      const ranked = await this._trendingFeed(pool, { limit: limit + offset, city: params && params.city });
      return this._page(ranked, offset, limit, { personalized: false });
    }

    let profile = await this._loadProfile(subjectId);
    profile = this._seedColdStart(profile, ctx, now);

    const trending = await this._trendingMap();
    const recentIds = (profile.recent || []).slice(0, 6).map((r) => r.id);
    const covisMap = await this._covisMap(recentIds);
    const seenMap = (params && params.seen) || {};

    const ranked = core.rankFeed(pool, {
      profile: profile,
      trendingMap: trending.map,
      trendingMax: trending.max,
      covisMap: covisMap,
      seenMap: seenMap,
      nowMs: now
    }, { limit: limit + offset });

    return this._page(ranked, offset, limit, { personalized: true });
  }

  _page(ranked, offset, limit, meta) {
    const slice = ranked.slice(offset, offset + limit);
    return {
      items: slice,
      personalized: !!meta.personalized,
      nextCursor: (offset + limit) < ranked.length ? String(offset + limit) : null,
      total: ranked.length
    };
  }

  async _trendingFeed(pool, { limit, city }) {
    const trending = await this._trendingMap();
    const now = Date.now();
    const empty = core.createProfile();
    // Rank with an empty profile → quality + trending + freshness + context.
    const ctxProfile = city ? core.applyEvent(empty, { type: 'view', facets: { ['city:' + core.norm(city)]: core.FACET_WEIGHT.city }, ts: now }, now) : empty;
    return core.rankFeed(pool, {
      profile: ctxProfile, trendingMap: trending.map, trendingMax: trending.max, nowMs: now
    }, { limit: limit, exploreRatio: 0 });
  }

  // ── Similar / more-like-this ────────────────────────────────────────────────

  async getSimilar(ctx, params) {
    const itemId = params && params.itemId;
    const limit = Math.max(1, Math.min(24, parseInt(params && params.limit, 10) || 12));
    const pool = await candidates.getPool();
    const seed = pool.find((p) => p.id === itemId) || (await candidates.getById(itemId));
    if (!seed) return { items: [], seedId: itemId };

    const covisMap = await this._covisMap([itemId]);
    const userId = (ctx && ctx.userId) || null;
    const visitorId = params && params.visitorId ? String(params.visitorId).slice(0, 80) : null;
    const subjectId = userId || visitorId;
    const profile = subjectId ? await this._loadProfile(subjectId) : core.createProfile();

    const items = core.moreLikeThis(seed, pool, { covisMap: covisMap, profile: profile }, { limit: limit });
    return { items: items, seedId: itemId };
  }

  async getTrending(params) {
    const limit = Math.max(1, Math.min(60, parseInt(params && params.limit, 10) || 24));
    const pool = await candidates.getPool();
    const ranked = await this._trendingFeed(pool, { limit: limit, city: params && params.city });
    return { items: ranked.slice(0, limit), personalized: false };
  }

  // ── "Why am I seeing this?" ─────────────────────────────────────────────────

  async getProfileSummary(ctx) {
    const userId = ctx && ctx.userId;
    if (!userId) return { interests: [], eventCount: 0 };
    const profile = core.decayProfile(await this._loadProfile(userId), Date.now());
    const top = [];
    const blended = {};
    const add = (map, mul) => { for (const k in map) blended[k] = (blended[k] || 0) + map[k] * mul; };
    add(profile.short, core.SHORT_TERM_BLEND);
    add(profile.long, 1 - core.SHORT_TERM_BLEND);
    const prefixes = { category: 'Categories', subcategory: 'Types', brand: 'Brands', store: 'Stores' };
    for (const k in blended) {
      const t = k.slice(0, k.indexOf(':'));
      if (!prefixes[t] || blended[k] <= 0) continue;
      top.push({ facet: t, label: k.slice(k.indexOf(':') + 1), weight: Math.round(blended[k] * 100) / 100 });
    }
    top.sort((a, b) => b.weight - a.weight);
    return {
      interests: top.slice(0, 12),
      eventCount: profile.eventCount || 0,
      hiddenStores: Object.keys(profile.hiddenStores || {}),
      notInterestedCount: Object.keys(profile.suppressedItems || {}).length
    };
  }

  // ── Feedback controls ────────────────────────────────────────────────────────

  async feedback(ctx, params) {
    const userId = (ctx && ctx.userId) || null;
    const visitorId = params && params.visitorId ? String(params.visitorId).slice(0, 80) : null;
    const subjectId = userId || visitorId;
    const action = params && params.action;
    if (!subjectId) return { ok: false, reason: 'no-subject' };

    if (action === 'reset') {
      await repo.deleteSubject(subjectId, { includeEvents: true });
      try { await CacheService.del(`profile:${subjectId}`, NS); } catch (e) { /* non-fatal */ }
      return { ok: true, action: 'reset' };
    }

    if (action === 'not_interested' || action === 'hide_store') {
      const now = Date.now();
      await repo.insertEvents([{
        subject_id: subjectId, subject_kind: userId ? 'user' : 'visitor', user_id: userId,
        event_type: action, item_id: params.itemId || null, store_name: params.storeName || null,
        category: params.category || null, metadata: { surface: params.surface || null }
      }]);
      const profile = await this._loadProfile(subjectId);
      core.applyEvent(profile, {
        type: action, itemId: params.itemId || null, storeName: params.storeName || null
      }, now);
      await this._saveProfile(subjectId, userId ? 'user' : 'visitor', userId, profile);
      return { ok: true, action: action };
    }

    return { ok: false, reason: 'unknown-action' };
  }

  /** Called from the sign-in path (and lazily from recordEvents). */
  async linkOnSignIn(userId, visitorId) {
    if (!userId || !visitorId || userId === visitorId) return;
    await this._stitch(visitorId, userId);
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  async _personalizationOn(userId) {
    if (!PrivacyPreferencesUseCase) return true;
    try {
      const prefs = await PrivacyPreferencesUseCase.getPreferences(userId);
      return prefs ? prefs.personalizedRecommendations !== false : true;
    } catch (err) {
      return true; // fail open: personalization is the default
    }
  }

  async _stitch(visitorId, userId) {
    const flagKey = `stitch:${visitorId}:${userId}`;
    try { if (await CacheService.get(flagKey, NS)) return; } catch (e) { /* ignore */ }
    const now = Date.now();
    await repo.attributeVisitorEvents(visitorId, userId);
    const guest = await this._loadProfile(visitorId);
    if (guest && (guest.eventCount || Object.keys(guest.short).length)) {
      const user = await this._loadProfile(userId);
      const merged = core.mergeProfiles(user, guest, now);
      await this._saveProfile(userId, 'user', userId, merged);
      await repo.deleteSubject(visitorId, { includeEvents: false }); // keep events (now attributed), drop guest profile
      try { await CacheService.del(`profile:${visitorId}`, NS); } catch (e) { /* ignore */ }
    }
    try { await CacheService.set(flagKey, 1, STITCH_TTL, NS); } catch (e) { /* ignore */ }
  }

  _seedColdStart(profile, ctx, now) {
    if (!profile) profile = core.createProfile();
    const hasTaste = Object.keys(profile.short).length + Object.keys(profile.long).length > 0;
    if (hasTaste) return profile;
    const principal = ctx && ctx.principal;
    if (!principal) return profile;
    // Seed a TRANSIENT (non-persisted) profile from declared interests so a
    // brand-new user still gets a relevant-ish first feed.
    const clone = core.createProfile();
    clone.decayedAt = now;
    const interests = principal.buyerInterests || [];
    for (let i = 0; i < interests.length; i++) {
      const c = core.norm(interests[i]);
      if (c) clone.long['category:' + c] = (clone.long['category:' + c] || 0) + 1.2;
    }
    if (principal.city) clone.long['city:' + core.norm(principal.city)] = core.FACET_WEIGHT.city;
    return clone;
  }

  async _loadProfile(subjectId) {
    const ck = `profile:${subjectId}`;
    try {
      const cached = await CacheService.get(ck, NS);
      if (cached) return this._deserializeProfile(cached);
    } catch (e) { /* ignore */ }
    const row = await repo.loadProfileRow(subjectId);
    const profile = this._deserializeProfile(row);
    return profile;
  }

  async _saveProfile(subjectId, subjectKind, userId, profile) {
    const row = {
      subject_id: subjectId,
      subject_kind: subjectKind,
      user_id: userId || null,
      short_term: profile.short || {},
      long_term: profile.long || {},
      suppressed: { items: profile.suppressedItems || {}, stores: profile.hiddenStores || {} },
      recent_items: profile.recent || [],
      event_count: profile.eventCount || 0,
      decayed_at: new Date(profile.decayedAt || Date.now()).toISOString()
    };
    await repo.saveProfileRow(row);
    try { await CacheService.set(`profile:${subjectId}`, row, 1800, NS); } catch (e) { /* non-fatal */ }
  }

  _deserializeProfile(row) {
    const p = core.createProfile();
    if (!row) return p;
    p.short = row.short_term || {};
    p.long = row.long_term || {};
    const sup = row.suppressed || {};
    p.suppressedItems = sup.items || {};
    p.hiddenStores = sup.stores || {};
    p.recent = Array.isArray(row.recent_items) ? row.recent_items : [];
    p.eventCount = row.event_count || 0;
    p.decayedAt = Date.parse(row.decayed_at) || Date.now();
    return p;
  }

  async _trendingMap() {
    try {
      const cached = await CacheService.get(TRENDING_KEY, NS);
      if (cached) return cached;
    } catch (e) { /* ignore */ }
    const since = Date.now() - RECENT_WINDOW_MS;
    const events = await repo.listRecentEvents({ sinceMs: since, types: POSITIVE_TYPES, limit: 5000 });
    // Distinct subjects per item, weighted by event strength.
    const perItem = {};
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e.item_id) continue;
      const w = core.EVENT_WEIGHTS[e.event_type] || 1;
      if (!perItem[e.item_id]) perItem[e.item_id] = { subjects: {}, score: 0 };
      if (!perItem[e.item_id].subjects[e.subject_id]) {
        perItem[e.item_id].subjects[e.subject_id] = 1;
        perItem[e.item_id].score += Math.max(0.5, w);
      }
    }
    const map = {};
    let max = 1;
    for (const id in perItem) { map[id] = perItem[id].score; if (map[id] > max) max = map[id]; }
    const out = { map: map, max: max };
    try { await CacheService.set(TRENDING_KEY, out, TRENDING_TTL, NS); } catch (e) { /* ignore */ }
    return out;
  }

  async _covisMap(itemIds) {
    if (!itemIds || !itemIds.length) return {};
    const key = 'covis:' + itemIds.slice().sort().join(',').slice(0, 200);
    try {
      const cached = await CacheService.get(key, NS);
      if (cached) return cached;
    } catch (e) { /* ignore */ }
    const since = Date.now() - RECENT_WINDOW_MS;
    const events = await repo.listRecentEvents({ sinceMs: since, types: ['view', 'click'], limit: 5000 });
    // Group item views by subject into sessions.
    const bySubject = {};
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (!e.item_id) continue;
      (bySubject[e.subject_id] = bySubject[e.subject_id] || new Set()).add(e.item_id);
    }
    const seeds = new Set(itemIds);
    const co = {};
    for (const sid in bySubject) {
      const set = bySubject[sid];
      let touchesSeed = false;
      for (const s of seeds) if (set.has(s)) { touchesSeed = true; break; }
      if (!touchesSeed) continue;
      for (const other of set) {
        if (seeds.has(other)) continue;
        co[other] = (co[other] || 0) + 1;
      }
    }
    let max = 1;
    for (const k in co) if (co[k] > max) max = co[k];
    const norm = {};
    for (const k in co) norm[k] = co[k] / max;
    try { await CacheService.set(key, norm, TRENDING_TTL, NS); } catch (e) { /* ignore */ }
    return norm;
  }
}

module.exports = new RecommendationService();
