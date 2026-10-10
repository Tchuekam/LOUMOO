/**
 * LOUMOO — test-account provisioning through the application's OWN routes.
 * ---------------------------------------------------------------------------
 * Every account in the end-to-end run is created the way a person would create
 * one: sign up, confirm the emailed code, finish onboarding, and — for a seller —
 * create and activate a store and publish a listing. Nothing is inserted into a
 * table to skip a step. The two things that cannot be done through a public route
 * are done by the harness and are named as such:
 *
 *   - the one-time signup code is read from the development-mode response
 *     (`devOtp`), the same field the app returns to a developer's browser when no
 *     mail transport is configured;
 *   - the first administrator, who is the only person allowed to register riders,
 *     is promoted with a single UPDATE on the LOCAL database (an administrator is
 *     never self-service in this product).
 *
 * Everything is idempotent: each helper looks for the thing first and only
 * creates it when it is missing, so re-running against a kept database does not
 * multiply accounts, stores, listings or riders.
 *
 * Credentials are generated per run (or taken from the environment) and are never
 * written to the repository.
 */
'use strict';

const crypto = require('crypto');

const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * A real, valid RGB PNG (default 480x480) of a soft diagonal gradient with a
 * stripe pattern, so a product card in a screenshot looks like a product photo
 * placeholder rather than static. Generated, not bundled: no binary in the repo.
 */
function makePng(width = 480, height = 480, [r0, g0, b0] = [196, 138, 74], [r1, g1, b1] = [58, 74, 120]) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const t = (x + y) / (width + height);
      const stripe = ((x >> 5) + (y >> 5)) & 1 ? 10 : 0;
      const o = y * stride + 1 + x * 3;
      raw[o] = Math.min(255, Math.round(r0 + (r1 - r0) * t) + stripe);
      raw[o + 1] = Math.min(255, Math.round(g0 + (g1 - g0) * t) + stripe);
      raw[o + 2] = Math.min(255, Math.round(b0 + (b1 - b0) * t) + ((x * 7 + y * 13) & 7));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

class Api {
  constructor(baseUrl) { this.baseUrl = baseUrl; }

  async call(method, path, { body, token, headers = {}, raw } = {}) {
    const init = { method, headers: { ...headers } };
    if (token) init.headers.authorization = `Bearer ${token}`;
    if (raw !== undefined) {
      init.body = raw;
    } else if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const res = await fetch(this.baseUrl + path, init);
    const text = await res.text();
    let parsed;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return { status: res.status, body: parsed, headers: Object.fromEntries(res.headers.entries()) };
  }

