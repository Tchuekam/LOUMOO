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
