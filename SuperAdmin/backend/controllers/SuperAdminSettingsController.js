/**
 * LOUMOO SuperAdmin — SuperAdminSettingsController
 * ---------------------------------------------------------------------------
 * Handles HTTP requests for reading and updating dynamic system settings.
 */

const SuperAdminService = require('../services/SuperAdminService');

class SuperAdminSettingsController {
  static async getAll(req, res, next) {
    try {
      const settings = await SuperAdminService.getSystemSettings();
      res.json({
        success: true,
        data: {
          settings,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getByKey(req, res, next) {
    try {
      const { key } = req.params;
      const value = await SuperAdminService.getSystemSetting(key);
      if (value === null || value === undefined) {
        return res.status(404).json({
          success: false,
          error: { code: 'SETTING_NOT_FOUND', message: `Setting [${key}] was not found.` }
        });
      }
      res.json({
        success: true,
        data: { key, value }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateByKey(req, res, next) {
    try {
      const { key } = req.params;
      const { value, reason } = req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await SuperAdminService.updateSystemSetting(key, value, {
        adminId,
        reason,
        ipAddress
      });

      res.json({
        success: true,
        message: `System setting [${key}] successfully updated.`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const payload = req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const result = await SuperAdminService.updateSystemSettings(payload, {
        adminId,
        reason: req.body.reason || null,
        ipAddress
      });

      res.json({
        success: true,
        message: 'System settings successfully updated.',
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuperAdminSettingsController;
