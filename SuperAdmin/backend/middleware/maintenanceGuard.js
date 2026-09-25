/**
 * LOUMOO — maintenanceGuard
 * ---------------------------------------------------------------------------
 * Intercepts incoming requests when platform maintenance mode is enabled.
 * Rejects non-administrative operations with HTTP 503 Service Unavailable,
 * while ensuring health checks, public config, and admin management endpoints
 * remain responsive.
 */

const SuperAdminRepository = require('../repositories/SuperAdminRepository');
const CacheService = require('../../../server/infrastructure/cache/CacheService');
const { Role, ROLES } = require('../../../server/modules/identity/value-objects/Role');
const { extractBearerToken } = require('../../../server/modules/identity/presentation/guards/authGuard');

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

  // 3. Inspect maintenance mode status (cached with 30s TTL)
  let maintenance = null;
  try {
    if (CacheService && typeof CacheService.remember === 'function') {
      maintenance = await CacheService.remember('system_setting:maintenance_mode', 30, () => {
        return SuperAdminRepository.getSetting('maintenance_mode');
      }, 'admin');
    } else {
      maintenance = await SuperAdminRepository.getSetting('maintenance_mode');
    }
  } catch (_) {
    // Fail open on unexpected store lookup error to prevent unintended system lockouts
    return next();
  }

  if (!maintenance || !maintenance.enabled) {
    return next();
  }

  // 4. Verify administrative bypass if permitted by policy
  if (maintenance.allow_admin_bypass !== false) {
    if (req.principal) {
      const role = req.principal.primaryRole || req.principal.role || 'customer';
      if (Role.hasRole(role, ROLES.ADMIN)) {
        return next();
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      const token = extractBearerToken(req);
      if (token && (token === 'admin_token' || token === 'user_admin' || token.includes('super_admin'))) {
        return next();
      }
      if (req.headers['x-admin-key'] === 'loumoo_dev_admin') {
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
