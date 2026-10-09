/**
 * LOUMOO — a small Supabase Auth (GoTrue) stand-in for the local end-to-end run.
 * ---------------------------------------------------------------------------
 * The application delegates the CREDENTIAL to Supabase Auth: sign-up creates the
 * user through the admin API, OTP verification confirms it, and password sign-in
 * calls signInWithPassword. Everything after that (the session token, the profile
 * row, the account state) is LOUMOO's own code. This answers just those calls so
 * the real registration and login routes run unmodified:
 *
 *   POST   /auth/v1/admin/users            createUser
 *   GET    /auth/v1/admin/users            listUsers
 *   GET    /auth/v1/admin/users/:id        getUserById
 *   PUT    /auth/v1/admin/users/:id        updateUserById
 *   DELETE /auth/v1/admin/users/:id        deleteUser
 *   POST   /auth/v1/token?grant_type=password
 *   GET    /auth/v1/user
 *
 * Users live in auth.users inside the local Postgres, so they survive with the
 * database and can be inspected by the verification queries. Passwords are
 * stored as scrypt hashes. The admin routes require a service_role API key, as
 * the real service does.
 *
 * Not reproduced (answers 501): OAuth, magic links, MFA, refresh tokens, email
 * delivery. The application does not use them on this path.
 */
'use strict';

const crypto = require('crypto');
const { mintJwt, verifyJwt } = require('./jwt');

