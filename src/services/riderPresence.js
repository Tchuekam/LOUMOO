/**
 * LOUMOO Rider presence (client)
 * ---------------------------------------------------------------------------
 * Keeps a rider's availability honest from the rider's side: the buttons that
 * change it (go online / offline, pause / resume) and the lightweight heartbeat
 * that tells the server "I am still here". Backed by /api/v1/deliveries/driver/
 * presence/* through window.deliveryApi (docs/DELIVERY_API.md, "Rider presence").
 *
 * The controller holds the state AS THE SERVER REPORTS IT, never a guess:
 *   - it changes state only from a server answer (an action, a refresh, a beat,
 *     or a snapshot handed to adopt()); a network error leaves the state alone
 *     and only marks `trouble`;
 *   - a heartbeat can never RAISE the state: if the server says the rider is
 *     offline or paused, the timer stops and the state shows it, so a beat that
 *     was in flight when the rider tapped "Go offline" cannot undo it;
 *   - the heartbeat timer runs only while the server says online or busy, and
 *     there is never more than one request in flight (requests run one after
 *     the other, so answers cannot arrive out of order);
 *   - the timer never asks for the rider's position unless the browser already
 *     granted geolocation, so a heartbeat can never raise a permission prompt;
 *     only a deliberate tap on Go online / Resume may. No position is not an
 *     error: the beat is simply sent without one.
 *
 * Works in the browser (window.LoumooRiderPresence) and in Node (module.exports),
 * with every side effect injectable so it can be tested with fake timers.
 *
 *   var ctl = LoumooRiderPresence.createPresenceController({ api: deliveryApi, locate: fn });
 *   ctl.subscribe(function (state) { ... });   // fires only on a real change
 *   ctl.start(); ctl.goOnline().catch(showError);
 */
