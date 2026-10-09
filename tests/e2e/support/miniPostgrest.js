/**
 * LOUMOO — a small PostgREST stand-in over a Postgres engine (PGlite).
 * ---------------------------------------------------------------------------
 * The server talks to its database through the UNMODIFIED @supabase/supabase-js
 * client, i.e. over the PostgREST HTTP protocol. To run the real application
 * against a real Postgres (the repo's migrations applied, real constraints, real
 * row-level security and grants) on a machine with no Docker and no hosted
 * project, this file answers that protocol:
 *
 *   GET    /rest/v1/<table>?select=&<col>=<op>.<val>&order=&limit=&offset=
 *   POST   /rest/v1/<table>            insert / upsert (Prefer: resolution=...)
 *   PATCH  /rest/v1/<table>?<filters>  update
 *   DELETE /rest/v1/<table>?<filters>  delete
 *   POST   /rest/v1/rpc/<fn>           call a function
 *
 * What it reproduces on purpose (because the application's behaviour depends on
 * it): the schema selected by Accept-Profile / Content-Profile; the Postgres role
 * taken from the JWT's `role` claim, applied with SET LOCAL ROLE so grants and RLS
 * are enforced by Postgres itself; `Accept: application/vnd.pgrst.object+json`
 * (supabase-js `.single()`) and its 406 / PGRST116; `Prefer: return=...`,
 * `count=exact` + Content-Range; `resolution=merge|ignore-duplicates` +
 * `on_conflict`; PGRST204 / PGRST205 for an unknown column / table (what a missing
 * migration looks like in production); and SQLSTATE codes passed through in the
 * error body with PostgREST's HTTP status mapping.
 *
 * What it does NOT reproduce, and says so instead of guessing: resource embedding
 * (`select=a,rel(*)`), full-text-search operators, and the Auth / Storage /
 * Realtime services. Those answer 501 with an explicit message so a test can never
 * pass by accident on an unsupported feature.
 *
 * This is test infrastructure. It is NOT PostgREST: an emulation difference is
 * possible, which is why the end-to-end report lists "not run against a real
 * Supabase project" as an unverified item.
 */
'use strict';

const http = require('http');
const { verifyJwt, mintKey } = require('./jwt');

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
const ROLES = new Set(['anon', 'authenticated', 'service_role']);

class RestError extends Error {
  constructor(status, code, message, details = null, hint = null) {
    super(message);
    this.status = status;
    this.body = { code, details, hint, message };
  }
}

const q = (id) => {
  if (!IDENT.test(id)) throw new RestError(400, 'PGRST100', `unsupported identifier "${id}"`);
  return `"${id}"`;
};

/** Split on top-level separators, ignoring those inside () or "...". */
function splitTop(str, sep = ',') {
  const out = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '"' && str[i - 1] !== '\\') quoted = !quoted;
    if (!quoted) {
      if (ch === '(' || ch === '{') depth++;
      if (ch === ')' || ch === '}') depth--;
      if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    }
    cur += ch;
  }
  if (cur !== '') out.push(cur);
  return out;
}

const unquote = (s) => (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1).replace(/\\(.)/g, '$1') : s);

/** SQLSTATE -> HTTP status, as PostgREST maps it. */
function statusForSqlstate(code, role) {
  if (!code) return 400;
  if (code === '42501') return role === 'anon' ? 401 : 403;
  if (code === '42P01' || code === '42883') return 404;
  if (code === '23503' || code === '23505') return 409;
  if (code === 'P0001') return 400;
  if (code.startsWith('08') || code.startsWith('53')) return 503;
  if (code.startsWith('09') || code.startsWith('55') || code.startsWith('57') || code.startsWith('58')) return 500;
  if (code.startsWith('0L') || code.startsWith('0P')) return 403;
  return 400;
}

function createMiniPostgrest({ db, secret, schemas = ['public', 'iam', 'system'], onRequest = null, auth = null, storage = null }) {
  const typeCache = new Map();   // "schema.table" -> Map(col -> format_type)
  const pkCache = new Map();     // "schema.table" -> [cols]
  const relCache = new Map();    // "schema.table" -> boolean

  /* ----------------------------------------------------------------- catalog */

}
