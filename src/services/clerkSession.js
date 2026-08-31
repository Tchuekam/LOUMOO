/**
 * LOUMOO — Universal Authentication Client Service
 * ---------------------------------------------------------------------------
 * Communicates with LOUMOO's direct high-speed OTP authentication engine.
 * Fast, reliable, zero third-party rate limits.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LoumooClerk = factory();
    root.LoumooAuth = root.LoumooClerk;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var state = {
    session: null,
    user: null,
    status: 'ready',
    error: null,
    currentEmail: '',
    config: null
  };

  var listeners = [];

  function emit() {
    listeners.forEach(function (fn) {
      try { fn(state); } catch (e) { console.error('[AuthListenerError]', e); }
    });
  }

  function getApi() {
    return (typeof window !== 'undefined' && window.LoumooAPI) || null;
  }

  var LoumooAuthService = {
    init: function (configOptions) {
      if (configOptions) state.config = configOptions;
      var api = getApi();
      var storedToken = (typeof localStorage !== 'undefined' && localStorage.getItem('loumoo_token')) || null;
      if (storedToken && api) {
        api.setAuthToken(storedToken);
      }
      state.status = 'ready';
      return Promise.resolve(state);
    },

    get isReady() {
      return true;
    },

    get user() {
      return state.user;
    },

    get session() {
      return state.session;
    },

    isSignedIn: function () {
      return Boolean(state.session || (typeof localStorage !== 'undefined' && localStorage.getItem('loumoo_token')));
    },

    getToken: function () {
      var api = getApi();
      if (api && api.getAuthToken()) {
        return Promise.resolve(api.getAuthToken());
      }
      if (typeof localStorage !== 'undefined') {
        return Promise.resolve(localStorage.getItem('loumoo_token'));
      }
      return Promise.resolve(null);
    },

    signUp: function (params) {
      var email = String(params.emailAddress || params.email || '').trim().toLowerCase();
      state.currentEmail = email;

      return fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: params.password,
          firstName: params.firstName,
          lastName: params.lastName,
          phone: params.phoneNumber || params.phone,
          city: params.city
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.status === 'error' || res.error) {
          throw new Error(res.message || (res.error && res.error.message) || 'Registration failed');
        }
        return { needsEmailCode: true, emailAddress: email };
      });
    },

    verifyEmailCode: function (code) {
      var cleanCode = String(code || '').trim().replace(/[^0-9]/g, '');
      var email = state.currentEmail;

      return fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: cleanCode })
      })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.status === 'error' || res.error) {
          throw new Error(res.message || (res.error && res.error.message) || 'Verification failed');
        }
        var token = res.data && (res.data.token || res.data.accessToken);
        if (token) {
          state.session = { token: token };
          state.user = res.data.user;
          var api = getApi();
          if (api) api.setAuthToken(token);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('loumoo_token', token);
          }
          emit();
          return token;
        }
        throw new Error('No session token returned');
      });
    },

    resendEmailCode: function () {
      var email = state.currentEmail;
      return fetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.status === 'error' || res.error) {
          throw new Error(res.message || 'Could not resend code');
        }
        return true;
      });
    },

    signIn: function (identifierOrEmail, password) {
      var email = String(identifierOrEmail || '').trim().toLowerCase();
      state.currentEmail = email;

      return fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (res.status === 'error' || res.error) {
          throw new Error(res.message || 'Sign in failed');
        }
        var token = res.data && (res.data.token || res.data.accessToken);
        if (token) {
          state.session = { token: token };
          state.user = res.data.user;
          var api = getApi();
          if (api) api.setAuthToken(token);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('loumoo_token', token);
          }
          emit();
          return state.session;
        }
        throw new Error('No token returned');
      });
    },

    signOut: function () {
      state.session = null;
      state.user = null;
      var api = getApi();
      if (api) api.clearAuthToken();
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('loumoo_token');
      }
      emit();
      return Promise.resolve();
    },

    describeError: function (err) {
      if (!err) return 'Something went wrong. Please try again.';
      return (err && err.message) || String(err);
    },

    subscribe: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (l) { return l !== fn; });
      };
    },

    getState: function () {
      return state;
    }
  };

  return LoumooAuthService;
});