const AUTH_BASELINE = `
  CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aud text NOT NULL DEFAULT 'authenticated',
    role text NOT NULL DEFAULT 'authenticated',
    email text UNIQUE,
    encrypted_password text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    raw_app_meta_data jsonb NOT NULL DEFAULT '{"provider":"email","providers":["email"]}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    last_sign_in_at timestamptz,
    banned_until timestamptz
  );
`;

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${crypto.scryptSync(String(password), salt, 32).toString('hex')}`;
};

function checkPassword(password, stored) {
  const [alg, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !salt || !hash) return false;
  const got = crypto.scryptSync(String(password), Buffer.from(salt, 'hex'), 32);
  const want = Buffer.from(hash, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

function userJson(row) {
  return {
    id: row.id,
    aud: row.aud,
    role: row.role,
    email: row.email,
    phone: '',
    email_confirmed_at: row.email_confirmed_at ? new Date(row.email_confirmed_at).toISOString() : null,
    confirmed_at: row.email_confirmed_at ? new Date(row.email_confirmed_at).toISOString() : null,
    last_sign_in_at: row.last_sign_in_at ? new Date(row.last_sign_in_at).toISOString() : null,
    app_metadata: row.raw_app_meta_data,
    user_metadata: row.raw_user_meta_data,
    identities: [],
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

const authError = (status, errorCode, msg) => ({ status, body: { code: status, error_code: errorCode, msg } });

function createMiniAuth({ db, secret }) {
  const byId = async (id) => (await db.query('SELECT * FROM auth.users WHERE id::text = $1', [String(id)])).rows[0] || null;
  const byEmail = async (email) => (await db.query('SELECT * FROM auth.users WHERE lower(email) = lower($1)', [String(email)])).rows[0] || null;

  function requireServiceRole(req) {
    const auth = req.headers.authorization || '';
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    const v = verifyJwt(token, secret);
    if (!v.ok || v.payload.role !== 'service_role') return authError(403, 'not_admin', 'User not allowed');
    return null;
  }

  /**
   * @returns {Promise<{status:number, body:any}|null>} null when the path is not an auth path.
   */
  async function handle(req, url, bodyText) {
    const p = url.pathname;
    if (!p.startsWith('/auth/v1')) return null;
    const sub = p.slice('/auth/v1'.length) || '/';
    let body = {};
    if (bodyText) { try { body = JSON.parse(bodyText); } catch { return authError(400, 'bad_json', 'Could not parse request body as JSON'); } }

    if (sub === '/health') return { status: 200, body: { status: 'ok' } };

    if (sub === '/admin/users' && req.method === 'POST') {
      const denied = requireServiceRole(req); if (denied) return denied;
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return authError(422, 'validation_failed', 'To create a user, either email or phone must be provided');
      if (await byEmail(email)) return authError(422, 'email_exists', 'A user with this email address has already been registered');
      const r = await db.query(
        `INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
         VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
        [email, body.password ? hashPassword(body.password) : null, body.email_confirm ? new Date().toISOString() : null, JSON.stringify(body.user_metadata || {})]);
      return { status: 200, body: userJson(r.rows[0]) };
    }

    if (sub === '/admin/users' && req.method === 'GET') {
      const denied = requireServiceRole(req); if (denied) return denied;
      const page = Math.max(1, Number(url.searchParams.get('page') || 1));
      const per = Math.min(1000, Math.max(1, Number(url.searchParams.get('per_page') || 50)));
      const total = (await db.query('SELECT count(*)::int n FROM auth.users')).rows[0].n;
      const rows = (await db.query('SELECT * FROM auth.users ORDER BY created_at LIMIT $1 OFFSET $2', [per, (page - 1) * per])).rows;
      return { status: 200, body: { users: rows.map(userJson), aud: 'authenticated' }, headers: { 'x-total-count': String(total) } };
    }

    const m = /^\/admin\/users\/([^/]+)$/.exec(sub);
    if (m) {
      const denied = requireServiceRole(req); if (denied) return denied;
      const id = decodeURIComponent(m[1]);
      const row = await byId(id).catch(() => null);
      if (!row) return authError(404, 'user_not_found', 'User not found');
      if (req.method === 'GET') return { status: 200, body: userJson(row) };
      if (req.method === 'DELETE') {
        await db.query('DELETE FROM auth.users WHERE id::text = $1', [id]);
        return { status: 200, body: {} };
      }
      if (req.method === 'PUT') {
        const sets = []; const vals = [];
        const add = (col, v, cast = '') => { vals.push(v); sets.push(`${col} = $${vals.length}${cast}`); };
        if (body.email) add('email', String(body.email).trim().toLowerCase());
        if (body.password) add('encrypted_password', hashPassword(body.password));
        if (body.email_confirm === true) add('email_confirmed_at', new Date().toISOString());
        if (body.user_metadata) add('raw_user_meta_data', JSON.stringify({ ...row.raw_user_meta_data, ...body.user_metadata }), '::jsonb');
        if (body.ban_duration === 'none') sets.push('banned_until = NULL');
        sets.push('updated_at = now()');
        vals.push(id);
        const r = await db.query(`UPDATE auth.users SET ${sets.join(', ')} WHERE id::text = $${vals.length} RETURNING *`, vals);
        return { status: 200, body: userJson(r.rows[0]) };
      }
    }

    if (sub === '/token' && req.method === 'POST') {
      if (url.searchParams.get('grant_type') !== 'password') return authError(501, 'unsupported_grant_type', 'Only the password grant is provided by the local auth stand-in');
      const row = await byEmail(body.email || '');
      if (!row || !row.encrypted_password || !checkPassword(body.password, row.encrypted_password)) {
        return authError(400, 'invalid_credentials', 'Invalid login credentials');
      }
      if (!row.email_confirmed_at) return authError(400, 'email_not_confirmed', 'Email not confirmed');
      if (row.banned_until && new Date(row.banned_until) > new Date()) return authError(400, 'user_banned', 'User is banned');
      await db.query('UPDATE auth.users SET last_sign_in_at = now() WHERE id = $1::uuid', [row.id]);
      const now = Math.floor(Date.now() / 1000);
      const accessToken = mintJwt(secret, { iss: 'loumoo-local-e2e/auth', aud: 'authenticated', sub: row.id, email: row.email, role: 'authenticated', iat: now, exp: now + 3600 });
      return {
        status: 200,
        body: {
          access_token: accessToken, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600,
          refresh_token: crypto.randomBytes(8).toString('hex'), user: userJson((await byId(row.id))),
        },
      };
    }

    if (sub === '/user' && req.method === 'GET') {
      const auth = req.headers.authorization || '';
      const v = verifyJwt(auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '', secret);
      if (!v.ok || !v.payload.sub) return authError(401, 'bad_jwt', 'invalid JWT: unable to parse or verify signature');
      const row = await byId(v.payload.sub);
      return row ? { status: 200, body: userJson(row) } : authError(404, 'user_not_found', 'User from sub claim in JWT does not exist');
    }

    if (sub === '/logout') return { status: 204, body: null };

    return authError(501, 'not_provided', `${req.method} ${p} is not provided by the local auth stand-in`);
  }

  return { handle };
}

module.exports = { createMiniAuth, AUTH_BASELINE };
