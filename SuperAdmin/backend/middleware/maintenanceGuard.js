/**
 * LOUMOO — maintenanceGuard
 * ---------------------------------------------------------------------------
 * Intercepts incoming requests when platform maintenance mode is enabled.
 * Rejects non-administrative operations with HTTP 503 Service Unavailable,
 * while ensuring health checks, public config, and admin management endpoints
 * remain responsive.
 *
 * Administrative bypass: this guard is mounted at app level, before any auth
 * runs, so it can only honour a `req.principal` an upstream layer has already
 * resolved to an administrator. It never inspects a bearer token or header
 * itself. Admin routes (BYPASS_PREFIXES) stay reachable regardless, so an
 * administrator can always turn maintenance off.
 *
 * Earlier revisions also let a request through when NODE_ENV was anything but
 * 'production' and it carried the bearer token 'admin_token' / 'user_admin', any
 * token merely CONTAINING 'super_admin', or the header
 * `x-admin-key: loumoo_dev_admin` — i.e. on staging, on development, and on any
 * deployment where NODE_ENV was unset or misspelled.
 */

const SuperAdminRepository = require('../repositories/SuperAdminRepository');
const CacheService = require('../../../server/infrastructure/cache/CacheService');
const { Role, ROLES } = require('../../../server/modules/identity/value-objects/Role');

// Endpoints that MUST bypass maintenance to allow diagnostics and administration
const BYPASS_PREFIXES = [
  '/api/v1/health',
  '/health',
  '/healthz',
  '/api/config',
  '/api/v1/config',
  '/api/v1/admin',
  '/api/admin',
  '/superadmin'
];

async function maintenanceGuard(req, res, next) {
  const path = req.path || req.originalUrl || '';

  // 1. Unconditionally allow management, diagnostic, and public config bootstrap routes
  if (BYPASS_PREFIXES.some(prefix => path === prefix || path.startsWith(prefix + '/') || path.startsWith(prefix + '?'))) {
    return next();
  }

  // 2. Allow static website assets (CSS, JS, fonts, images) on GET requests
  if (req.method === 'GET' && !path.startsWith('/api/')) {
    return next();
  }

  // 3. Inspect maintenance mode status (cached with 30s TTL).
  //
  // This runs on every non-bypassed /api request. The underlying setting read
  // goes through the Supabase admin client, whose resilient fetch can retry a
  // slow GET for tens of seconds. We must NEVER let that block request
  // admission: bound the lookup with a short deadline and fail OPEN (serve
  // traffic) if it is not answered in time. The lookup keeps running in the
  // background and populates the 30s cache for subsequent requests.
  let maintenance = null;
  try {
    const lookup = (CacheService && typeof CacheService.remember === 'function')
      ? CacheService.remember('system_setting:maintenance_mode', 30,
          () => SuperAdminRepository.getSetting('maintenance_mode'), 'admin')
      : SuperAdminRepository.getSetting('maintenance_mode');
    // A background rejection (after we stop awaiting) must not become an
    // unhandledRejection.
    if (lookup && typeof lookup.catch === 'function') lookup.catch(() => {});
    maintenance = await Promise.race([
      lookup,
      new Promise(resolve => setTimeout(() => resolve(null), 500))
    ]);
  } catch (_) {
    // Fail open on unexpected store lookup error to prevent unintended system lockouts
    return next();
  }

  if (!maintenance || !maintenance.enabled) {
    return next();
  }

  // 4. Verify administrative bypass if permitted by policy.
  //
  // Only a principal that an upstream layer has already authenticated counts.
  // Nothing in the request itself (a bearer string, an x-admin-key header) is
  // trusted here, in any NODE_ENV.
  if (maintenance.allow_admin_bypass !== false) {
    if (req.principal) {
      const role = req.principal.primaryRole || req.principal.role || 'customer';
      if (Role.hasRole(role, ROLES.ADMIN)) {
        return next();
      }
    }
  }

  // 5. Enforce 503 Service Unavailable for regular traffic
  const message = maintenance.banner_text || 'LOUMOO platform is temporarily under maintenance. Please try again shortly.';
  return res.status(503).json({
    error: {
      code: 'MAINTENANCE_MODE',
      message,
      statusCode: 503
    }
  });
}

module.exports = {
  maintenanceGuard
};
