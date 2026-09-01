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
    this._tokenProvider = null;
    this._inflight = {};
  }

  /* ---------------------------------------------------------------------- */
  /* Session token                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Registers the live session-token source (Clerk).
   *
   * Clerk session tokens are short-lived and refreshed by its SDK, so the
   * client asks for a fresh one per request instead of caching a copy that
   * silently expires. A stored token remains only as a same-tab fallback for
   * environments where the Clerk SDK is unavailable.
   */
  LoumooApiClient.prototype.setTokenProvider = function (fn) {
    this._tokenProvider = typeof fn === 'function' ? fn : null;
  };

  LoumooApiClient.prototype.resolveToken = function () {
    var self = this;
    if (this._tokenProvider) {
      try {
        return Promise.resolve(this._tokenProvider()).then(function (t) {
          return t || self.token || null;
        }).catch(function () { return self.token || null; });
      } catch (e) { /* fall through to the stored token */ }
    }
    return Promise.resolve(this.token || null);
  };

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

    var headers = {};
    if (!options.rawBody) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    if (options.headers) {
      for (var h in options.headers) {
        if (Object.prototype.hasOwnProperty.call(options.headers, h)) {
          headers[h] = options.headers[h];
        }
      }
    }

    return this.resolveToken().then(function (token) {
      if (token) headers.Authorization = 'Bearer ' + token;

      var init = { method: options.method || 'GET', headers: headers };
      if (options.rawBody !== undefined && options.rawBody !== null) {
        init.body = options.rawBody;
      } else if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }

      return fetch(baseUrl() + endpoint, init);
    }).then(function (res) {
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

  /**
   * GET /api/v1/auth/config — the browser-safe bootstrap (Clerk publishable
   * key, which verification channels this deployment actually supports).
   */
  LoumooApiClient.prototype.getAuthConfig = function () {
    return this.request('/api/v1/auth/config');
  };

  /**
   * POST /api/v1/auth/session — called once, immediately after Clerk
   * authenticates the browser. Provisions the LOUMOO profile on first sign-in
   * and returns the authoritative account state.
   *
   * There is no payload: the identity is taken from the verified session token
   * alone, so nothing the page could send can influence which account it gets.
   */
  LoumooApiClient.prototype.establishSession = function () {
    return this.request('/api/v1/auth/session', { method: 'POST' });
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

  /* ---------------------------- Account state ---------------------------- */

  /**
   * GET /api/v1/me/state — THE authoritative answer to "who is this and what
   * may they do". Every guard in the UI reads this; nothing is inferred from
   * localStorage.
   */
  LoumooApiClient.prototype.getAccountState = function () {
    return this.request('/api/v1/me/state');
  };

  LoumooApiClient.prototype.resolveCapability = function (capability) {
    return this.request('/api/v1/me/state/resolve' + qs({ capability: capability }));
  };

  /* ---------------------------- Verification ----------------------------- */

  LoumooApiClient.prototype.getVerificationStatus = function () {
    return this.request('/api/v1/auth/verification');
  };

  /** Re-reads Clerk server-side and mirrors the result. */
  LoumooApiClient.prototype.refreshVerification = function () {
    return this.request('/api/v1/auth/verification/refresh', { method: 'POST' });
  };

  LoumooApiClient.prototype.requestEmailVerification = function () {
    return this.request('/api/v1/auth/verification/email', { method: 'POST' });
  };

  LoumooApiClient.prototype.requestPhoneVerification = function (phoneNumber) {
    return this.request('/api/v1/auth/verification/phone', {
      method: 'POST',
      body: { phoneNumber: phoneNumber }
    });
  };

  /* ----------------------------- Onboarding ------------------------------ */

  LoumooApiClient.prototype.getOnboarding = function () {
    return this.request('/api/v1/me/onboarding');
  };

  LoumooApiClient.prototype.getOnboardingSteps = function () {
    return this.request('/api/v1/me/onboarding/steps');
  };

  LoumooApiClient.prototype.startOnboarding = function (intent) {
    return this.request('/api/v1/me/onboarding/start', {
      method: 'POST',
      body: { intent: intent || 'buyer' }
    });
  };

  LoumooApiClient.prototype.submitOnboardingStep = function (stepKey, payload) {
    return this.request('/api/v1/me/onboarding/steps/' + encodeURIComponent(stepKey), {
      method: 'POST',
      body: payload || {}
    });
  };

  LoumooApiClient.prototype.startSelling = function () {
    return this.request('/api/v1/me/selling/start', { method: 'POST' });
  };

  /* --------------------------- Adaptive onboarding ------------------------ */

  /** GET /api/v1/me/adaptive — conversation state + next question spec. */
  LoumooApiClient.prototype.getAdaptiveConversation = function () {
    return this.request('/api/v1/me/adaptive');
  };

  /** POST /api/v1/me/adaptive/answers — one answer: { questionKey, text?, chip?, chips?, skip? } */
  LoumooApiClient.prototype.submitAdaptiveAnswer = function (payload) {
    return this.request('/api/v1/me/adaptive/answers', {
      method: 'POST',
      body: payload || {}
    });
  };

  /** POST /api/v1/me/adaptive/complete — seal onboarding, install the mission. */
  LoumooApiClient.prototype.completeAdaptiveOnboarding = function (payload) {
    return this.request('/api/v1/me/adaptive/complete', {
      method: 'POST',
      body: payload || {}
    });
  };

  /** POST /api/v1/me/adaptive/restart — "change my goal": fresh conversation. */
  LoumooApiClient.prototype.restartAdaptiveOnboarding = function () {
    return this.request('/api/v1/me/adaptive/restart', { method: 'POST', body: {} });
  };

  /* ------------------------------- Uploads ------------------------------- */

  /**
   * POST /api/v1/uploads/listing-media — sends the raw image bytes.
   *
   * The server determines the real format from the bytes, so no filename or
   * Content-Type is sent that it could be tempted to trust. Returns an opaque
   * `uploadId` which the listing endpoints accept.
   */
  LoumooApiClient.prototype.uploadListingImage = function (fileOrBlob, listingId) {
    return this.request(
      '/api/v1/uploads/listing-media' + qs({ listingId: listingId }),
      {
        method: 'POST',
        rawBody: fileOrBlob,
        headers: { 'Content-Type': 'application/octet-stream' }
      }
    );
  };

  LoumooApiClient.prototype.discardUpload = function (uploadId) {
    return this.request('/api/v1/uploads/' + encodeURIComponent(uploadId), { method: 'DELETE' });
  };

  LoumooApiClient.prototype.getUploadLimits = function () {
    return this.request('/api/v1/uploads/limits');
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
    // Skip the round trip only when there is genuinely no credential to try —
    // the live provider (Clerk) is consulted, not just the stored fallback.
    return this.resolveToken().then(function (token) {
      if (!token) return null;
      return self._fetchMe();
    });
  };

  LoumooApiClient.prototype._fetchMe = function () {
    var self = this;
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
  /* UNIVERSAL LISTINGS & COMMERCE — server/modules/listing/presentation/routes/listingRoutes.js */
  /* ====================================================================== */

  LoumooApiClient.prototype.getTaxonomy = function () {
    return this.request('/api/v1/listings/taxonomy');
  };

  LoumooApiClient.prototype.getCategorySchema = function (categoryId) {
    return this.request('/api/v1/listings/taxonomy/' + encodeURIComponent(categoryId) + '/schema');
  };

  LoumooApiClient.prototype.createListing = function (payload) {
    return this.request('/api/v1/listings', { method: 'POST', body: payload });
  };

  LoumooApiClient.prototype.getSellerListings = function (params) {
    return this.request('/api/v1/listings/seller' + qs(params));
  };

  LoumooApiClient.prototype.getListing = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id));
  };

  LoumooApiClient.prototype.updateListing = function (id, updates) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id), { method: 'PATCH', body: updates });
  };

  LoumooApiClient.prototype.getListingPreview = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/preview');
  };

  LoumooApiClient.prototype.publishListing = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/publish', { method: 'POST' });
  };

  LoumooApiClient.prototype.pauseListing = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/pause', { method: 'POST' });
  };

  LoumooApiClient.prototype.archiveListing = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/archive', { method: 'POST' });
  };

  /**
   * Attaches images that were already uploaded and validated.
   * Takes upload ids, never URLs: a client-supplied URL would let anyone point
   * a listing at arbitrary remote content.
   */
  LoumooApiClient.prototype.addListingMedia = function (id, uploadIds) {
    var ids = Array.isArray(uploadIds) ? uploadIds : [uploadIds];
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/media', {
      method: 'POST',
      body: { uploadIds: ids }
    });
  };

  LoumooApiClient.prototype.getListingMedia = function (id) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/media');
  };

  LoumooApiClient.prototype.reorderListingMedia = function (id, mediaIds) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/media/order', {
      method: 'PATCH',
      body: { mediaIds: mediaIds }
    });
  };

  LoumooApiClient.prototype.setListingCover = function (id, mediaId) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/media/' + encodeURIComponent(mediaId) + '/cover', {
      method: 'POST'
    });
  };

  /** The canonical listing form rules, so the wizard validates what the server validates. */
  LoumooApiClient.prototype.getListingSchema = function () {
    return this.request('/api/v1/listings/schema');
  };

  LoumooApiClient.prototype.removeListingMedia = function (id, mediaId) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/media/' + encodeURIComponent(mediaId), { method: 'DELETE' });
  };

  LoumooApiClient.prototype.generateListingVariants = function (id, optionsMap, basePriceMinor) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/variants', {
      method: 'POST',
      body: { optionsMap: optionsMap, basePriceMinor: basePriceMinor }
    });
  };

  LoumooApiClient.prototype.updateListingVariant = function (id, variantId, updates) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/variants/' + encodeURIComponent(variantId), {
      method: 'PATCH',
      body: updates
    });
  };

  LoumooApiClient.prototype.updateListingInventory = function (id, onHand, variantId) {
    return this.request('/api/v1/listings/' + encodeURIComponent(id) + '/inventory', {
      method: 'PATCH',
      body: { onHand: onHand, variantId: variantId }
    });
  };

  LoumooApiClient.prototype.getListingAiSuggestions = function (payload) {
    return this.request('/api/v1/listings/ai/suggest', { method: 'POST', body: payload });
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

  LoumooApiClient.prototype.searchProducts = function (query, params) {
    var p = Object.assign({ q: query }, params || {});
    return this.request('/api/v1/products' + qs(p)).catch(function () {
      return { products: [] };
    });
  };


  /* ====================================================================== */
  /* ANNOUNCEMENTS & COMMERCIAL DISTRIBUTION                                 */
  /* server/modules/announcement/presentation/routes/announcementRoutes.js   */
  /* ====================================================================== */

  LoumooApiClient.prototype.getAnnouncementFeed = function (params) {
    return this.request('/api/v1/announcements' + qs(params));
  };

  LoumooApiClient.prototype.getAnnouncement = function (idOrSlug) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(idOrSlug));
  };

  LoumooApiClient.prototype.getSellerAnnouncements = function (storeId, params) {
    return this.request('/api/v1/announcements/seller/' + encodeURIComponent(storeId) + qs(params));
  };

  LoumooApiClient.prototype.getStoreCampaignsOverview = function (storeId) {
    return this.request('/api/v1/announcements/seller/' + encodeURIComponent(storeId) + '/campaigns-overview');
  };

  LoumooApiClient.prototype.createAnnouncement = function (payload) {
    return this.request('/api/v1/announcements', {
      method: 'POST',
      body: payload
    });
  };

  LoumooApiClient.prototype.updateAnnouncement = function (id, payload) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id), {
      method: 'PATCH',
      body: payload
    });
  };

  LoumooApiClient.prototype.publishAnnouncement = function (id) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/publish', {
      method: 'POST'
    });
  };

  LoumooApiClient.prototype.scheduleAnnouncement = function (id, scheduledFor, expiresAt) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/schedule', {
      method: 'POST',
      body: { scheduledFor: scheduledFor, expiresAt: expiresAt }
    });
  };

  LoumooApiClient.prototype.cancelAnnouncementSchedule = function (id) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/cancel-schedule', {
      method: 'POST'
    });
  };

  LoumooApiClient.prototype.archiveAnnouncement = function (id) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/archive', {
      method: 'POST'
    });
  };

  LoumooApiClient.prototype.deleteAnnouncement = function (id) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id), {
      method: 'DELETE'
    });
  };

  LoumooApiClient.prototype.recordAnnouncementEvent = function (id, eventType, metadata) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/events', {
      method: 'POST',
      body: { eventType: eventType, metadata: metadata }
    });
  };

  LoumooApiClient.prototype.getAnnouncementAnalytics = function (id) {
    return this.request('/api/v1/announcements/' + encodeURIComponent(id) + '/analytics');
  };


  /* ══════════════════════════════════════════════════════════════════════════
     10. PRODUCT COMPARISON & HEAD-TO-HEAD DECISION ENGINE SDK
     ══════════════════════════════════════════════════════════════════════════ */

  LoumooApiClient.prototype.compareProducts = function (productIds, userPriorities) {
    var idsStr = Array.isArray(productIds) ? productIds.join(',') : productIds;
    var query = { ids: idsStr };
    if (userPriorities) {
      query.priorities = typeof userPriorities === 'object' ? JSON.stringify(userPriorities) : userPriorities;
    }
    return this.request('/api/v1/catalog/compare' + qs(query));
  };

  LoumooApiClient.prototype.getCompareCandidates = function (params) {
    return this.request('/api/v1/catalog/compare/candidates' + qs(params || {}));
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
