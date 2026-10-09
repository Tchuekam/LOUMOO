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

  async function relationExists(tx, schema, table) {
    const key = `${schema}.${table}`;
    if (relCache.get(key)) return true;
    const r = await tx.query(
      `SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind IN ('r','v','m','p')`, [schema, table]);
    const ok = r.rows.length > 0;
    if (ok) relCache.set(key, true);
    return ok;
  }

  async function columnTypes(tx, schema, table) {
    const key = `${schema}.${table}`;
    if (typeCache.has(key)) return typeCache.get(key);
    const r = await tx.query(
      `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type
         FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relname = $2 AND a.attnum > 0 AND NOT a.attisdropped`, [schema, table]);
    const map = new Map(r.rows.map((x) => [x.name, x.type]));
    typeCache.set(key, map);
    return map;
  }

  async function primaryKey(tx, schema, table) {
    const key = `${schema}.${table}`;
    if (pkCache.has(key)) return pkCache.get(key);
    const r = await tx.query(
      `SELECT a.attname AS name
         FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
        WHERE i.indisprimary AND n.nspname = $1 AND c.relname = $2`, [schema, table]);
    const cols = r.rows.map((x) => x.name);
    pkCache.set(key, cols);
    return cols;
  }

  /* ----------------------------------------------------------------- parsing */

  /* Foreign keys of one schema, for resource embedding. */
  const fkCache = new Map();
  async function foreignKeys(tx, schema) {
    if (fkCache.has(schema)) return fkCache.get(schema);
    const r = await tx.query(
      `SELECT c.conname AS name, cl.relname AS from_table, cf.relname AS to_table,
              (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(c.conkey) WITH ORDINALITY k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum) AS from_cols,
              (SELECT array_agg(a.attname ORDER BY k.ord) FROM unnest(c.confkey) WITH ORDINALITY k(attnum, ord)
                 JOIN pg_attribute a ON a.attrelid = c.confrelid AND a.attnum = k.attnum) AS to_cols
         FROM pg_constraint c
         JOIN pg_class cl ON cl.oid = c.conrelid JOIN pg_namespace n ON n.oid = cl.relnamespace
         JOIN pg_class cf ON cf.oid = c.confrelid JOIN pg_namespace nf ON nf.oid = cf.relnamespace
        WHERE c.contype = 'f' AND n.nspname = $1 AND nf.nspname = $1`, [schema]);
    fkCache.set(schema, r.rows);
    return r.rows;
  }

  const EMBED = /^(?:([A-Za-z_][A-Za-z0-9_]*):)?([A-Za-z_][A-Za-z0-9_]*)((?:![A-Za-z_][A-Za-z0-9_]*)*)\((.*)\)$/s;

  /**
   * Builds the SELECT list for `table` (aliased `alias`) from a PostgREST `select=` string.
   * Embedded resources become correlated sub-selects: a many-to-one embed is an object (or
   * null), a one-to-many embed is an array, `!inner` also requires the related row to exist.
   * Returns { list, inner } where `inner` are extra WHERE conditions for the parent.
   */
  async function buildSelect(tx, schema, table, selectStr, alias = '_t', depth = 0, ctx = null) {
    const types = await columnTypes(tx, schema, table);
    if (!selectStr || selectStr === '*') return { list: `${alias}.*`, inner: [] };
    const out = [];
    const inner = [];
    for (const raw of splitTop(selectStr)) {
      const item = raw.trim();
      if (item === '*') { out.push(`${alias}.*`); continue; }

      if (item.includes('(')) {
        const em = EMBED.exec(item);
        if (!em) throw new RestError(400, 'PGRST100', `unsupported select item "${item}"`);
        const [, as, rel, hintsRaw, sub] = em;
        const hints = hintsRaw.split('!').filter(Boolean);
        const isInner = hints.includes('inner');
        const hint = hints.find((h) => h !== 'inner' && h !== 'left');
        const fks = await foreignKeys(tx, schema);
        const m2o = fks.filter((f) => f.from_table === table && f.to_table === rel
          && (!hint || f.name === hint || f.from_cols.includes(hint)));
        const o2m = fks.filter((f) => f.to_table === table && f.from_table === rel
          && (!hint || f.name === hint || f.from_cols.includes(hint)));
        const cands = [...m2o.map((f) => ({ f, many: false })), ...o2m.map((f) => ({ f, many: true }))];
        if (cands.length === 0) {
          throw new RestError(400, 'PGRST200', `Could not find a relationship between '${table}' and '${rel}' in the schema cache`);
        }
        if (cands.length > 1) {
          throw new RestError(300, 'PGRST201', `Could not embed because more than one relationship was found for '${table}' and '${rel}'`);
        }
        const { f, many } = cands[0];
        const ca = `_c${depth + 1}`;
        const join = (many ? f.from_cols : f.to_cols)
          .map((col, i) => `${ca}.${q(col)} = ${alias}.${q((many ? f.to_cols : f.from_cols)[i])}`).join(' AND ');
        const child = await buildSelect(tx, schema, rel, sub, ca, depth + 1);
        const fq = `${q(schema)}.${q(rel)}`;
        // Filters addressed to this embed (`stores.status=eq.ACTIVE`) narrow the embedded rows and,
        // with !inner, decide whether the parent row is kept at all.
        const wanted = depth === 0 && ctx && ctx.embedFilters ? ctx.embedFilters.get(as || rel) : null;
        let extra = [];
        if (wanted && wanted.length) {
          const childTypes = await columnTypes(tx, schema, rel);
          extra = wanted.map((f) => condition(ctx.p, childTypes, f.col, f.rawOp, f.negate, ca));
          ctx.used.add(as || rel);
        }
        const where = [join, ...child.inner, ...extra].join(' AND ');
        const e = `_e${depth + 1}`;
        const body = many
          ? `(SELECT coalesce(json_agg(${e}), '[]'::json) FROM (SELECT ${child.list} FROM ${fq} AS ${ca} WHERE ${where}) ${e})`
          : `(SELECT to_json(${e}) FROM (SELECT ${child.list} FROM ${fq} AS ${ca} WHERE ${where}) ${e})`;
        out.push(`${body} AS ${q(as || rel)}`);
        if (isInner) inner.push(`EXISTS (SELECT 1 FROM ${fq} AS ${ca} WHERE ${where})`);
        continue;
      }

      let asName = null;
      let expr = item;
      const aliasMatch = /^([A-Za-z_][A-Za-z0-9_]*):(?!:)(.+)$/.exec(item);
      if (aliasMatch) { asName = aliasMatch[1]; expr = aliasMatch[2]; }
      let cast = null;
      const castIdx = expr.lastIndexOf('::');
      if (castIdx > 0) { cast = expr.slice(castIdx + 2); expr = expr.slice(0, castIdx); }
      const m = /^([A-Za-z_][A-Za-z0-9_]*)((?:->>?[A-Za-z0-9_]+)*)$/.exec(expr);
      if (!m) throw new RestError(400, 'PGRST100', `unsupported select item "${item}"`);
      const col = m[1];
      if (!types.has(col)) throw new RestError(400, '42703', `column ${table}.${col} does not exist`);
      let sql = `${alias}.${q(col)}`;
      let name = col;
      for (const seg of m[2].match(/->>?[A-Za-z0-9_]+/g) || []) {
        const op = seg.startsWith('->>') ? '->>' : '->';
        const key = seg.slice(op.length);
        sql += `${op}'${key}'`;
        name = key;
      }
      if (cast) {
        if (!IDENT.test(cast)) throw new RestError(400, 'PGRST100', `unsupported cast "${cast}"`);
        sql = `(${sql})::${cast}`;
      }
      out.push(`${sql} AS ${q(asName || name)}`);
    }
    return { list: out.join(', '), inner };
  }

}
