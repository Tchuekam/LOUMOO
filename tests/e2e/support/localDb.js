/**
 * LOUMOO — a local Postgres for the end-to-end run.
 * ---------------------------------------------------------------------------
 * PGlite (a WASM build of Postgres, a devDependency of this repo) with the
 * pieces a Supabase project provides before any of our SQL runs: the three API
 * roles, the `auth` helper functions the policies call, an `extensions` schema,
 * and the default privileges Supabase gives API roles on application schemas.
 * Then the REAL migration files, in the order scripts/apply_migration.js uses.
 *
 * Nothing about the application schema is stubbed or hand-written here.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { AUTH_BASELINE } = require('./miniAuth');

const MIGRATIONS = path.resolve(__dirname, '../../../server/infrastructure/database/migrations');

function loadPglite() {
  try {
    return {
      PGlite: require('@electric-sql/pglite').PGlite,
      extensions: {
        pg_trgm: require('@electric-sql/pglite/contrib/pg_trgm').pg_trgm,
        uuid_ossp: require('@electric-sql/pglite/contrib/uuid_ossp').uuid_ossp,
        pgcrypto: require('@electric-sql/pglite/contrib/pgcrypto').pgcrypto,
      },
    };
  } catch (e) {
    return null;
  }
}

/** What a Supabase project has in place before the first migration. */
const SUPABASE_BASELINE = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;

  CREATE SCHEMA IF NOT EXISTS extensions;
  CREATE SCHEMA IF NOT EXISTS auth;
  -- No end-user JWT ever reaches the database in this application (the server
  -- uses the service-role key), so uid() is NULL; role() mirrors PostgREST's
  -- SET ROLE so a policy written against auth.role() sees the caller's role.
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS 'SELECT current_user::text';

  -- The application schemas, created before the migrations so the same default
  -- privileges Supabase applies to objects the migration role creates are in
  -- force: API roles can reach every table and row-level security alone decides
  -- what an anonymous caller may read.
  CREATE SCHEMA IF NOT EXISTS iam;
  CREATE SCHEMA IF NOT EXISTS system;
  GRANT USAGE ON SCHEMA public, iam, system, extensions TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public, iam, system GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public, iam, system GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public, iam, system GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
`;
