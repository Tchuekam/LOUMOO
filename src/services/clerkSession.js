/**
 * LOUMOO — Supabase Authentication Client Service
 * ---------------------------------------------------------------------------
 * Seamlessly handles registration, 6-digit email OTP verification, and JWT session
 * management directly through Supabase Auth.
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

  var DEFAULT_SUPABASE_URL = 'https://vhojbhvaasjvolcfkobz.supabase.co';
  var DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2piaHZhYXNqdm9sY2Zrb2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwOTg1NDYsImV4cCI6MjEwMzY3NDU0Nn0.5R-v87x3EUFH3_D-ugJt98_ZDJ0xhtuJzzZ4VeHzMYU';

  var state = {
    supabase: null,
    client: null,
    session: null,
    user: null,
    status: 'idle',
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

  function ensureSupabaseClient() {
    if (state.client) return Promise.resolve(state.client);

    var url = (state.config && state.config.supabaseUrl) || DEFAULT_SUPABASE_URL;
    var key = (state.config && (state.config.anonKey || state.config.publishableKey)) || DEFAULT_ANON_KEY;

    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      state.client = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      state.supabase = state.client;
      state.status = 'ready';
      return Promise.resolve(state.client);
    }

    if (typeof require === 'function') {
      try {
        var sb = require('@supabase/supabase-js');
        state.client = sb.createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        state.supabase = state.client;
        state.status = 'ready';
        return Promise.resolve(state.client);
      } catch (e) {}
    }

    return Promise.resolve(null);
  }

  var LoumooAuthService = {
    init: function (configOptions) {
      if (configOptions) state.config = configOptions;
      return ensureSupabaseClient().then(function (client) {
        if (!client) {
          state.status = 'ready'; // Ready to lazy init when script loads
          return state;
        }
        return client.auth.getSession().then(function (res) {
          if (res && res.data && res.data.session) {
            state.session = res.data.session;
            state.user = res.data.session.user;
            var api = getApi();
            if (api && res.data.session.access_token) {
              api.setAuthToken(res.data.session.access_token);
            }
          }
          state.status = 'ready';
          emit();
          return state;
        });
      });
    },

    get isReady() {
      return state.status === 'ready' || Boolean(state.client);
    },

    get user() {
      return state.user;
    },

    get session() {
      return state.session;
    },

    isSignedIn: function () {
      return Boolean(state.session && state.user);
    },

    getToken: function () {
      if (state.session && state.session.access_token) {
        return Promise.resolve(state.session.access_token);
      }
      return ensureSupabaseClient().then(function (client) {
        if (!client) return null;
        return client.auth.getSession().then(function (res) {
          var tok = (res && res.data && res.data.session && res.data.session.access_token) || null;
          if (tok) {
            state.session = res.data.session;
            state.user = res.data.session.user;
            var api = getApi();
            if (api) api.setAuthToken(tok);
          }
          return tok;
        });
      });
    },

    signUp: function (params) {
      var email = String(params.emailAddress || params.email || '').trim().toLowerCase();
      var password = String(params.password || '');
      state.currentEmail = email;

      return ensureSupabaseClient().then(function (client) {
        if (!client) throw new Error('Authentication client is initializing. Please try again.');

        return client.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: params.firstName || '',
              last_name: params.lastName || '',
              phone_number: params.phoneNumber || params.phone || ''
            }
          }
        }).then(function (res) {
          if (res.error) {
            throw res.error;
          }
          if (res.data && res.data.session) {
            state.session = res.data.session;
            state.user = res.data.user;
            var api = getApi();
            if (api && res.data.session.access_token) {
              api.setAuthToken(res.data.session.access_token);
            }
            emit();
            return { needsEmailCode: false, emailAddress: email };
          }
          return { needsEmailCode: true, emailAddress: email };
        });
      });
    },

    verifyEmailCode: function (code) {
      var cleanCode = String(code || '').trim().replace(/[^0-9]/g, '');
      var email = state.currentEmail;

      return ensureSupabaseClient().then(function (client) {
        if (!client) throw new Error('Authentication client is initializing. Please try again.');

        return client.auth.verifyOtp({
          email: email,
          token: cleanCode,
          type: 'signup'
        }).then(function (res) {
          if (res.error) {
            // Try with type 'email' fallback if signup OTP was converted
            return client.auth.verifyOtp({
              email: email,
              token: cleanCode,
              type: 'email'
            }).then(function (res2) {
              if (res2.error) throw res.error;
              return res2;
            });
          }
          return res;
        }).then(function (res) {
          if (res.data && res.data.session) {
            state.session = res.data.session;
            state.user = res.data.user;
            var token = res.data.session.access_token;
            var api = getApi();
            if (api && token) api.setAuthToken(token);
            emit();
            return token;
          }
          throw new Error('Verification completed but no session was issued. Please sign in.');
        });
      });
    },

    resendEmailCode: function () {
      var email = state.currentEmail;
      return ensureSupabaseClient().then(function (client) {
        if (!client) throw new Error('Authentication client is initializing.');
        return client.auth.resend({
          type: 'signup',
          email: email
        }).then(function (res) {
          if (res.error) throw res.error;
          return true;
        });
      });
    },

    signIn: function (identifierOrEmail, password) {
      var email = String(identifierOrEmail || '').trim().toLowerCase();
      state.currentEmail = email;

      return ensureSupabaseClient().then(function (client) {
        if (!client) throw new Error('Authentication client is initializing.');
        return client.auth.signInWithPassword({
          email: email,
          password: password
        }).then(function (res) {
          if (res.error) throw res.error;
          state.session = res.data.session;
          state.user = res.data.user;
          var token = res.data.session.access_token;
          var api = getApi();
          if (api && token) api.setAuthToken(token);
          emit();
          return state.session;
        });
      });
    },

    signOut: function () {
      return ensureSupabaseClient().then(function (client) {
        if (!client) return;
        return client.auth.signOut().then(function () {
          state.session = null;
          state.user = null;
          var api = getApi();
          if (api) api.clearAuthToken();
          emit();
        });
      });
    },

    describeError: function (err) {
      if (!err) return 'Something went wrong. Please try again.';
      var msg = (err && err.message) || String(err);
      var lower = msg.toLowerCase();

      if (lower.includes('invalid login credentials')) {
        return 'Incorrect email or password. Please check and try again.';
      }
      if (lower.includes('user already registered') || lower.includes('already exists')) {
        return 'An account already exists with that email address. Try signing in.';
      }
      if (lower.includes('otp expired') || lower.includes('token has expired')) {
        return 'That verification code has expired. Click Resend code to receive a fresh code.';
      }
      if (lower.includes('token is invalid') || lower.includes('otp') || lower.includes('invalid')) {
        return 'That code is not correct. Check your email and try again.';
      }
      if (lower.includes('rate limit') || lower.includes('too many')) {
        return 'Too many requests. Please wait a moment before trying again.';
      }
      return msg;
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
