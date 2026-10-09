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

}
}
