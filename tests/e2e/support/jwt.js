/**
 * HS256 JWT helpers for the local end-to-end stack (Supabase-style API keys and
 * GoTrue access tokens). Test infrastructure only: the application has its own
 * verifier (SessionToken) and this never replaces it.
 */
'use strict';

const crypto = require('crypto');

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const fromB64u = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function mintJwt(secret, payload) {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

/** @returns {{ok:true,payload:object}|{ok:false,reason:string}} */
function verifyJwt(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  if (secret) {
    const expect = Buffer.from(b64u(crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest()));
    const got = Buffer.from(parts[2]);
    if (expect.length !== got.length || !crypto.timingSafeEqual(expect, got)) return { ok: false, reason: 'signature' };
  }
  let payload;
  try { payload = JSON.parse(fromB64u(parts[1]).toString('utf8')); } catch { return { ok: false, reason: 'malformed' }; }
  if (payload.exp && payload.exp * 1000 < Date.now()) return { ok: false, reason: 'expired' };
  return { ok: true, payload };
}
