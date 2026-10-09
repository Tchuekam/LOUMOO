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
