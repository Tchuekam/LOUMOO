/**
 * LOUMOO SuperAdmin — superAdminApi.js
 * ---------------------------------------------------------------------------
 * Client API connector for the SuperAdmin Control Center.
 */

(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SuperAdminAPI = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function getAuthToken() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('loumoo_token') ||
               localStorage.getItem('loumoo_supabase_session_token') ||
               'admin_token';
      }
    } catch (e) {}
    return 'admin_token';
  }

  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : endpoint;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      'X-Admin-Key': 'loumoo_dev_admin',
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (body && body.error && body.error.message) || body.message || 'Administrative request failed';
      const err = new Error(msg);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    return body.data || body;
  }

  return {
    async getOverview() {
      return await request('/api/v1/admin/overview');
    },

    async getSettings() {
      const res = await request('/api/v1/admin/settings');
      return res.settings || res;
    },

    async getSetting(key) {
      const res = await request(`/api/v1/admin/settings/${encodeURIComponent(key)}`);
      return res.value || res;
    },

    async updateSetting(key, value, reason = '') {
      return await request(`/api/v1/admin/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ value, reason })
      });
    },

    // ── Phase 2: Stores & Merchant KYC Moderation ──
    async getStores({ status = '', tier = '', search = '', limit = 50, offset = 0 } = {}) {
      const params = new URLSearchParams();
      if (status && status !== 'ALL') params.set('status', status);
      if (tier && tier !== 'ALL') params.set('tier', tier);
      if (search) params.set('search', search);
      params.set('limit', limit);
      params.set('offset', offset);
      const res = await request(`/api/v1/admin/stores?${params.toString()}`);
      return res.stores || [];
    },

    async getStore(id) {
      const res = await request(`/api/v1/admin/stores/${encodeURIComponent(id)}`);
      return res.store || res;
    },

    async moderateStore(id, updates) {
      return await request(`/api/v1/admin/stores/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    async verifyStoreKyc(id, tier = 'pro_merchant', reason = 'Store KYC verified by SuperAdmin') {
      return await request(`/api/v1/admin/stores/${encodeURIComponent(id)}/verify-kyc`, {
        method: 'POST',
        body: JSON.stringify({ tier, reason })
      });
    },

    async rejectStoreKyc(id, reason = 'KYC documentation insufficient') {
      return await request(`/api/v1/admin/stores/${encodeURIComponent(id)}/reject-kyc`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },

    async suspendStore(id, reason = 'Violation of terms') {
      return await request(`/api/v1/admin/stores/${encodeURIComponent(id)}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },

    async reactivateStore(id, reason = 'Store reactivated') {
      return await request(`/api/v1/admin/stores/${encodeURIComponent(id)}/reactivate`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    },

    async getAuditLogs(limit = 25, offset = 0) {
      const res = await request(`/api/v1/admin/audit-logs?limit=${limit}&offset=${offset}`);
      return res.logs || [];
    }
  };
});
