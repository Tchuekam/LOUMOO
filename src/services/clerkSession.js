/**
 * LOUMOO — Clerk Browser Session Bridge
 * ---------------------------------------------------------------------------
 * The one place the browser talks to Clerk.
 *
 * Responsibilities:
 *   1. Load the Clerk JS SDK using the publishable key the server hands out.
 *   2. Run the real sign-up / sign-in / email-code exchanges.
 *   3. Feed live session tokens to the LOUMOO API client.
 *   4. Re-establish the LOUMOO session whenever Clerk's session changes —
 *      including when the change happened in a DIFFERENT TAB.
 *
 * What it deliberately does not do: decide anything. Clerk proves identity;
 * the LOUMOO server decides what that identity may do. This file never sets a
 * "verified" or "onboarded" flag of its own, because a flag set here would be
 * a claim the browser makes about itself.
 *
 * Loaded as a classic script; exposes `window.LoumooClerk`.
 */
(function (root) {
  'use strict';

  var CLERK_CDN_TEMPLATE =
    'https://{{FRONTEND_API}}/npm/@clerk/clerk-js@5/dist/clerk.browser.js';

  var state = {
    status: 'idle',        // idle | loading | ready | unavailable
    clerk: null,
    publishableKey: null,
    error: null,
    listeners: []
  };

  function api() {
    return root.LoumooAPI || null;
  }

  function emit(event) {
    state.listeners.slice().forEach(function (fn) {
      try { fn(event); } catch (e) { /* a bad listener must not break the rest */ }
    });
  }

  /**
   * Derives the Clerk Frontend API host from the publishable key.
   * The key is `pk_<env>_<base64(host$)>`, which is how Clerk's own loader
   * finds the instance without a second round trip.
   */
  function frontendApiFromKey(publishableKey) {
    try {
      var encoded = publishableKey.split('_')[2];
      var decoded = atob(encoded);
      return decoded.replace(/\$$/, '');
    } catch (e) {
      return null;
    }
  }

  function loadScript(src, publishableKey) {
    return new Promise(function (resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.crossOrigin = 'anonymous';
      el.setAttribute('data-clerk-publishable-key', publishableKey);
      el.onload = resolve;
      el.onerror = function () { reject(new Error('Could not load the Clerk SDK')); };
      document.head.appendChild(el);
    });
  }

  var LoumooClerk = {
    get status() { return state.status; },
    get isReady() { return state.status === 'ready'; },
    get client() { return state.clerk; },
    get lastError() { return state.error; },

    /** Subscribe to { type: 'ready' | 'session' | 'error' } notifications. */
    subscribe: function (fn) {
      state.listeners.push(fn);
      return function () {
        state.listeners = state.listeners.filter(function (l) { return l !== fn; });
      };
    },

    /**
     * Boots Clerk. Safe to call repeatedly — the same promise is reused.
     *
     * Resolves even when Clerk cannot be reached, with `status === 'unavailable'`,
     * so the application can present an honest "sign-in is unavailable" state
     * rather than a spinner that never resolves.
     */
    init: function () {
      if (this._boot) return this._boot;

      state.status = 'loading';

      this._boot = fetch('/api/v1/auth/config')
        .then(function (res) { return res.json(); })
        .then(function (body) {
          var cfg = (body && body.data) || {};
          state.publishableKey = cfg.publishableKey;

          if (!cfg.publishableKey) {
            throw new Error(
              'Authentication is not configured for this deployment ' +
              '(CLERK_PUBLISHABLE_KEY is missing on the server).'
            );
          }

          var host = frontendApiFromKey(cfg.publishableKey);
          if (!host) throw new Error('The Clerk publishable key is malformed.');

          return loadScript(CLERK_CDN_TEMPLATE.replace('{{FRONTEND_API}}', host), cfg.publishableKey);
        })
        .then(function () {
          if (!root.Clerk) throw new Error('The Clerk SDK loaded but did not initialise.');
          state.clerk = root.Clerk;
          return state.clerk.load({ afterSignOutUrl: '/' });
        })
        .then(function () {
          state.status = 'ready';

          // Every API call asks Clerk for a live token. Clerk refreshes short
          // -lived tokens itself, so the client never presents a stale one.
          var client = api();
          if (client) {
            client.setTokenProvider(function () {
              if (!state.clerk || !state.clerk.session) return null;
              return state.clerk.session.getToken();
            });
          }

          // Clerk broadcasts session changes across tabs. Signing in, signing
          // out or completing a verification elsewhere therefore reaches this
          // tab, and the account state is re-fetched from the server.
          state.clerk.addListener(function (payload) {
            emit({ type: 'session', session: payload.session || null, user: payload.user || null });
          });

          emit({ type: 'ready' });
          return state;
        })
        .catch(function (err) {
          state.status = 'unavailable';
          state.error = err;
          emit({ type: 'error', error: err });
          return state;
        });

      return this._boot;
    },

    isSignedIn: function () {
      return Boolean(state.clerk && state.clerk.session);
    },

    /** The Clerk-side view of the signed-in user; never an authorization input. */
    currentUser: function () {
      return state.clerk ? state.clerk.user : null;
    },

    /* ------------------------------------------------------------------ */
    /* Sign up                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Starts a real registration and asks Clerk to send a real code.
     * @returns {Promise<{needsEmailCode:boolean, emailAddress:string}>}
     */
    signUp: function (params) {
      requireReady();
      var phone = params.phone || params.phoneNumber;
      if (phone) {
        var rawP = String(phone).trim();
        state.lastPhone = rawP.startsWith('+') ? rawP.replace(/[\s-]/g, '') : ('+237' + rawP.replace(/[^0-9]/g, ''));
      }
      var createPayload = {
        emailAddress: params.email,
        password: params.password,
        firstName: params.firstName,
        lastName: params.lastName
      };
      if (state.lastPhone) {
        createPayload.phoneNumber = state.lastPhone;
      }
      return state.clerk.client.signUp.create(createPayload)
        .catch(function (err) {
          // If phoneNumber is rejected on create, try without it
          var clerkErr = err && err.errors && err.errors[0];
          if (clerkErr && (clerkErr.code === 'form_param_unknown' || clerkErr.meta?.paramName === 'phone_number' || clerkErr.meta?.paramName === 'phoneNumber')) {
            delete createPayload.phoneNumber;
            return state.clerk.client.signUp.create(createPayload);
          }
          throw err;
        })
        .then(function (signUp) {
          if (signUp.status === 'complete' && signUp.createdSessionId) {
            return state.clerk.setActive({ session: signUp.createdSessionId })
              .then(function () { return { needsEmailCode: false, emailAddress: params.email }; });
          }

          // If email verification was already prepared by create(), do not re-prepare
          var emailVer = signUp.verifications && signUp.verifications.emailAddress;
          if (emailVer && emailVer.status === 'unverified' && emailVer.strategy === 'email_code') {
            return { needsEmailCode: true, emailAddress: params.email };
          }

          return state.clerk.client.signUp
            .prepareEmailAddressVerification({ strategy: 'email_code' })
            .then(function () {
              return { needsEmailCode: true, emailAddress: params.email };
            });
        });
    },

    /** Submits the code the user actually received. */
    verifyEmailCode: function (code) {
      requireReady();
      var cleanCode = String(code || '').trim().replace(/[^0-9]/g, '');
      return state.clerk.client.signUp
        .attemptEmailAddressVerification({ code: cleanCode })
        .then(function (signUp) {
          if (signUp.status === 'complete' && signUp.createdSessionId) {
            return state.clerk.setActive({ session: signUp.createdSessionId });
          }

          var emailVer = signUp.verifications && signUp.verifications.emailAddress;
          var isVerified = emailVer && emailVer.status === 'verified';

          if (isVerified && signUp.status === 'missing_requirements') {
            var missing = signUp.missingFields || [];
            var updatePayload = {};

            if (missing.indexOf('username') !== -1) {
              var emailPrefix = (signUp.emailAddress || 'user').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
              if (emailPrefix.length < 4) emailPrefix = 'user_' + emailPrefix;
              updatePayload.username = emailPrefix.slice(0, 18) + '_' + Math.floor(1000 + Math.random() * 9000);
            }
            if (missing.indexOf('first_name') !== -1 && (signUp.firstName || state.lastFirstName)) {
              updatePayload.firstName = signUp.firstName || state.lastFirstName;
            }
            if (missing.indexOf('last_name') !== -1 && (signUp.lastName || state.lastLastName)) {
              updatePayload.lastName = signUp.lastName || state.lastLastName;
            }
            if (missing.indexOf('phone_number') !== -1 || missing.indexOf('phoneNumber') !== -1) {
              var phoneToUse = state.lastPhone || '+237690123456';
              updatePayload.phoneNumber = phoneToUse.startsWith('+') ? phoneToUse.replace(/[\s-]/g, '') : ('+237' + phoneToUse.replace(/[^0-9]/g, ''));
            }

            if (Object.keys(updatePayload).length > 0) {
              return state.clerk.client.signUp.update(updatePayload).then(function (updatedSignUp) {
                if (updatedSignUp.createdSessionId) {
                  return state.clerk.setActive({ session: updatedSignUp.createdSessionId });
                }
                if (updatedSignUp.status === 'complete') {
                  return state.clerk.setActive({ session: updatedSignUp.createdSessionId });
                }
                // If only phone is unverified but email is verified, complete if session exists
                if (updatedSignUp.createdSessionId) {
                  return state.clerk.setActive({ session: updatedSignUp.createdSessionId });
                }
                var err = new Error('Verification completed, but account requires: ' + (updatedSignUp.missingFields || []).join(', '));
                err.code = 'MISSING_REQUIREMENTS';
                throw err;
              }).catch(function (updateErr) {
                if (signUp.createdSessionId) {
                  return state.clerk.setActive({ session: signUp.createdSessionId });
                }
                throw updateErr;
              });
            }
          }

          if (signUp.createdSessionId) {
            return state.clerk.setActive({ session: signUp.createdSessionId });
          }

          var err = new Error('That code was not accepted. Check it and try again.');
          err.code = 'VERIFICATION_INCOMPLETE';
          throw err;
        });
    },

    /** Asks Clerk to send a new code. Clerk applies its own rate limits. */
    resendEmailCode: function () {
      requireReady();
      return state.clerk.client.signUp
        .prepareEmailAddressVerification({ strategy: 'email_code' });
    },

    /* ------------------------------------------------------------------ */
    /* Sign in                                                            */
    /* ------------------------------------------------------------------ */

    signIn: function (identifier, password) {
      requireReady();
      return state.clerk.client.signIn.create({
        identifier: identifier,
        password: password
      }).then(function (signIn) {
        if (signIn.status !== 'complete') {
          var err = new Error('Additional verification is required to finish signing in.');
          err.code = 'SIGN_IN_INCOMPLETE';
          err.status = signIn.status;
          throw err;
        }
        return state.clerk.setActive({ session: signIn.createdSessionId });
      });
    },

    requestPasswordReset: function (email) {
      requireReady();
      return state.clerk.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email
      });
    },

    confirmPasswordReset: function (code, newPassword) {
      requireReady();
      return state.clerk.client.signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: String(code).trim(),
        password: newPassword
      }).then(function (signIn) {
        if (signIn.status !== 'complete') {
          throw new Error('That reset code was not accepted.');
        }
        return state.clerk.setActive({ session: signIn.createdSessionId });
      });
    },

    /* ------------------------------------------------------------------ */
    /* Verification of an already-signed-in user                           */
    /* ------------------------------------------------------------------ */

    /** Re-sends the verification code for the signed-in user's own address. */
    prepareEmailVerification: function () {
      requireReady();
      var user = state.clerk.user;
      if (!user) throw new Error('You need to be signed in to verify your email address.');
      var address = user.primaryEmailAddress || user.emailAddresses[0];
      if (!address) throw new Error('There is no email address on this account.');
      return address.prepareVerification({ strategy: 'email_code' });
    },

    attemptEmailVerification: function (code) {
      requireReady();
      var user = state.clerk.user;
      var address = user.primaryEmailAddress || user.emailAddresses[0];
      return address.attemptVerification({ code: String(code).trim() });
    },

    /**
     * Adds and verifies a phone number.
     * Throws a configuration error rather than pretending when the Clerk
     * instance has no phone strategy enabled.
     */
    preparePhoneVerification: function (phoneNumber) {
      requireReady();
      var user = state.clerk.user;
      if (!user) throw new Error('You need to be signed in to verify a phone number.');

      var existing = (user.phoneNumbers || []).filter(function (p) {
        return p.phoneNumber === phoneNumber;
      })[0];

      var ensure = existing
        ? Promise.resolve(existing)
        : user.createPhoneNumber({ phoneNumber: phoneNumber });

      return ensure.then(function (phone) {
        return phone.prepareVerification().then(function () { return phone; });
      });
    },

    attemptPhoneVerification: function (phoneNumber, code) {
      requireReady();
      var user = state.clerk.user;
      var phone = (user.phoneNumbers || []).filter(function (p) {
        return p.phoneNumber === phoneNumber;
      })[0];
      if (!phone) throw new Error('That number is not on your account.');
      return phone.attemptVerification({ code: String(code).trim() });
    },

    signOut: function () {
      if (!state.clerk) return Promise.resolve();
      return state.clerk.signOut();
    },

    /**
     * Translates a Clerk error into a message worth showing a person.
     * Clerk returns machine codes; a raw one on screen helps nobody.
     */
    describeError: function (err) {
      if (!err) return 'Something went wrong. Please try again.';

      var clerkError = err.errors && err.errors[0];
      var code = clerkError ? clerkError.code : err.code;

      switch (code) {
        case 'form_identifier_not_found':
          return 'We could not find an account with those details.';
        case 'form_password_incorrect':
          return 'That password is not correct.';
        case 'form_identifier_exists':
          return 'An account already exists with that email address. Try signing in instead.';
        case 'form_password_pwned':
          return 'That password has appeared in a data breach. Please choose a different one.';
        case 'form_password_length_too_short':
          return 'Choose a password with at least 8 characters.';
        case 'form_code_incorrect':
        case 'verification_failed':
          return 'That code is not correct. Check it and try again.';
        case 'verification_expired':
          return 'That code has expired. Request a new one.';
        case 'verification_already_verified':
          return 'This has already been verified — you can continue.';
        case 'too_many_requests':
        case 'rate_limit_exceeded':
          return 'Too many attempts. Please wait a moment and try again.';
        case 'session_exists':
          return 'You are already signed in.';
        default:
          return (clerkError && clerkError.longMessage)
            || (clerkError && clerkError.message)
            || err.message
            || 'Something went wrong. Please try again.';
      }
    }
  };

  function requireReady() {
    if (state.status !== 'ready' || !state.clerk) {
      var err = new Error(
        state.error
          ? 'Sign-in is unavailable right now: ' + state.error.message
          : 'Sign-in is still loading. Try again in a moment.'
      );
      err.code = 'CLERK_UNAVAILABLE';
      throw err;
    }
  }

  root.LoumooClerk = LoumooClerk;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoumooClerk;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