  /** Like call(), but throws with the response attached when the status is not the expected one. */
  async must(method, path, opts = {}, expect = [200, 201]) {
    const r = await this.call(method, path, opts);
    if (!expect.includes(r.status)) {
      const e = new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(r.body).slice(0, 400)}`);
      e.response = r;
      throw e;
    }
    return r;
  }
}

const dataOf = (r) => (r && r.body && r.body.data) || null;

/** Sign in if the account exists, otherwise sign up and confirm the emailed code. */
async function registerAccount(api, { email, password, firstName, lastName, city = 'Douala', phone }) {
  let r = await api.call('POST', '/api/v1/auth/login', { body: { email, password } });
  if (r.status === 200) {
    const d = dataOf(r);
    return { token: d.token, userId: d.user.id, email, created: false };
  }
  r = await api.must('POST', '/api/v1/auth/signup', { body: { email, password, firstName, lastName, city, phone } });
  const code = dataOf(r).devOtp;
  if (!code) throw new Error('signup returned no devOtp: run the server with NODE_ENV=development');
  r = await api.must('POST', '/api/v1/auth/verify-otp', { body: { email, code } });
  const d = dataOf(r);
  return { token: d.token, userId: d.user.id, email, created: true };
}

async function accountState(api, token) {
  return dataOf(await api.must('GET', '/api/v1/me/state', { token }));
}

/** Walks the onboarding wizard from wherever the account is. */
async function completeOnboarding(api, token, { intent = 'buyer', firstName, lastName, phone, city = 'Douala', address, sellerType = 'individual' }) {
  let st = await accountState(api, token);
  if (st.state === 'ONBOARDING_REQUIRED') {
    await api.must('POST', '/api/v1/me/onboarding/start', { token, body: { intent } });
    st = await accountState(api, token);
  }
  const steps = {
    PERSONAL_INFO: { firstName, lastName, phoneNumber: phone, city },
    LOCATION: { city, address },
    MARKETPLACE_PREFERENCES: { interests: ['fashion'], priorities: ['price'] },
    SELLER_SETUP: { sellerType },
    COMPLETION: { acceptedTerms: true },
  };
  for (let guard = 0; guard < 8 && st.state === 'ONBOARDING_IN_PROGRESS'; guard++) {
    const next = (st.onboarding && st.onboarding.nextStep) || (dataOf(await api.must('GET', '/api/v1/me/onboarding', { token })).nextStep);
    if (!next || !steps[next]) throw new Error(`onboarding wants step ${next}, which the harness does not know`);
    await api.must('POST', `/api/v1/me/onboarding/steps/${next}`, { token, body: steps[next] });
    st = await accountState(api, token);
  }
  return st;
}

/** Creates (or finds) the seller's store and activates it, which makes the account SELLER_READY. */
async function ensureActiveStore(api, token, { name, category = 'fashion', city = 'Douala', description, phone }) {
  let r = await api.call('GET', '/api/v1/stores/me', { token });
  let store = r.status === 200 ? (dataOf(r).store || null) : null;
  if (!store) {
    r = await api.must('POST', '/api/v1/stores', { token, body: { name, category, city, description, phone } });
    store = dataOf(r);
  }
  const storeId = store.id;
  const st = await accountState(api, token);
  if (st.state !== 'SELLER_READY') {
    await api.must('PATCH', `/api/v1/stores/${storeId}/location`, { token, body: { city, region: 'Littoral', country: 'CM' } });
    await api.must('PATCH', `/api/v1/stores/${storeId}/onboarding`, { token, body: { step: 'ACTIVE' } });
  }
  return { storeId, state: (await accountState(api, token)).state };
}

/** Uploads one image and returns its upload id. */
async function uploadImage(api, token, bytes = makePng()) {
  const r = await api.must('POST', '/api/v1/uploads/listing-media', { token, raw: bytes, headers: { 'content-type': 'image/png' } });
  const d = dataOf(r);
  return d.uploadId || d.id;
}

/** Creates and publishes a listing (or returns the one already published with this title). */
async function ensurePublishedListing(api, token, listing) {
  const mine = await api.call('GET', '/api/v1/listings/seller?limit=100', { token });
  const rows = (dataOf(mine) && (dataOf(mine).listings || dataOf(mine).items || dataOf(mine))) || [];
  const existing = Array.isArray(rows) ? rows.find((l) => (l.title || '') === listing.title) : null;
  if (existing && String(existing.status).toUpperCase() === 'PUBLISHED') return existing;

  const uploadId = await uploadImage(api, token);
  const created = await api.must('POST', '/api/v1/listings', {
    token,
    headers: { 'Idempotency-Key': `e2e-${crypto.createHash('sha1').update(listing.title).digest('hex')}` },
    body: { ...listing, uploadIds: [uploadId] },
  });
  const id = dataOf(created).id;
  const published = await api.must('POST', `/api/v1/listings/${id}/publish`, { token, body: {} });
  return dataOf(published);
}

/** LOCAL ONLY. Promotes a profile to administrator with one UPDATE (no public route does this). */
async function promoteAdminLocal(db, userId) {
  const r = await db.query(
    `UPDATE iam.profiles SET primary_role = 'admin', updated_at = now() WHERE clerk_user_id = $1 RETURNING id`, [userId]);
  if (!r.rows.length) throw new Error(`no profile for user ${userId}`);
  return r.rows[0].id;
}

/**
 * The server caches a signed-in user's profile for five minutes, and a role changed
 * with a direct UPDATE does not clear that cache (a real role change goes through
 * ProfileRepository.update, which does). An ordinary profile edit through the API
 * takes that same path, so one is made right after a local promotion.
 */
async function refreshProfileCache(api, token) {
  await api.must('PATCH', '/api/v1/users/me', { token, body: { bio: 'LOUMOO operations' } });
}

/** The profile row id (what the delivery module calls a profileId) for an auth user id. */
async function profileIdFor(db, userId) {
  const r = await db.query('SELECT id FROM iam.profiles WHERE clerk_user_id = $1', [userId]);
  return r.rows[0] && r.rows[0].id;
}

/** An administrator registers a rider (POST /deliveries/drivers/:profileId), as an operator would. */
async function registerRider(api, adminToken, profileId, rider) {
  const r = await api.must('POST', `/api/v1/deliveries/drivers/${profileId}`, { token: adminToken, body: rider });
  return dataOf(r).driver;
}

module.exports = {
  Api, makePng, dataOf,
  registerAccount, accountState, completeOnboarding, ensureActiveStore, uploadImage, ensurePublishedListing,
  promoteAdminLocal, refreshProfileCache, profileIdFor, registerRider,
};
