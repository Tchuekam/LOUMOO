/**
 * LOUMOO SuperAdmin — SuperAdminUsersController
 * ---------------------------------------------------------------------------
 * Handles user directory search, profile inspection, role elevation (RBAC),
 * and KYC verification status overrides.
 */

const SuperAdminService = require('../services/SuperAdminService');

class SuperAdminUsersController {
  static async listUsers(req, res, next) {
    try {
      const role = req.query.role || null;
      const kyc = req.query.kyc || req.query.kyc_status || null;
      const search = req.query.search || null;
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;

      const users = await SuperAdminService.listUsers({ role, kyc, search, limit, offset });
      res.json({
        success: true,
        data: {
          users,
          count: users.length,
          limit,
          offset
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await SuperAdminService.getUserDetail(id);
      res.json({
        success: true,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await SuperAdminService.updateUser(id, updates, {
        adminId,
        reason: req.body.reason || null,
        ipAddress
      });

      res.json({
        success: true,
        message: `User ${id} successfully updated.`,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const role = req.body.role || req.body.primary_role || req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await SuperAdminService.updateUserRole(id, role, {
        adminId,
        reason: req.body.reason || null,
        ipAddress
      });

      res.json({
        success: true,
        message: `User ${id} role updated to ${user.primary_role}.`,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserKyc(req, res, next) {
    try {
      const { id } = req.params;
      const status = req.body.status || req.body.kyc_status || req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const user = await SuperAdminService.updateUserKyc(id, status, {
        adminId,
        reason: req.body.reason || null,
        ipAddress
      });

      res.json({
        success: true,
        message: `User ${id} KYC status updated to ${user.kyc_status}.`,
        data: { user }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuperAdminUsersController;
