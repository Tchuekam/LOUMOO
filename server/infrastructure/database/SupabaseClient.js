/**
 * Supabase Infrastructure Client
 * ---------------------------------------------------------------------------
 * THE single canonical way to obtain Supabase clients in the LOUMOO server.
 *
 *   const { SupabaseClient } = require('../infrastructure/database/SupabaseClient');
 *   const adminDb = SupabaseClient.getAdmin();      // throws if misconfigured
 *   const publicDb = SupabaseClient.getPublic();    // throws if misconfigured
 *
 * Database schema policy:
 *   - All application tables live in the `iam` schema (profiles, stores,
 *     listings, orders, addresses, ...). `db.schema = 'iam'` is the client
 *     default so bare `from('profiles')` resolves to `iam.profiles`.
 *   - Cross-cutting/system tables live in `system` (outbox_events,
 *     webhook_events, privacy_preferences, account_security_events, ...).
 *     Use `.schema('system')` explicitly at those call sites.
 *   - PostgREST on the host project must expose { public, iam, system }.
 *
 * Failure policy (see handleDatabaseFailure):
 *   - production: a failed database operation throws InfrastructureError.
 *     NO silent in-memory fallback, ever.
 *   - development/test: the failing operation is logged at ERROR level with
 *     full context, and callers MAY continue with in-memory fallbacks so the
 *     prototype stays demo-able without credentials.
 */

const { createClient } = require('@supabase/supabase-js');
const { config } = require('../../config/env');
const logger = require('../../shared/logging/logger');
const { InfrastructureError } = require('../../shared/errors/AppError');

let adminClient = null;
let publicClient = null;

const https = require('https');
const http = require('http');

const httpsAgent = new https.Agent({
  autoSelectFamily: false,
  keepAlive: true,
  keepAliveMsecs: 15000,
  timeout: 45000
});

const httpAgent = new http.Agent({
  autoSelectFamily: false,
  keepAlive: true,
  keepAliveMsecs: 15000,
  timeout: 45000
});

function nativeFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const mod = parsed.protocol === 'http:' ? http : https;
    const agent = parsed.protocol === 'http:' ? httpAgent : httpsAgent;

    const headers = {};
    if (options.headers) {
      if (typeof options.headers.forEach === 'function') {
        options.headers.forEach((v, k) => { headers[k] = v; });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    const req = mod.request(parsed, {
      method: options.method || 'GET',
      headers,
      agent,
      timeout: 45000
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const resHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (Array.isArray(v)) {
            v.forEach(val => resHeaders.append(k, val));
          } else if (v !== undefined) {
            resHeaders.set(k, v);
          }
        }
        const body = (res.statusCode === 204 || res.statusCode === 304) ? null : buf;
        resolve(new Response(body, {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: resHeaders
        }));
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request to ${parsed.host} timed out after 45000ms`));
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function resilientNativeFetch(url, options = {}) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await nativeFetch(url, options);
    } catch (err) {
      const isTransient = err.message && (
        err.message.includes('timed out') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ETIMEDOUT') ||
        err.message.includes('socket hang up')
      );
      if (attempt === maxAttempts || !isTransient) {
        throw err;
      }
      logger.warn(`[SupabaseClient] Retrying HTTP request (${attempt}/${maxAttempts}) due to: ${err.message}`);
      await new Promise(r => setTimeout(r, attempt * 500));
    }
  }
}

const CLIENT_OPTIONS = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  // Canonical default schema: all application domain tables are in `iam`.
  db: {
    schema: 'iam'
  },
  global: {
    fetch: resilientNativeFetch
  }
};

if (config.supabase.url && config.supabase.serviceRoleKey) {
  try {
    adminClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, CLIENT_OPTIONS);
    logger.info('[Supabase] Initialized Supabase Admin (Service Role) client. Default schema: iam');
  } catch (err) {
    logger.error('[Supabase] Failed initializing Admin client', err);
  }
} else {
  logger.warn('[Supabase] Admin client NOT initialized — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing.');
}

if (config.supabase.url && config.supabase.anonKey) {
  try {
    publicClient = createClient(config.supabase.url, config.supabase.anonKey, CLIENT_OPTIONS);
    logger.info('[Supabase] Initialized Supabase Public (anon) client. Default schema: iam');
  } catch (err) {
    logger.error('[Supabase] Failed initializing Public client', err);
  }
} else {
  logger.warn('[Supabase] Public client NOT initialized — SUPABASE_URL / SUPABASE_ANON_KEY missing.');
}

class SupabaseDatabase {
  /**
   * Canonical admin accessor. Throws InfrastructureError when the admin
   * client is not configured — callers must handle it, never silently ignore.
   */
  static getAdmin() {
    if (!adminClient) {
      throw new InfrastructureError('Supabase', 'Admin client is not initialized (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }
    return adminClient;
  }

  static getPublic() {
    if (!publicClient) {
      throw new InfrastructureError('Supabase', 'Public client is not initialized (missing SUPABASE_URL or SUPABASE_ANON_KEY)');
    }
    return publicClient;
  }

  /**
   * Healthcheck helper
   */
  static async checkHealth() {
    try {
      const startTime = Date.now();
      const res = await fetch(`${config.supabase.url}/auth/v1/health`, {
        headers: {
          apikey: config.supabase.anonKey,
          Authorization: `Bearer ${config.supabase.anonKey}`
        },
        signal: AbortSignal.timeout(5000)
      });
      return {
        healthy: res.ok,
        status: res.status,
        latencyMs: Date.now() - startTime
      };
    } catch (e) {
      return {
        healthy: false,
        error: e.message
      };
    }
  }
}

/**
 * Central database-failure policy. Every caught Supabase query error in the
 * codebase must route through this function so behaviour is uniform:
 *   - production : log ERROR  ->  throw InfrastructureError (no fallback)
 *   - dev/test   : log ERROR with context (loud, not silent) -> return false
 *                  so the caller may continue with its in-memory fallback.
 */
function handleDatabaseFailure(err, context = 'database operation') {
  const detail = (err && (err.code || err.details || err.message)) || String(err);
  logger.error(`[DB-FAILURE] ${context} failed. code=${err && err.code ? err.code : 'N/A'} detail=${detail}`);
  if (config.isProduction) {
    throw new InfrastructureError('Supabase', context, err);
  }
  logger.warn(`[DB-FAILURE] DEV MODE: continuing with in-memory fallback for "${context}". Set NODE_ENV=production to enforce real persistence.`);
  return false;
}

/**
 * Failure-policy-aware accessor for call sites that cannot let an error
 * escape (e.g. write paths with their own guards):
 *   - production : apply handleDatabaseFailure (which THROWS InfrastructureError)
 *   - dev/test   : log the failure loudly and return null so the caller's
 *                  existing `if (adminDb)` guard degrades gracefully.
 * NEVER silently ignores a missing/misconfigured admin client.
 */
function tryGetAdmin(context = 'database operation') {
  try {
    return SupabaseDatabase.getAdmin();
  } catch (err) {
    handleDatabaseFailure(err, context);
    return null;
  }
}

module.exports = {
  adminClient,
  publicClient,
  SupabaseDatabase,
  tryGetAdmin,
  getAdminClient: () => adminClient,
  getPublicClient: () => publicClient,
  handleDatabaseFailure,
  SupabaseClient: {
    getAdmin: SupabaseDatabase.getAdmin,
    getPublic: SupabaseDatabase.getPublic,
    getAdminClient: () => adminClient,
    getPublicClient: () => publicClient,
    checkHealth: SupabaseDatabase.checkHealth
  }
};
