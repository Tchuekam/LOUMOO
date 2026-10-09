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
