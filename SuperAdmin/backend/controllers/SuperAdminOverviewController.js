/**
 * LOUMOO SuperAdmin — SuperAdminOverviewController
 * ---------------------------------------------------------------------------
 * Handles HTTP requests for high-level system analytics and audit trail events.
 */

const SuperAdminService = require('../services/SuperAdminService');

class SuperAdminOverviewController {
  static async getOverview(req, res, next) {
    try {
      const overview = await SuperAdminService.getOverviewMetrics();
      res.json({
        success: true,
        data: overview
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const resourceType = req.query.resourceType || null;

      const logs = await SuperAdminService.getAuditLogs({ limit, offset, resourceType });
      res.json({
        success: true,
        data: {
          logs,
          count: logs.length,
          limit,
          offset
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuperAdminOverviewController;
