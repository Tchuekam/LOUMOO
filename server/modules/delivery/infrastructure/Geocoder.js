/**
 * LOUMOO Delivery — Geocoder
 * ---------------------------------------------------------------------------
 * Turns a drop-off address into coordinates, so a delivery can have an ETA and a
 * distance. The checkout collects an address but no coordinates, and the seller's
 * "Arrange delivery" does not send any, so without this `etaMinutes` and
 * `distanceKm` stay null for the whole delivery.
 *
 * Best effort by design. A geocoder that is slow, down or confused must never stop a
 * seller arranging a delivery, so every failure is a quiet `null`: the delivery is
 * created without coordinates, exactly as it was before this existed, and the buyer's
 * tracker still places the drop-off on its own map.
 *
 * What it sends, and where: the customer's drop-off address (street, neighbourhood,
 * city) goes to the geocoding service named by DELIVERY_GEOCODER_URL. By default that
 * is the public OpenStreetMap Nominatim service, the same one the buyer's tracker already
 * asks from the browser. To keep addresses off a third party, run your own Nominatim and
 * point DELIVERY_GEOCODER_URL at it, or set it to `off`. The address is never logged.
 *
 *   DELIVERY_GEOCODER_URL         search endpoint; `off` / `false` / `0` switches it off
 *   DELIVERY_GEOCODER_COUNTRY     ISO country code to restrict to (default `cm`)
 *   DELIVERY_GEOCODER_USER_AGENT  Nominatim requires an identifying User-Agent
 *
 * Nominatim's usage policy asks for at most one request a second, so requests are
 * queued one at a time at least `minIntervalMs` apart, answers are cached, and a
 * request that would have to wait longer than its timeout is skipped, not queued.
 */

'use strict';

const logger = require('../../../shared/logging/logger');

const DEFAULT_URL = 'https://nominatim.openstreetmap.org/search';
const DEFAULT_USER_AGENT = 'LOUMOO-delivery/1.0 (+https://loumoo.tchuekam.com)';
const OFF_VALUES = ['off', 'false', '0', 'none', 'disabled'];
const NEGATIVE_TTL_MS = 5 * 60 * 1000;   // remember "not found" briefly, so a bad address is asked once
const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_QUEUE = 20;

function isOff(url) {
  return OFF_VALUES.includes(String(url).trim().toLowerCase());
}

function normalise(address) {
  return String(address || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** `{ lat, lng }` from a Nominatim result, or null if it is not a usable point. */
function toPoint(result) {
  if (!result) return null;
  const lat = Number(result.lat);
  const lng = Number(result.lon !== undefined ? result.lon : result.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // (0, 0) is what a failed lookup tends to look like; it is never a Cameroonian address.
  if (lat === 0 && lng === 0) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
}

function createGeocoder(options = {}) {
  const env = options.env || process.env;
  const configured = options.url !== undefined ? options.url : env.DELIVERY_GEOCODER_URL;
  const url = configured === undefined || configured === '' ? DEFAULT_URL : String(configured);
  const enabled = !isOff(url);
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const timeoutMs = options.timeoutMs !== undefined ? options.timeoutMs : 2500;
  const minIntervalMs = options.minIntervalMs !== undefined ? options.minIntervalMs : 1100;
  const now = options.now || (() => Date.now());
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const country = options.country !== undefined ? options.country : (env.DELIVERY_GEOCODER_COUNTRY || 'cm');
  const userAgent = options.userAgent || env.DELIVERY_GEOCODER_USER_AGENT || DEFAULT_USER_AGENT;

  const cache = new Map(); // normalised address -> { point, expires }
  let lastRequestAt = -Infinity; // no request yet: the first one never waits
  let tail = Promise.resolve();
  let queued = 0;

  if (!enabled || !fetchImpl) {
    return { enabled: false, geocode: async () => null };
  }

  function cached(key) {
    const hit = cache.get(key);
    if (!hit) return undefined;
    if (hit.expires <= now()) { cache.delete(key); return undefined; }
    return hit.point;
  }

  function remember(key, point) {
    if (cache.size >= 500) cache.delete(cache.keys().next().value); // oldest first
    cache.set(key, { point, expires: now() + (point ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS) });
  }

  async function lookup(address) {
    const params = new URLSearchParams({ q: address, format: 'jsonv2', limit: '1' });
    if (country) params.set('countrycodes', country);
    const separator = url.includes('?') ? '&' : '?';
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetchImpl(`${url}${separator}${params.toString()}`, {
        headers: { Accept: 'application/json', 'User-Agent': userAgent },
        signal: controller ? controller.signal : undefined
      });
      if (!res || !res.ok) return { point: null, answered: false };
      const body = await res.json();
      return { point: Array.isArray(body) ? toPoint(body[0]) : null, answered: true };
    } catch (err) {
      // Not even the error text: some runtimes echo the URL, which carries the address.
      logger.warn(`[Geocoder] lookup failed (${err && err.name ? err.name : 'error'}); the delivery goes ahead without coordinates.`);
      return { point: null, answered: false };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Coordinates for an address, or null. Never throws, never waits longer than ~timeoutMs. */
  async function geocode(address) {
    const key = normalise(address);
    if (key.length < 3) return null;
    const known = cached(key);
    if (known !== undefined) return known;
    if (queued >= MAX_QUEUE) return null;

    queued += 1;
    const run = tail.then(async () => {
      try {
        const again = cached(key); // an identical request may have finished while this one waited
        if (again !== undefined) return again;
        const wait = lastRequestAt + minIntervalMs - now();
        if (wait > timeoutMs) return null;     // would wait longer than the answer is worth
        if (wait > 0) await sleep(wait);
        lastRequestAt = now();
        const { point, answered } = await lookup(String(address).trim());
        if (answered) remember(key, point);     // a failure is not remembered: try again next time
        return point;
      } finally {
        queued -= 1;
      }
    });
    tail = run.catch(() => null);
    // A hard ceiling for the caller whatever happens inside (a fetch that never
    // settles). It is short and cleared below, so it is allowed to hold the loop.
    let cap;
    const ceiling = new Promise((resolve) => {
      cap = setTimeout(() => resolve(null), timeoutMs + minIntervalMs + 500);
    });
    try {
      return await Promise.race([run, ceiling]);
    } finally {
      clearTimeout(cap);
    }
  }

  return { enabled: true, geocode };
}

let shared = null;

/**
 * The process-wide geocoder the delivery service uses unless one is injected. Off
 * under test, so no suite ever touches the network.
 */
function getDefaultGeocoder() {
  if (!shared) {
    shared = process.env.NODE_ENV === 'test' && !process.env.DELIVERY_GEOCODER_URL
      ? { enabled: false, geocode: async () => null }
      : createGeocoder();
  }
  return shared;
}

module.exports = { createGeocoder, getDefaultGeocoder, toPoint, DEFAULT_URL };
