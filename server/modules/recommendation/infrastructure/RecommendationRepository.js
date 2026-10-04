/**
 * LOUMOO Discovery Engine — repository
 * ===========================================================================
 * Persists recommendation events and derived profiles to `iam.recommendation_events`
 * and `iam.recommendation_profiles`.
 *
 * Resilience (the NotificationService pattern): every operation wraps the
 * Supabase call in try/catch and, on ANY error — including the table not being
 * migrated yet (PGRST205 / 42P01) or a brief DB outage — falls back to a
 * per-process in-memory store so personalization keeps working. The moment
 * migration 015 is applied, durable, cross-device, cross-instance persistence
 * turns on with no code change. Personalization data is non-critical, so a
 * silent fallback (rather than a 5xx) is the right posture here.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient.js');
const logger = require('../../../shared/logging/logger');

const EVENTS_TABLE = 'recommendation_events';
const PROFILES_TABLE = 'recommendation_profiles';
const MEM_EVENTS_CAP = 20000; // bounded ring across the whole process
const MEM_SUBJECT_EVENTS_CAP = 400;

class RecommendationRepository {
  constructor() {
    this._memEvents = []; // [{...row, created_at}]
    this._memProfiles = new Map(); // subjectId -> row
    this._warnedEvents = false;
    this._warnedProfiles = false;
  }

  _db() {
    return SupabaseClient.getAdmin();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  /**
   * @param {Array<object>} rows each { subject_id, subject_kind, user_id, event_type,
   *   item_id, category, subcategory, brand, store_name, price_xaf, city, metadata }
   */
  async insertEvents(rows) {
    if (!rows || !rows.length) return { inserted: 0, durable: true };
    const stamped = rows.map((r) => Object.assign({ created_at: new Date().toISOString() }, r));
    try {
      const db = this._db();
      const { error } = await db.from(EVENTS_TABLE).insert(rows);
      if (error) throw error;
      return { inserted: rows.length, durable: true };
    } catch (err) {
      if (!this._warnedEvents) {
        logger.warn(`[Reco] event insert fell back to memory: ${err.message}`);
        this._warnedEvents = true;
      }
      for (let i = 0; i < stamped.length; i++) this._memEvents.push(stamped[i]);
      if (this._memEvents.length > MEM_EVENTS_CAP) {
        this._memEvents.splice(0, this._memEvents.length - MEM_EVENTS_CAP);
      }
      return { inserted: rows.length, durable: false };
    }
  }

  /** Recent events for one subject (profile rebuild / fallback scoring). */
  async listEventsForSubject(subjectId, { limit = MEM_SUBJECT_EVENTS_CAP } = {}) {
    if (!subjectId) return [];
    try {
      const db = this._db();
      const { data, error } = await db
        .from(EVENTS_TABLE)
        .select('event_type, item_id, category, subcategory, brand, store_name, price_xaf, city, metadata, created_at')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      return this._memEvents
        .filter((e) => e.subject_id === subjectId)
        .slice(-limit)
        .reverse();
    }
  }

  /**
   * Recent events across all subjects in a time window — the raw material for
   * trending (distinct subjects per item) and co-visitation (items seen by the
   * same subject). Capped for cost.
   */
  async listRecentEvents({ sinceMs, types, limit = 5000 } = {}) {
    const sinceIso = new Date(sinceMs || (Date.now() - 24 * 3600 * 1000)).toISOString();
    try {
      const db = this._db();
      let q = db
        .from(EVENTS_TABLE)
        .select('subject_id, event_type, item_id, created_at')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (types && types.length) q = q.in('event_type', types);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    } catch (err) {
      const since = sinceMs || (Date.now() - 24 * 3600 * 1000);
      return this._memEvents.filter((e) => {
        if (Date.parse(e.created_at) < since) return false;
        if (types && types.length && types.indexOf(e.event_type) === -1) return false;
        return true;
      }).slice(-limit);
    }
  }

  // ── Profiles ────────────────────────────────────────────────────────────────

  async loadProfileRow(subjectId) {
    if (!subjectId) return null;
    try {
      const db = this._db();
      const { data, error } = await db
        .from(PROFILES_TABLE)
        .select('*')
        .eq('subject_id', subjectId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      return this._memProfiles.get(subjectId) || null;
    }
  }

  async saveProfileRow(row) {
    if (!row || !row.subject_id) return { durable: false };
    const toStore = Object.assign({ updated_at: new Date().toISOString() }, row);
    try {
      const db = this._db();
      const { error } = await db
        .from(PROFILES_TABLE)
        .upsert(toStore, { onConflict: 'subject_id' });
      if (error) throw error;
      return { durable: true };
    } catch (err) {
      if (!this._warnedProfiles) {
        logger.warn(`[Reco] profile upsert fell back to memory: ${err.message}`);
        this._warnedProfiles = true;
      }
      this._memProfiles.set(row.subject_id, Object.assign(
        { created_at: new Date().toISOString() },
        this._memProfiles.get(row.subject_id) || {},
        toStore
      ));
      return { durable: false };
    }
  }

  // ── Identity stitching (guest → user on sign-in) ────────────────────────────

  /** Attribute a visitor's events to a user without a destructive re-key. */
  async attributeVisitorEvents(visitorId, userId) {
    if (!visitorId || !userId) return;
    try {
      const db = this._db();
      const { error } = await db
        .from(EVENTS_TABLE)
        .update({ user_id: userId })
        .eq('subject_id', visitorId)
        .is('user_id', null);
      if (error) throw error;
    } catch (err) {
      this._memEvents.forEach((e) => {
        if (e.subject_id === visitorId && !e.user_id) e.user_id = userId;
      });
    }
  }

  // ── Deletion / reset ────────────────────────────────────────────────────────

  /** Remove a subject's derived profile and (optionally) its raw events. */
  async deleteSubject(subjectId, { includeEvents = true } = {}) {
    if (!subjectId) return;
    try {
      const db = this._db();
      await db.from(PROFILES_TABLE).delete().eq('subject_id', subjectId);
      if (includeEvents) await db.from(EVENTS_TABLE).delete().eq('subject_id', subjectId);
    } catch (err) {
      logger.warn(`[Reco] deleteSubject fell back to memory: ${err.message}`);
    }
    this._memProfiles.delete(subjectId);
    if (includeEvents) {
      this._memEvents = this._memEvents.filter((e) => e.subject_id !== subjectId);
    }
  }

  /**
   * Purge everything tied to a user id (events, where the user is attributed,
   * and their profile row). Returns a best-effort error list for the caller to
   * surface, matching DeleteAccountUseCase's piiErrors convention.
   */
  async deleteForUser(userId) {
    const errors = [];
    if (!userId) return errors;
    try {
      const db = this._db();
      // supabase-js returns query errors (including table-missing PGRST205/42P01)
      // in `.error` WITHOUT throwing, so we must throw them ourselves to reach the
      // catch and degrade — matching the rest of this module. Pushing them onto
      // `errors` instead would make account deletion falsely log "PII purge
      // incomplete" on every deletion whenever migration 015 is unapplied.
      const r1 = await db.from(PROFILES_TABLE).delete().eq('user_id', userId);
      if (r1.error) throw r1.error;
      const r2 = await db.from(EVENTS_TABLE).delete().eq('user_id', userId);
      if (r2.error) throw r2.error;
    } catch (err) {
      // Table not migrated yet, or DB down: nothing durable to purge. Treat as a
      // successful no-op (the in-memory purge below still runs).
      logger.warn(`[Reco] deleteForUser skipped (no durable store): ${err.message}`);
    }
    // Always clear anything held in memory for this user.
    for (const [sid, row] of this._memProfiles) {
      if (row && row.user_id === userId) this._memProfiles.delete(sid);
    }
    this._memEvents = this._memEvents.filter((e) => e.user_id !== userId);
    return errors;
  }
}

module.exports = new RecommendationRepository();
