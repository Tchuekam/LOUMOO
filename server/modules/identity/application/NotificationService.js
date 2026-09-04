/**
 * Notification Service
 * --------------------------------------------------------------------------
 * A per-user notification feed backed by iam.notifications. Rows are created
 * server-side on real events (order placed, …) and read by the buyer.
 *
 * Resilience: if the table has not been migrated yet (or the DB is briefly
 * unreachable), every operation falls back to a per-process in-memory store so
 * the feed keeps working. The moment migration 010 is applied, persistence is
 * automatic — no code change required.
 */

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient.js');
const logger = require('../../../shared/logging/logger');

class NotificationService {
  constructor() {
    this._memory = new Map(); // userId -> [row]
  }

  async create(userId, { type = 'activity', tone = 'accent', title, body = '', metadata = {} } = {}) {
    if (!userId || !title) return null;
    const row = {
      user_id: userId,
      type: type,
      tone: ['accent', 'success', 'sale', 'neutral'].includes(tone) ? tone : 'accent',
      title: String(title).slice(0, 255),
      body: String(body || ''),
      read: false,
      metadata: metadata || {}
    };
    try {
      const db = SupabaseClient.getAdmin();
      const { data, error } = await db.from('notifications').insert(row).select().single();
      if (error) throw error;
      return this._map(data);
    } catch (err) {
      logger.warn(`[Notifications] insert fell back to memory: ${err.message}`);
      const item = Object.assign(
        { id: 'mem_' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), created_at: new Date().toISOString() },
        row
      );
      const list = this._memory.get(userId) || [];
      list.unshift(item);
      this._memory.set(userId, list.slice(0, 50));
      return this._map(item);
    }
  }

  async list(userId, { limit = 30 } = {}) {
    if (!userId) return [];
    try {
      const db = SupabaseClient.getAdmin();
      const { data, error } = await db
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []).map(this._map);
    } catch (err) {
      return (this._memory.get(userId) || []).slice(0, limit).map(this._map);
    }
  }

  async markRead(userId, id) {
    try {
      const db = SupabaseClient.getAdmin();
      const { error } = await db.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      const list = this._memory.get(userId) || [];
      const n = list.find((x) => x.id === id);
      if (n) n.read = true;
    }
    return { success: true };
  }

  async markAllRead(userId) {
    try {
      const db = SupabaseClient.getAdmin();
      const { error } = await db.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
      if (error) throw error;
    } catch (err) {
      (this._memory.get(userId) || []).forEach((n) => { n.read = true; });
    }
    return { success: true };
  }

  _map(r) {
    return {
      id: r.id,
      type: r.type,
      tone: r.tone,
      title: r.title,
      body: r.body,
      read: Boolean(r.read),
      metadata: r.metadata || {},
      createdAt: r.created_at
    };
  }
}

module.exports = new NotificationService();
