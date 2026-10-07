// @fragment prelude core — top-level helpers and constants owned by the core domain (assembled into Component by src/core/build/component.py)

// Global delegated video controller: seamless autoplay loop with sound toggle
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.toggleVideoSound = function(e) {
    if (e) {
      if (e.stopPropagation) e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
    }
    var btn = (e && e.currentTarget) || (e && e.target && e.target.closest && e.target.closest('.loumoo-video-unmute-btn'));
    if (!btn) return;
    var card = btn.closest('.insta-video-card-tall, .insta-video-card-wide, .insta-video-card-compact, .lifestyle-card, .loumoo-rail-card-story, [data-hover-video], .hero-media-wrap, .editorial-video-card, .collection-v2-card') || btn.parentElement;
    var vid = card ? card.querySelector('video') : null;
    if (!vid) return;

    if (vid.muted) {
      // Mute all other videos on the page so only one plays sound at a time
      document.querySelectorAll('video').forEach(function(v) {
        if (v !== vid) {
          v.muted = true;
        }
      });
      document.querySelectorAll('.loumoo-video-unmute-btn').forEach(function(b) {
        if (b !== btn) {
          b.classList.remove('is-sound-on');
          b.setAttribute('aria-label', 'Unmute video');
        }
      });

      vid.muted = false;
      vid.volume = 1.0;
      var playPromise = vid.play();
      if (playPromise && playPromise.catch) playPromise.catch(function() {});
      btn.classList.add('is-sound-on');
      btn.setAttribute('aria-label', 'Mute video');
    } else {
      vid.muted = true;
      btn.classList.remove('is-sound-on');
      btn.setAttribute('aria-label', 'Unmute video');
    }
  };

  // Capture phase listener so clicks on unmute button NEVER bubble to card click/modal
  if (!window.__loumooVideoSoundAttached) {
    window.__loumooVideoSoundAttached = true;
    document.addEventListener('click', function(e) {
      var btn = e.target && e.target.closest && e.target.closest('.loumoo-video-unmute-btn');
      if (btn) {
        e.stopPropagation();
        e.preventDefault();
        window.toggleVideoSound(e);
      }
    }, true);
  }

  // Ensure autoplay videos play smoothly and continuously loop
  window.initLoumooAutoplayVideos = function() {
    var vids = document.querySelectorAll('video[autoplay]');
    vids.forEach(function(vid) {
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      var p = vid.play();
      if (p && p.catch) {
        p.catch(function() {});
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initLoumooAutoplayVideos);
  } else {
    setTimeout(window.initLoumooAutoplayVideos, 50);
  }
}

const SCREENS = [
  // NOTE: 'sellers' was declared here but has no template anywhere, so any
  // control routed to it landed the user on a blank screen. The two "COMPARE
  // SELLERS" buttons now point at 'vs' (the comparison hub, which exists).
  'home','search','filters','voice','category','bestpicks','freeday','notifications','chat','threadAi','threadSeller',
  'product','cart','checkout','paying','success','orders','store','business','brand','vs','vsCompare','visual',
  'visualScan','visualResults','myListings','travel','travelBus',
  'travelPackages','travelVisa','travelResults','travelDetail','travelPassenger','travelTicket','hotelVoucher','announce','announceCampaigns','announceDetail',
  'profile','seller','settings','payFailed','networkError','saved','transactions','loading',
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardAdaptive','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess',
  // Phase A — Account access (returning users)
  'signIn','forgotPassword','resetPassword','verifyEmail',
  // Phase B — User Account Hub
  'accountDashboard','editProfile','addresses','addAddress','editAddress','notificationPreferences','privacySettings','securitySettings','followedStores','userActivity','deleteAccount',
  // Phase D — Product & Vertical Completeness
  'orderDetail','refundRequest','writeReview','sellerOrderDetail','sellerPayouts','hotelSearch','hotelDetail','hotelBooking',
  // Phase E — Store & Business System (Prompt 05)
  'createStore','storeOnboarding','storeSettings','storeVerification','storeAnalytics',
  // Phase F — Universal Publishing Engine.
  // `listingAttributes` and `listingPreview` were declared here but nothing
  // ever navigated to them, and the preview they rendered was hardcoded. The
  // studio below replaces the whole wizard.
  'publishIntent','publishStudio','publishReview','publishSuccess',
  'publicUserProfile','sellerPublicPage',
  // Phase 4 — SuperAdmin Executive Console
  'superAdmin'
];
// ── Seller WhatsApp lines (Cameroon) ──
// Real deep-link messaging: contacting a seller opens WhatsApp with a
// pre-filled enquiry to that store's line. Numbers are per-store; new sellers
// register theirs at onboarding. Format = full international MSISDN, digits
// only, ready for a wa.me link. Unknown stores fall back to the LOUMOO line.
const SELLER_WHATSAPP_DEFAULT = '237690123456';
const SELLER_WHATSAPP = {
  'Orca Electronics': '237677101234',
  'Digital Corner': '237699204567',
  'iStore Cameroon': '237677308899',
  'Samsung Experience Store': '237655412200',
  'SmartLiving CM': '237678503311',
  'Oraimo Official CM': '237691604422',
  'TECNO Official': '237677705533',
  'Kraasa Official': '237699806644',
  'Armonía Milano Boutique': '237655907755',
  'Maison Danbaoly': '237678108866',
  'Bigtree Footwear': '237691209977',
  'Douala Heritage Atelier': '237677310088',
  'Sahel Leather Works': '237655411099',
  'Nubian Glow Beauty': '237699512100',
  'Creator Hub CM': '237678613211',
  'Kamer Tech Solutions': '237677814455',
  'Sawa Luxury Hotel': '237233435566',
  'Sawa Luxury Resort': '237233435566'
};
function resolveSellerWhatsApp(name) {
  const dynamicDefault = (typeof window !== 'undefined' && window.LOUMOO_SYSTEM_SETTINGS && window.LOUMOO_SYSTEM_SETTINGS.seller_whatsapp_default && window.LOUMOO_SYSTEM_SETTINGS.seller_whatsapp_default.number)
    ? String(window.LOUMOO_SYSTEM_SETTINGS.seller_whatsapp_default.number)
    : SELLER_WHATSAPP_DEFAULT;
  if (!name) return dynamicDefault;
  if (SELLER_WHATSAPP[name]) return SELLER_WHATSAPP[name];
  // Store names vary ("Orca Electronics" vs "Orca Electronics Douala"): match
  // case-insensitively on a shared prefix so a variant still finds its line.
  const norm = String(name).toLowerCase().trim();
  for (const key in SELLER_WHATSAPP) {
    const k = key.toLowerCase();
    if (norm === k || norm.indexOf(k) === 0 || k.indexOf(norm) === 0) return SELLER_WHATSAPP[key];
  }
  return dynamicDefault;
}

// ── Dynamic City Shipping Rates ──
function resolveCityDeliveryFee(city) {
  const defaultRates = {
    Douala: 1000,
    Yaounde: 1500,
    Bafoussam: 2500,
    Kribi: 2500,
    Bamenda: 3000,
    Garoua: 4000,
    Maroua: 4500
  };
  const dynamicRates = (typeof window !== 'undefined' && window.LOUMOO_SYSTEM_SETTINGS && window.LOUMOO_SYSTEM_SETTINGS.shipping_rates_by_city)
    ? window.LOUMOO_SYSTEM_SETTINGS.shipping_rates_by_city
    : defaultRates;
  if (!city) return dynamicRates['Douala'] || 1000;
  const c = String(city).trim().toLowerCase();
  for (const k in dynamicRates) {
    if (k.toLowerCase() === c) return Number(dynamicRates[k]) || 1000;
  }
  return dynamicRates['Douala'] || 1000;
}
const GROUPS = {
  searchTab: ['all','products','stores','services','travel'],
  chatTab: ['all','buying','selling','orders','support'],
  sellerSort: ['value','cheap','fast'],
  ordersTab: ['active','delivered','travel','refunds'],
  catChip: ['douala','yaounde','kribi','under','rated'],
  bizTab: ['products','services','offers','reviews','about'],
  vmTab: ['exact','similar'],
  listTab: ['live','drafts','sold','paused'],
  travelTab: ['flights','bus','packages','visa'],
  trSort: ['cheap','fast','direct','morning'],
  pkgChip: ['weekend','beach','intl','group'],
  annChip: ['all','services','offers','jobs','events','tenders'],
  ftype: ['products','stores','services','travel','announcements'],
  ftrust: ['verified','rated','escrow'],
  pvar: ['g256','g512'],
  pcolor: ['grey','midnight'],
  photo: ['p1','p2','p3','p4','p5'],
  pay: ['mtn','om','card'],
  deliv: ['home','pickup'],
  uqty: ['one','multi','order']
};
const NO_NAV = [
  'product',
  'visual','visualScan','visualResults','threadAi','threadSeller','checkout','paying','success','travelTicket',
  'voice','filters','payFailed','networkError','loading',
  'onboardWelcome','onboardType','onboardIdentity','onboardOtp','onboardAdaptive','onboardBuyer','onboardSeller','onboardBusiness','onboardVerify','onboardReview','onboardSuccess',
  'signIn','forgotPassword','resetPassword','verifyEmail',
  'editProfile','addAddress','editAddress','deleteAccount','refundRequest','writeReview','sellerOrderDetail','hotelDetail','hotelBooking','hotelVoucher',
  'createStore','storeOnboarding','storeSettings','storeVerification','storeAnalytics',
  'publishIntent','publishStudio','publishReview','publishSuccess',
  'publicUserProfile','sellerPublicPage',
  'superAdmin'
];

/**
 * Canonical browser API client (src/services/loumooApi.js, loaded in <head>).
 * Resolved lazily and defensively: the x-dc script is also executed inside a
 * bare Node `vm` sandbox by tests/unit/authenticated_ui.test.js where neither
 * `window` nor `fetch` exist. Every call site must tolerate `null`.
 */
function getApi() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooAPI) return window.LoumooAPI;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooAPI) return globalThis.LoumooAPI;
  } catch (e) { /* sandboxed */ }
  return null;
}

