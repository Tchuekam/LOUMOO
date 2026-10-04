/**
 * LOUMOO Discovery Engine — candidate provider
 * ===========================================================================
 * The pool of items the engine ranks: the curated catalogue (always available,
 * in-memory) merged with live published seller listings (DB-first, best effort).
 * Live listings take precedence on id collisions. The merged pool is small
 * (~1k) and cached, so a full re-rank per request is cheap.
 */

const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');

const POOL_KEY = 'reco:candidate_pool';
const POOL_TTL = 120; // seconds
const NS = 'reco';

class CandidateProvider {
  _curated() {
    try {
      const { catalogProducts } = require('../../catalog/dataLoader');
      const out = [];
      for (const id in catalogProducts) {
        if (!Object.prototype.hasOwnProperty.call(catalogProducts, id)) continue;
        const p = catalogProducts[id];
        out.push(Object.assign({ id: id, curated: true }, p));
      }
      return out;
    } catch (err) {
      logger.warn(`[Reco] curated catalogue unavailable: ${err.message}`);
      return [];
    }
  }

  async _live() {
    try {
      const CatalogRepository = require('../../catalog/infrastructure/CatalogRepository');
      const res = await CatalogRepository.listPublishedListings({ limit: 100, page: 1, sortBy: 'recent' });
      return (res && res.items) || [];
    } catch (err) {
      return [];
    }
  }

  /** The merged, de-duplicated candidate pool. Cached (namespace `reco`). */
  async getPool() {
    const cached = await CacheService.get(POOL_KEY, NS);
    if (cached && Array.isArray(cached) && cached.length) return cached;

    const curated = this._curated();
    const live = await this._live();
    const byId = {};
    // Live first so it wins on id collisions, then curated fills the rest.
    for (let i = 0; i < live.length; i++) if (live[i] && live[i].id) byId[live[i].id] = live[i];
    for (let i = 0; i < curated.length; i++) if (curated[i] && !byId[curated[i].id]) byId[curated[i].id] = curated[i];
    const pool = Object.keys(byId).map((k) => byId[k]);

    if (pool.length) {
      try { await CacheService.set(POOL_KEY, pool, POOL_TTL, NS); } catch (e) { /* non-fatal */ }
    }
    return pool;
  }

  /** Fast id → item lookup over the pool. */
  async getById(id) {
    if (!id) return null;
    const pool = await this.getPool();
    for (let i = 0; i < pool.length; i++) if (pool[i].id === id) return pool[i];
    return null;
  }
}

module.exports = new CandidateProvider();