(function () {
  'use strict';

  var DEFAULT_HEARTBEAT_MS = 30000;   // when the server does not say
  var MIN_HEARTBEAT_MS = 10000;       // a server value is clamped to this window
  var MAX_HEARTBEAT_MS = 60000;
  var LOCATE_TIMEOUT_MS = 3000;       // a position is a bonus: never wait long for one
  var REQUEST_TIMEOUT_MS = 20000;     // a request that never answers must not block every later one

  var STATUSES = { offline: 1, online: 1, busy: 1, paused: 1, suspended: 1 };
  var LIVE = { online: 1, busy: 1 };  // the statuses that need a heartbeat

  function noop() {}

  /** The server's interval, clamped to 10 s .. 60 s; 30 s when absent or unusable. */
  function clampHeartbeatInterval(ms) {
    var n = Number(ms);
    if (!isFinite(n) || n <= 0) return DEFAULT_HEARTBEAT_MS;
    return Math.min(MAX_HEARTBEAT_MS, Math.max(MIN_HEARTBEAT_MS, Math.round(n)));
  }

  /** {lat, lng, accuracyM?} with finite, in-range numbers, or null. */
  function cleanLocation(loc) {
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
    if (!isFinite(loc.lat) || !isFinite(loc.lng) || Math.abs(loc.lat) > 90 || Math.abs(loc.lng) > 180) return null;
    var out = { lat: loc.lat, lng: loc.lng };
    if (typeof loc.accuracyM === 'number' && isFinite(loc.accuracyM) && loc.accuracyM >= 0) out.accuracyM = loc.accuracyM;
    return out;
  }

  function isAuthError(err) { return !!err && (err.status === 401 || err.status === 403); }

  /**
   * @param {object} options
   *   api               the delivery API client (riderPresence/riderOnline/...); required
   *   locate(opts)      optional: resolves { lat, lng, accuracyM? } or null. Called with a
   *                     short timeout; a rejection or a timeout means "no position"
   *   permission()      optional: resolves the geolocation permission state ('granted',
   *                     'prompt', 'denied'). Default: navigator.permissions.query
   *   setIntervalFn / clearIntervalFn / setTimeoutFn / clearTimeoutFn   timers (tests)
   *   now()             the clock, in ms (tests)
   *   isVisible()       whether the page is in the foreground
   *   doc               where 'visibilitychange' is listened for (default: document)
   *   onChange(state)   same as subscribe()
   */
  function createPresenceController(options) {
    var o = options || {};
    var api = o.api;
    if (!api) throw new TypeError('createPresenceController needs an api');
    var locate = typeof o.locate === 'function' ? o.locate : null;
    var setIntervalFn = typeof o.setIntervalFn === 'function' ? o.setIntervalFn : function (fn, ms) { return setInterval(fn, ms); };
    var clearIntervalFn = typeof o.clearIntervalFn === 'function' ? o.clearIntervalFn : function (h) { clearInterval(h); };
    var setTimeoutFn = typeof o.setTimeoutFn === 'function' ? o.setTimeoutFn : function (fn, ms) { return setTimeout(fn, ms); };
    var clearTimeoutFn = typeof o.clearTimeoutFn === 'function' ? o.clearTimeoutFn : function (h) { clearTimeout(h); };
    var now = typeof o.now === 'function' ? o.now : function () { return Date.now(); };
    var doc = o.doc !== undefined ? o.doc : (typeof document !== 'undefined' ? document : null);
    var isVisible = typeof o.isVisible === 'function' ? o.isVisible : function () { return !doc || !doc.hidden; };
    var permissionFn = typeof o.permission === 'function' ? o.permission : defaultPermission;

    var S = {
      known: false,          // has the server told us yet
      status: 'unknown',     // unknown | offline | online | busy | paused | suspended
      available: false,
      reason: null,
      expired: false,        // went offline because the app stopped responding
      lastSeenAt: null,
      expiresAt: null,
      ttlSeconds: null,
      heartbeatIntervalMs: DEFAULT_HEARTBEAT_MS,
      location: null,
      syncedAt: null,        // local time of the last server answer
      pending: null,         // the action being sent: online | offline | pause | resume
      trouble: false,        // the last request failed to get through (state NOT guessed)
      denied: null           // { status, code, message } after a 401/403
    };

    var started = false;
    var epoch = 0;           // bumps on every state-changing event; guards stale snapshots
    var tail = Promise.resolve();
    var queued = 0;          // requests queued or running
    var actionsWaiting = 0;  // user actions queued behind the running request
    var pendingCount = 0;
    var timerOn = false, timer = null, timerMs = 0;
    var visibilityOn = false;
    var listeners = [];
    var lastSig = null;

    function live() { return !!LIVE[S.status]; }

    function getState() {
      var copy = {};
      for (var k in S) if (Object.prototype.hasOwnProperty.call(S, k)) copy[k] = S[k];
      copy.location = S.location ? { lat: S.location.lat, lng: S.location.lng, accuracyM: S.location.accuracyM } : null;
      copy.denied = S.denied ? { status: S.denied.status, code: S.denied.code, message: S.denied.message } : null;
      copy.live = live();
      return copy;
    }

    // What a screen would redraw for. Deliberately not the timestamps: a beat that
    // changes nothing but "last seen" is not a change.
    function signature() {
      return [S.known, S.status, S.reason, S.expired, S.pending, S.trouble, S.denied ? S.denied.status : ''].join('|');
    }
    function emit() {
      var sig = signature();
      if (sig === lastSig) return;
      lastSig = sig;
      var snapshot = getState();
      listeners.slice().forEach(function (fn) { try { fn(snapshot); } catch (e) { /* a screen's bug must not stop the heartbeat */ } });
    }
    function subscribe(fn) {
      if (typeof fn !== 'function') return noop;
      listeners.push(fn);
      return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    }
    lastSig = signature();
    if (typeof o.onChange === 'function') subscribe(o.onChange);

    // ------------------------------------------------------------ geolocation
    function defaultPermission() {
      if (typeof navigator === 'undefined' || !navigator.permissions || typeof navigator.permissions.query !== 'function') return 'unsupported';
      return navigator.permissions.query({ name: 'geolocation' }).then(function (r) { return r && r.state; });
    }
    function permissionState() {
      return Promise.resolve().then(permissionFn).then(function (s) { return String(s); }, function () { return 'unknown'; });
    }
    function withTimeout(promise, ms) {
      return new Promise(function (resolve) {
        var t = setTimeoutFn(function () { resolve(null); }, ms);
        promise.then(function (v) { clearTimeoutFn(t); resolve(v); }, function () { clearTimeoutFn(t); resolve(null); });
      });
    }
    /**
     * The rider's position, or null. Never throws, never waits long. Without a user
     * gesture it asks only when the permission is ALREADY granted (so it can never
     * raise a prompt); for a deliberate tap it asks unless the browser said no.
     */
    function getLocation(gesture) {
      if (!locate) return Promise.resolve(null);
      return permissionState().then(function (state) {
        if (gesture ? state === 'denied' : state !== 'granted') return null;
        return withTimeout(Promise.resolve().then(function () { return locate({ timeoutMs: LOCATE_TIMEOUT_MS }); }), LOCATE_TIMEOUT_MS);
      }).then(cleanLocation, function () { return null; });
    }

    // ----------------------------------------------------------- the heartbeat
    function onVisibility() { if (isVisible()) beat(); }
    function attachVisibility() {
      if (visibilityOn || !doc || typeof doc.addEventListener !== 'function') return;
      doc.addEventListener('visibilitychange', onVisibility);
      visibilityOn = true;
    }
    function detachVisibility() {
      if (!visibilityOn) return;
      try { doc.removeEventListener('visibilitychange', onVisibility); } catch (e) { /* ignore */ }
      visibilityOn = false;
    }
    function stopTimer() {
      if (timerOn) { clearIntervalFn(timer); timerOn = false; timer = null; }
      timerMs = 0;
      detachVisibility();
    }
    /** Make the timer match the state: it runs only while started and online or busy. */
    function sync() {
      if (!(started && !S.denied && live())) { stopTimer(); return; }
      var ms = clampHeartbeatInterval(S.heartbeatIntervalMs);
      if (timerOn && timerMs === ms) return;
      if (timerOn) { clearIntervalFn(timer); timerOn = false; }
      timer = setIntervalFn(function () { beat(); }, ms);
      timerOn = true;
      timerMs = ms;
      attachVisibility();
    }

    // --------------------------------------------------------- server answers
    /**
     * Take a presence object the server sent. Returns whether it changed the state.
     * `source` is 'action' | 'refresh' | 'adopt' | 'beat'; a beat is never allowed to
     * raise the state (offline or paused stays so).
     */
    function applyPresence(p, source) {
      if (!p || typeof p !== 'object' || !STATUSES[String(p.status)]) return false;
      var prev = S.status;
      S.trouble = false; // an answer got through
      // Defence in depth: requests run one at a time, so a beat's answer already cannot
      // arrive after a different state was set. If that ever changed, it must still not raise.
      if (source === 'beat' && !LIVE[prev]) { emit(); return false; }

      var expired = false;
      if (p.status === 'offline') {
        if (p.reason === 'expired') expired = true;
        // The rider did not ask for this and the server did: they went quiet. (The
        // sweeper may have set them offline before their app woke up to say so, in
        // which case the server's own reason has already reverted to plain "offline".)
        else if (LIVE[prev] && source !== 'action') expired = true;
        else if (S.expired && prev === 'offline' && source !== 'action') expired = true;
      }
      S.known = true;
      S.status = p.status;
      S.available = p.available === true && p.status === 'online';
      S.reason = expired ? 'expired' : (p.reason || null);
      S.expired = expired;
      S.lastSeenAt = p.lastSeenAt || null;
      S.expiresAt = p.expiresAt || null;
      S.ttlSeconds = typeof p.ttlSeconds === 'number' ? p.ttlSeconds : S.ttlSeconds;
      S.heartbeatIntervalMs = clampHeartbeatInterval(p.heartbeatIntervalMs);
      S.location = p.location && typeof p.location === 'object' ? cleanLocation(p.location) : null;
      S.syncedAt = now();
      S.denied = null;
      epoch += 1;
      sync();
      emit();
      return true;
    }

    function deny(err) {
      started = false;
      stopTimer();
      S.denied = { status: err.status, code: err.code || null, message: err.message || '' };
      S.known = false;
      S.status = 'unknown';
      S.available = false;
      S.reason = null;
      S.expired = false;
      S.location = null;
      S.trouble = false;
      epoch += 1;
      emit();
    }

    function setTrouble(on) {
      if (S.trouble === on) return;
      S.trouble = on;
      emit();
    }

    // ------------------------------------------------------ one request at a time
    /**
     * Runs one API call but stops WAITING for it after REQUEST_TIMEOUT_MS. Requests run
     * one after the other, so a call that never answers (a stalled mobile connection has
     * no error to give) would otherwise freeze every later beat and tap behind it. The
     * timeout error has no `status`: it is read as a network problem, so the state is not
     * guessed. An answer that turns up after the timeout is dropped, never applied.
     */
    function request(call) {
      return new Promise(function (resolve, reject) {
        var timer = setTimeoutFn(function () {
          var err = new Error('The request took too long.');
          err.code = 'TIMEOUT';
          reject(err);
        }, REQUEST_TIMEOUT_MS);
        // A promise settles once: whichever of the answer and the timer comes second changes nothing.
        Promise.resolve().then(call).then(function (value) {
          clearTimeoutFn(timer); resolve(value);
        }, function (err) {
          clearTimeoutFn(timer); reject(err);
        });
      });
    }

    function enqueue(job) {
      queued += 1;
      var run = tail.then(job);
      var done = function () { queued -= 1; };
      tail = run.then(done, done);
      return run;
    }

    /** One heartbeat. Skipped when anything else is already queued or running. */
    function beat() {
      if (!started || S.denied || !live() || queued > 0) return Promise.resolve(false);
      return enqueue(function () {
        if (!started || !live()) return false;
        return getLocation(false).then(function (loc) {
          // Re-check after the (possibly slow) position: the rider may have moved on,
          // and an action waiting for its turn goes first.
          if (!started || !live() || actionsWaiting > 0) return false;
          return request(function () { return api.riderHeartbeat(loc); }).then(function (res) {
            var p = res && res.presence;
            if (!p || !STATUSES[String(p.status)]) { setTrouble(true); return false; }
            return applyPresence(p, 'beat');
          });
        }).catch(function (err) {
          if (isAuthError(err)) { deny(err); return false; }
          setTrouble(true); // transient: the next tick retries; the state stays as the server last said
          return false;
        });
      }).catch(function () { return false; });
    }

    function fetchPresence() {
      return request(function () { return api.riderPresence(); }).then(function (res) {
        var p = res && res.presence;
        if (!p || !STATUSES[String(p.status)]) { setTrouble(true); return false; }
        return applyPresence(p, 'refresh');
      }, function (err) {
        if (isAuthError(err)) { deny(err); return false; }
        setTrouble(true);
        return false;
      });
    }

    /** Ask the server where this rider stands. Resolves the state; never rejects. */
    function refresh() {
      return enqueue(fetchPresence).then(getState, getState);
    }

    // ------------------------------------------------------------ user actions
    function settle() {
      pendingCount -= 1;
      if (pendingCount <= 0) { pendingCount = 0; S.pending = null; emit(); }
    }

    /**
     * One deliberate action. Resolves the state the server reports; rejects with the
     * API error (RIDER_BUSY, RIDER_UNAVAILABLE, ...) so the screen can say why.
     */
    function act(name, call, withPosition) {
      actionsWaiting += 1;
      pendingCount += 1;
      S.pending = name;
      emit();
      return enqueue(function () {
        actionsWaiting -= 1;
        return (withPosition ? getLocation(true) : Promise.resolve(null)).then(function (loc) {
          return request(function () { return call(loc); });
        }).then(function (res) {
          var p = res && res.presence;
          if (!p || !applyPresence(p, 'action')) {
            // Not a network failure and not an answer: give the screen words, not "you're offline".
            var unreadable = new Error('The server did not say where you stand. Try again.');
            unreadable.status = 502;
            throw unreadable;
          }
        }).catch(function (err) {
          if (isAuthError(err)) { deny(err); throw err; }
          // 409: the server disagrees with what we showed (e.g. the rider is busy now).
          // Fetch the truth so the screen is right, then still report the refusal.
          if (err && err.status === 409) return fetchPresence().then(function () { throw err; });
          throw err;
        });
      }).then(function () { settle(); return getState(); }, function (err) { settle(); throw err; });
    }

    function goOnline() { return act('online', function (loc) { return api.riderOnline(loc); }, true); }
    function goOffline() { return act('offline', function () { return api.riderOffline(); }, false); }
    function pause() { return act('pause', function () { return api.riderPause(); }, false); }
    function resume() { return act('resume', function (loc) { return api.riderResume(loc); }, true); }

    // ------------------------------------------------------------- life cycle
    /** Arm the heartbeat for as long as the server says online or busy. Idempotent. */
    function start() {
      started = true;
      sync();
      return getState();
    }
    /** Clear the timer and the listener. Does not change anything on the server. */
    function stop() {
      started = false;
      stopTimer();
    }

    /**
     * A snapshot taken elsewhere (the rider overview carries one, so the hub needs no
     * extra request). `token` is epoch() read BEFORE that request was sent: if
     * anything has happened since, the snapshot is older than what we know and is dropped.
     */
    function adopt(presence, token) {
      if (token !== undefined && token !== epoch) return false;
      if (queued > 0) return false;
      return applyPresence(presence, 'adopt');
    }

    return {
      refresh: refresh,
      goOnline: goOnline,
      goOffline: goOffline,
      pause: pause,
      resume: resume,
      start: start,
      stop: stop,
      adopt: adopt,
      epoch: function () { return epoch; },
      subscribe: subscribe,
      getState: getState
    };
  }

  // ------------------------------------------------------- what a screen shows
  // Pure: the words, tone and buttons for a state, so the card in the rider hub is
  // a dumb renderer and the rules below are testable without a DOM.

  /**
   * The availability card for a state: { tone, label, title, text, note, actions },
   * where actions are { act: 'online'|'offline'|'pause'|'resume', label, kind }.
   * null while the server has not said yet (an older server without presence, or
   * before the first answer): the hub then shows no card at all.
   */
  function describeAvailability(state) {
    if (!state || !state.known) return null;
    var note = state.trouble && LIVE[state.status] ? 'Connection problem. Trying again…' : null;
    var offline = { act: 'offline', label: 'Go offline', kind: 'gray' };
    switch (state.status) {
      case 'online':
        return { tone: 'ok', label: 'Online', title: 'You’re online', text: 'New delivery offers will be sent to you.', note: note,
          actions: [{ act: 'pause', label: 'Pause', kind: 'gray' }, offline] };
      case 'busy':
        return { tone: 'accent', label: 'On a delivery', title: 'You’re on a delivery', text: 'Availability is locked while you’re on a delivery.', note: note, actions: [] };
      case 'paused':
        return { tone: 'warn', label: 'Paused', title: 'You’re on a break', text: 'You won’t get new offers until you resume.', note: null,
          actions: [{ act: 'resume', label: 'Resume', kind: 'filled' }, offline] };
      case 'suspended':
        return { tone: 'bad', label: 'Suspended', title: 'Your rider account is suspended', text: 'Contact the LOUMOO team to be reactivated.', note: null, actions: [] };
      default: // offline
        return { tone: state.expired ? 'warn' : 'muted', label: 'Offline', title: 'You’re offline', note: null,
          text: state.expired ? 'You went offline because the app stopped responding.' : 'Go online to receive new delivery offers.',
          actions: [{ act: 'online', label: 'Go online', kind: 'filled' }] };
    }
  }

  /** The hint for an offer the rider cannot accept right now, or null when they can. */
  function offerHint(state) {
    if (!state || !state.known) return null;
    if (state.status === 'paused') return 'You’re on a break. Resume to accept this offer.';
    if (state.status === 'offline') return 'You’re offline. Go online to accept this offer.';
    return null;
  }

  var exported = {
    createPresenceController: createPresenceController,
    describeAvailability: describeAvailability,
    offerHint: offerHint,
    clampHeartbeatInterval: clampHeartbeatInterval,
    DEFAULT_HEARTBEAT_MS: DEFAULT_HEARTBEAT_MS,
    MIN_HEARTBEAT_MS: MIN_HEARTBEAT_MS,
    MAX_HEARTBEAT_MS: MAX_HEARTBEAT_MS,
    LOCATE_TIMEOUT_MS: LOCATE_TIMEOUT_MS,
    REQUEST_TIMEOUT_MS: REQUEST_TIMEOUT_MS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = exported;
  if (typeof window !== 'undefined') window.LoumooRiderPresence = exported;
})();