/**
 * The client account guard (src/services/accountGuard.js). It caches the
 * server's answer from GET /api/v1/me/state; it never decides anything itself.
 */
function getGuard() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooGuard) return window.LoumooGuard;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooGuard) return globalThis.LoumooGuard;
  } catch (e) { /* sandboxed */ }
  return null;
}


/**
 * The publishing engine (src/services/publishingEngine.js), resolved the same
 * defensive way as the API client: the x-dc script is also executed inside a
 * bare Node `vm` sandbox by the frontend tests, where `window` does not exist.
 */
function getPublishing() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooPublishing) return window.LoumooPublishing;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooPublishing) return globalThis.LoumooPublishing;
  } catch (e) { /* sandboxed */ }
  return null;
}

/**
 * Turns an API rejection into something a seller can act on.
 *
 * The server's own message is always preferred — it knows what went wrong.
 * The fallbacks only cover the cases where there is no server to ask.
 */
function friendlyError(err) {
  if (!err) return 'Something went wrong. Please try again.';
  if (err.code === 'OFFLINE' || err.status === 0) {
    return 'You appear to be offline. Your work is saved on this device and will sync when you reconnect.';
  }
  if (err.status === 401) return 'Your session has expired. Sign in again to continue.';
  if (err.status === 403) return err.message || 'Your account cannot do that yet.';
  if (err.status === 404) return 'That is no longer available.';
  if (err.status === 409) return err.message || 'That conflicts with something that already exists.';
  if (err.status === 413) return 'That file is too large.';
  if (err.status === 429) return 'You are going a little fast. Wait a moment and try again.';
  if (err.status >= 500) return 'LOUMOO had a problem on its side. Try again in a moment.';
  return err.message || 'Something went wrong. Please try again.';
}

