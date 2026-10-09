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
