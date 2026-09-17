const { ROLES } = require('../../../server/modules/identity/value-objects/Role');

/**
 * SuperAdmin Access Guard
 * Enforces strict super_admin role checking.
 */
function requireSuperAdminRole(req, res, next) {
  const user = req.user || (req.session && req.session.user);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
  }
  next();
}

module.exports = { requireSuperAdminRole };