/** Folds the server's per-field errors into the studio's error map. */
function mergeFieldErrors(existing, fields) {
  const out = Object.assign({}, existing || {});
  (fields || []).forEach(f => {
    if (!f || !f.field) return;
    // The server namespaces nested fields exactly as the engine paths do.
    out[f.field] = f.message;
  });
  return out;
}

/**
 * Returns the studio to the top of the editor when the section changes.
 *
 * On desktop the scroll container is `.scr`; on mobile the page itself moves.
 * Wrapped because the x-dc script also runs without a DOM.
 */
function scrollStudioToTop() {
  try {
    if (typeof document === 'undefined') return;
    const scroller = document.querySelector('.scr');
    if (scroller && scroller.scrollTo) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    else if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) { /* no DOM */ }
}

/**
 * Scrolls to a field and puts the cursor in it.
 *
 * This is what turns "3 things need attention" into three clicks to fixed: the
 * seller lands on the offending input, not on the section that contains it.
 * Deferred one frame so the section has rendered before we look for the node.
 */
function focusStudioField(path) {
  try {
    if (typeof document === 'undefined') return;
    const key = String(path).replace(/\./g, '__');
    setTimeout(() => {
      const wrapper = document.getElementById('pubfield-' + key);
      if (wrapper && wrapper.scrollIntoView) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const input = document.getElementById('pubinput-' + key);
      if (input && input.focus) input.focus({ preventScroll: true });
    }, 90);
  } catch (e) { /* no DOM */ }
}

