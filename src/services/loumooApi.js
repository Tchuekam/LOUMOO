/**
 * LOUMOO — Canonical Browser Runtime API Client
 * ---------------------------------------------------------------------------
 * Single source of truth for all frontend -> backend communication.
 *
 * Written UMD-safe (no ESM syntax) so it can be consumed in three ways:
 *   1. Classic <script> tag  -> exposes window.LoumooAPI  (used by Commerce App.dc.html)
 *   2. CommonJS require()    -> used by the Node test suites
 *   3. Re-exported by src/services/apiClient.js for ESM module consumers
 *
 * It maps 1:1 onto the endpoints already implemented in:
 *   server/modules/identity/presentation/routes/authRoutes.js
 *   server/modules/identity/presentation/routes/userRoutes.js
 *   server/modules/identity/presentation/routes/identityRoutes.js
 *   server/modules/catalog/routes/catalogRoutes.js
 *
 * No business logic lives here. No mock persistence. The backend use cases are
 * authoritative; this layer only transports and normalises envelopes.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    module.exports.LoumooAPI = api;
  }
  if (root) {
    root.LoumooAPI = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TOKEN_KEY = 'loumoo_token';

  /* ---------------------------------------------------------------------- */
  /* Environment helpers (safe in browser, Node vm sandbox, and SSR)         */
  /* ---------------------------------------------------------------------- */

  function hasWindow() {
    return typeof window !== 'undefined' && !!window;
  }

  function safeStorage() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) return localStorage;
    } catch (e) { /* blocked by privacy settings */ }
    return null;
  }

  function baseUrl() {
    if (hasWindow() && window.LOUMOO_API_URL) return window.LOUMOO_API_URL;
    if (hasWindow()) return '';           // same-origin: server/index.js serves the app
    return 'http://localhost:8080';
  }

  /**
   * The backend uses two success envelopes across its modules:
   *   { status: 'success', data: {...} }   (identity / users)
   *   { success: true,     data: {...} }   (catalog / system)
   * Both are unwrapped to the inner `data` here so screens never branch on it.
   */
  function unwrap(body) {
    if (!body || typeof body !== 'object') return body;
    if (Object.prototype.hasOwnProperty.call(body, 'data')) return body.data;
    return body;
  }

  /**
   * Normalises AppError responses from server/shared/middleware/errorHandler.js
   * into a plain Error carrying `status` and `code` for the UI to branch on.
   * Never surfaces stack traces or internal details to the user.
   */
  function toClientError(status, body) {
    var message = 'Something went wrong. Please try again.';
    var code = 'UNKNOWN';

    if (body && body.error) {
      if (body.error.message) message = body.error.message;
      if (body.error.code) code = body.error.code;
    } else if (body && body.message) {
      message = body.message;
    }

    if (status === 401) code = code === 'UNKNOWN' ? 'UNAUTHENTICATED' : code;
    if (status === 403) code = code === 'UNKNOWN' ? 'FORBIDDEN' : code;
    if (status === 429) {
      code = 'RATE_LIMITED';
      message = 'Too many attempts. Please wait a moment and try again.';
    }
    if (status >= 500) {
      code = 'SERVER_ERROR';
      message = 'The LOUMOO service is temporarily unavailable. Please try again.';
    }

    var err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
  }

  function LoumooApiClient() {
    var store = safeStorage();
    this.token = store ? store.getItem(TOKEN_KEY) : null;
    this._inflight = {};
  }

  /* ---------------------------------------------------------------------- */
  /* Session token                                                          */
  /* ---------------------------------------------------------------------- */

  LoumooApiClient.prototype.setAuthToken = function (token) {
    this.token = token || null;
    var store = safeStorage();
    if (!store) return;
    try {
      if (token) store.setItem(TOKEN_KEY, token);
      else store.removeItem(TOKEN_KEY);
    } catch (e) { /* quota / private mode */ }
  };

  LoumooApiClient.prototype.getAuthToken = function () {
    return this.token;
  };

  /**
   * Wipes every trace of the previous principal from this browser.
   * Called on sign-out, on account deletion, and whenever the server reports
   * the session is no longer valid — so user A's private data can never remain
   * visible to user B on a shared device.
   */
  LoumooApiClient.prototype.clearSession = function () {
    this.setAuthToken(null);
    this._inflight = {};
    var store = safeStorage();
    if (!store) return;
    try {
      store.removeItem('loumoo_auth_user');
      store.removeItem('loumoo_onboarding_draft');
    } catch (e) { /* noop */ }
  };

  /* ---------------------------------------------------------------------- */
  /* Core transport                                                         */
  /* ---------------------------------------------------------------------- */

  LoumooApiClient.prototype.request = function (endpoint, options) {
    var self = this;
    options = options || {};

    if (typeof fetch === 'undefined') {
      return Promise.reject(toClientError(0, {
        error: { message: 'Network unavailable', code: 'OFFLINE' }
      }));
    }

    var headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = 'Bearer ' + this.token;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.headers) {
      for (var h in options.headers) {
        if (Object.prototype.hasOwnProperty.call(options.headers, h)) {
          headers[h] = options.headers[h];
        }
      }
    }

    var init = { method: options.method || 'GET', headers: headers };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);

    return fetch(baseUrl() + endpoint, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          // A rejected token means the session is gone — drop it immediately so
          // stale private data cannot be re-requested with dead credentials.
          if (res.status === 401) self.setAuthToken(null);
          throw toClientError(res.status, body);
        }
        return unwrap(body);
      });
    }, function (networkErr) {
      var err = new Error('Cannot reach LOUMOO. Check your connection and try again.');
      err.status = 0;
      err.code = 'OFFLINE';
      err.cause = networkErr;
      throw err;
    });
  };

  function qs(params) {
    if (!params) return '';
    var parts = [];
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
      var v = params[k];
      if (v === undefined || v === null || v === '') continue;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
    return parts.length ? '?' + parts.join('&') : '';
  }

  /* ====================================================================== */
  /* AUTHENTICATION  — server/modules/identity/.../authRoutes.js            */
  /* ====================================================================== */

  LoumooApiClient.prototype.signUp = function (payload) {
    return this.request('/api/v1/auth/signup', { method: 'POST', body: payload });
  };

  /**
   * POST /api/v1/auth/signin -> SignInUseCase
   * Returns { success, message, token, user, permissions }.
   * The returned token is persisted so every later call is authenticated.
   */
  LoumooApiClient.prototype.signIn = function (credentials) {
    var self = this;
    return this.request('/api/v1/auth/signin', {
      method: 'POST',
      body: credentials
    }).then(function (data) {
      if (data && data.token) self.setAuthToken(data.token);
      return data;
    });
  };

  LoumooApiClient.prototype.signOut = function () {
    var self = this;
    return this.request('/api/v1/auth/logout', { method: 'POST' })
      .catch(function () { return { success: true }; })
      .then(function (res) {
        self.clearSession();
        return res;
      });
  };

  LoumooApiClient.prototype.sendOtp = function (phoneNumber) {
    return this.request('/api/v1/auth/otp/send', {
      method: 'POST',
      body: { phoneNumber: phoneNumber }
    });
  };

  LoumooApiClient.prototype.verifyOtp = function (phoneNumber, code) {
    return this.request('/api/v1/auth/otp/verify', {
      method: 'POST',
      body: { phoneNumber: phoneNumber, code: code }
    });
  };

  LoumooApiClient.prototype.requestPasswordReset = function (email) {
    return this.request('/api/v1/auth/password-reset/request', {
      method: 'POST',
      body: { email: email }
    });
  };

  LoumooApiClient.prototype.confirmPasswordReset = function (payload) {
    return this.request('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      body: payload
    });
  };

  LoumooApiClient.prototype.verifyEmail = function (payload) {
    return this.request('/api/v1/auth/email/verify', {
      method: 'POST',
      body: payload || {}
    });
  };

  /* ====================================================================== */
  /* USER & PROFILE — server/modules/identity/.../userRoutes.js             */
  /* ====================================================================== */

  /**
   * GET /api/v1/users/me — the authoritative session probe.
   * Resolves to the profile when the session is valid, or null when it is not.
   * This (not localStorage) is what the UI treats as the source of truth.
   */
  LoumooApiClient.prototype.getMe = function () {
    var self = this;
    if (!this.token) return Promise.resolve(null);
    return this.request('/api/v1/users/me').then(function (data) {
      return (data && data.user) || null;
    }).catch(function (err) {
      if (err.status === 401 || err.status === 403) {
        self.clearSession();
        return null;
      }
      throw err;
    });
  };

  LoumooApiClient.prototype.updateMe = function (updates) {
    return this.request('/api/v1/users/me', { method: 'PATCH', body: updates });
  };

  LoumooApiClient.prototype.getPublicUser = function (userId) {
    return this.request('/api/v1/users/' + encodeURIComponent(userId) + '/public')
      .then(function (data) { return (data && data.user) || null; });
  };

  /* --- 04.02 Account dashboard read model --- */
  LoumooApiClient.prototype.getDashboard = function () {
    return this.request('/api/v1/users/me/dashboard');
  };

  /* --- 04.04 Saved items --- */
  LoumooApiClient.prototype.getSavedItems = function (params) {
    return this.request('/api/v1/users/me/saved-items' + qs(params));
  };

  LoumooApiClient.prototype.saveItem = function (item) {
    return this.request('/api/v1/users/me/saved-items', { method: 'POST', body: item });
  };

  LoumooApiClient.prototype.removeSavedItem = function (productId) {
    return this.request('/api/v1/users/me/saved-items/' + encodeURIComponent(productId), {
      method: 'DELETE'
    });
  };

  /* --- 04.05 Followed stores --- */
  LoumooApiClient.prototype.getFollowedStores = function (params) {
    return this.request('/api/v1/users/me/followed-stores' + qs(params));
  };

  LoumooApiClient.prototype.followStore = function (store) {
    return this.request('/api/v1/users/me/followed-stores', { method: 'POST', body: store });
  };

  LoumooApiClient.prototype.unfollowStore = function (storeId) {
    return this.request('/api/v1/users/me/followed-stores/' + encodeURIComponent(storeId), {
      method: 'DELETE'
    });
  };

  /* --- 04.06 Purchase history --- */
  LoumooApiClient.prototype.getPurchases = function (params) {
    return this.request('/api/v1/users/me/purchases' + qs(params));
  };

  LoumooApiClient.prototype.getOrder = function (orderId) {
    return this.request('/api/v1/users/me/purchases/' + encodeURIComponent(orderId))
      .then(function (data) { return (data && data.order) || null; });
  };

  /* --- 04.07 Activity history --- */
  LoumooApiClient.prototype.getActivities = function (params) {
    return this.request('/api/v1/users/me/activities' + qs(params));
  };

  /* --- 04.08 Addresses --- */
  LoumooApiClient.prototype.getAddresses = function () {
    return this.request('/api/v1/users/me/addresses')
      .then(function (data) { return (data && data.addresses) || []; });
  };

  LoumooApiClient.prototype.addAddress = function (address) {
    return this.request('/api/v1/users/me/addresses', { method: 'POST', body: address })
      .then(function (data) { return (data && data.address) || null; });
  };

  LoumooApiClient.prototype.updateAddress = function (id, updates) {
    return this.request('/api/v1/users/me/addresses/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: updates
    }).then(function (data) { return (data && data.address) || null; });
  };

  LoumooApiClient.prototype.deleteAddress = function (id) {
    return this.request('/api/v1/users/me/addresses/' + encodeURIComponent(id), {
      method: 'DELETE'
    });
  };

  LoumooApiClient.prototype.setDefaultAddress = function (id) {
    return this.request('/api/v1/users/me/addresses/' + encodeURIComponent(id) + '/default', {
      method: 'POST'
    }).then(function (data) { return (data && data.address) || null; });
  };

  /* --- 04.09 Notification preferences --- */
  LoumooApiClient.prototype.getNotificationPreferences = function () {
    return this.request('/api/v1/users/me/notifications/preferences')
      .then(function (data) { return (data && data.preferences) || null; });
  };

  LoumooApiClient.prototype.updateNotificationPreferences = function (updates) {
    return this.request('/api/v1/users/me/notifications/preferences', {
      method: 'PATCH',
      body: updates
    }).then(function (data) { return (data && data.preferences) || null; });
  };

  /* --- 02.14 Privacy & consent --- */
  LoumooApiClient.prototype.getPrivacy = function () {
    return this.request('/api/v1/users/me/privacy')
      .then(function (data) { return (data && data.preferences) || null; });
  };

  LoumooApiClient.prototype.updatePrivacy = function (updates) {
    return this.request('/api/v1/users/me/privacy', { method: 'PATCH', body: updates });
  };

  /* --- 02.08 / 02.12 Sessions & security --- */
  LoumooApiClient.prototype.getSessions = function () {
    return this.request('/api/v1/users/me/sessions')
      .then(function (data) { return (data && data.sessions) || []; });
  };

  LoumooApiClient.prototype.revokeSession = function (sessionId) {
    return this.request('/api/v1/users/me/sessions/' + encodeURIComponent(sessionId), {
      method: 'DELETE'
    });
  };

  /* --- 02.13 Account deletion --- */
  LoumooApiClient.prototype.deleteAccount = function (confirmText, reason) {
    var self = this;
    return this.request('/api/v1/users/me', {
      method: 'DELETE',
      body: { confirmText: confirmText, reason: reason }
    }).then(function (result) {
      self.clearSession();
      return result;
    });
  };

  /* ====================================================================== */
  /* STORE & BUSINESS — server/modules/store/presentation/routes/storeRoutes.js */
  /* ====================================================================== */

  /* --- 05.01 Create a store --- */
  LoumooApiClient.prototype.createStore = function (payload) {
    return this.request('/api/v1/stores', { method: 'POST', body: payload });
  };

  /* --- 05.03 Store management --- */
  LoumooApiClient.prototype.getStore = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId));
  };

  LoumooApiClient.prototype.updateStore = function (storeId, updates) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId), { method: 'PATCH', body: updates });
  };

  /* --- 05.04 Store profile --- */
  LoumooApiClient.prototype.getStoreProfile = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/profile');
  };

  LoumooApiClient.prototype.updateStoreProfile = function (storeId, updates) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/profile', { method: 'PATCH', body: updates });
  };

  /* --- 05.02 Store onboarding --- */
  LoumooApiClient.prototype.getStoreOnboarding = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/onboarding');
  };

  LoumooApiClient.prototype.updateStoreOnboarding = function (storeId, step, payload) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/onboarding', {
      method: 'PATCH',
      body: { step: step, payload: payload }
    });
  };

  /* --- 05.05 Store verification --- */
  LoumooApiClient.prototype.getStoreVerification = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/verification');
  };

  LoumooApiClient.prototype.submitStoreVerification = function (storeId, payload) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/verification', { method: 'POST', body: payload });
  };

  /* --- 05.09 Store analytics --- */
  LoumooApiClient.prototype.getStoreAnalytics = function (storeId, period) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/analytics' + qs({ period: period || '30d' }));
  };

  /* --- 05.10 Store settings --- */
  LoumooApiClient.prototype.getStoreSettings = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/settings');
  };

  LoumooApiClient.prototype.updateStoreSettings = function (storeId, updates) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/settings', { method: 'PATCH', body: updates });
  };

  /* --- 05.11 Business opening hours --- */
  LoumooApiClient.prototype.getStoreHours = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/hours');
  };

  LoumooApiClient.prototype.updateStoreHours = function (storeId, updates) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/hours', { method: 'PATCH', body: updates });
  };

  /* --- 05.12 Business location --- */
  LoumooApiClient.prototype.getStoreLocation = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/location');
  };

  LoumooApiClient.prototype.updateStoreLocation = function (storeId, updates) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/location', { method: 'PATCH', body: updates });
  };

  /* --- 05.07 Store discovery & 05.06 Categories --- */
  LoumooApiClient.prototype.discoverStores = function (params) {
    return this.request('/api/v1/stores/discovery' + qs(params));
  };

  LoumooApiClient.prototype.getStoreCategories = function () {
    return this.request('/api/v1/stores/categories');
  };

  /* --- 05.08 Follow / unfollow store --- */
  LoumooApiClient.prototype.followStoreById = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/follow', { method: 'POST' });
  };

  LoumooApiClient.prototype.unfollowStoreById = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/follow', { method: 'DELETE' });
  };

  LoumooApiClient.prototype.getStoreFollowStatus = function (storeId) {
    return this.request('/api/v1/stores/' + encodeURIComponent(storeId) + '/follow-status');
  };

  /* ====================================================================== */
  /* CATALOG — server/modules/catalog/routes/catalogRoutes.js               */
  /* ====================================================================== */

  LoumooApiClient.prototype.getProducts = function (params) {
    return this.request('/api/v1/products' + qs(params));
  };

  LoumooApiClient.prototype.getProduct = function (id) {
    return this.request('/api/v1/products/' + encodeURIComponent(id));
  };

  LoumooApiClient.prototype.getCategories = function () {
    return this.request('/api/v1/categories');
  };

  LoumooApiClient.prototype.getHealth = function () {
    return this.request('/api/v1/health').catch(function (e) {
      return { status: 'offline', error: e.message };
    });
  };

  var instance = new LoumooApiClient();
  instance.LoumooApiClient = LoumooApiClient;
  instance.TOKEN_KEY = TOKEN_KEY;
  return instance;
});