/** A local preview URL, or an empty string where the browser cannot make one. */
function safeObjectUrl(file) {
  try {
    if (typeof URL !== 'undefined' && URL.createObjectURL) return URL.createObjectURL(file);
  } catch (e) { /* no object URLs available */ }
  return '';
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Password strength meter. Presentation only: it guides the user towards a
 * good password, it does not decide whether one is acceptable — Clerk does
 * that, including checking against known breach corpora.
 */
function passwordStrength(pw) {
  if (!pw) return { pct: '0%', label: '', color: 'var(--color-text-muted)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { pct: '33%', label: 'WEAK', color: 'var(--color-accent-sale)' };
  if (score <= 4) return { pct: '66%', label: 'GOOD', color: 'var(--color-accent-energy-text)' };
  return { pct: '100%', label: 'STRONG', color: 'var(--color-success)' };
}

/** The Clerk browser bridge (src/services/clerkSession.js). */
function getClerk() {
  try {
    if (typeof window !== 'undefined' && window && window.LoumooClerk) return window.LoumooClerk;
    if (typeof globalThis !== 'undefined' && globalThis && globalThis.LoumooClerk) return globalThis.LoumooClerk;
  } catch (e) { /* sandboxed */ }
  return null;
}

// Curated hospitality inventory — the single source of truth for the hotel
// vertical (search → detail → booking → voucher). Each hotel carries its own
// rooms so the selection is coherent end to end (no hardcoded mismatches).
/**
 * ISO date (YYYY-MM-DD) N days from today, in the viewer's local calendar.
 * Default stay dates must be computed, never written as literals — a literal
 * date quietly turns into a past date and the server rejects the search.
 */
function isoDaysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + (Number(days) || 0));
  const pad = (n) => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// The hotel catalog is served by the API (GET /travel/hotels) and is
// deliberately NOT bundled here: a local copy drifts from the server's real
// inventory and prices, and lets the UI advertise rooms that cannot be booked.

// Curated static catalog data is decoupled from the initial HTML shell to keep the
// initial document payload fast (<800 KiB) and prevent mobile DOM parse freezes.
// It is loaded asynchronously via src/data/catalog_products_bundle.js or /data/catalog.json.
const PRODUCTS_DATA = (typeof window !== 'undefined' && window.PRODUCTS_DATA) ? window.PRODUCTS_DATA : {
  // Externalized to public/data/catalog.json and src/data/catalog_products_bundle.js
};
if (typeof window !== 'undefined' && !window.PRODUCTS_DATA) {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
}

/* Video playback controllers for seamless hover-to-play media cards */
if (typeof window !== 'undefined') {
  window.loumooPlayVideo = function(container) {
    if (!container) return;
    try {
      const vid = container.querySelector('video');
      if (vid) {
        vid.muted = true;
        const p = vid.play();
        if (p && p.catch) p.catch(function() {});
      }
    } catch (_) {}
  };

  window.loumooPauseVideo = function(container) {
    if (!container) return;
    try {
      const vid = container.querySelector('video');
      if (vid) {
        vid.pause();
        vid.currentTime = 0;
      }
    } catch (_) {}
  };
}
