/**
 * LOUMOO SuperAdmin — SuperAdminListingsController
 * ---------------------------------------------------------------------------
 * Handles administrative listing search, inspection, and 1-click moderation
 * (approval, flagging, suspension, status override).
 */

const SuperAdminService = require('../services/SuperAdminService');

class SuperAdminListingsController {
  static async listListings(req, res, next) {
    try {
      const status = req.query.status || null;
      const search = req.query.search || null;
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;

      const listings = await SuperAdminService.listListings({ status, search, limit, offset });
      res.json({
        success: true,
        data: {
          listings,
          count: listings.length,
          limit,
          offset
        }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getListing(req, res, next) {
    try {
      const { id } = req.params;
      const listing = await SuperAdminService.getListingDetail(id);
      res.json({
        success: true,
        data: { listing }
      });
    } catch (err) {
      next(err);
    }
  }

  static async moderateListing(req, res, next) {
    try {
      const { id } = req.params;
      const actionOrPayload = req.body;
      const adminId = (req.principal && req.principal.id) || 'super_admin';
      const ipAddress = req.ip || req.connection.remoteAddress;

      const listing = await SuperAdminService.moderateListing(id, actionOrPayload, {
        adminId,
        reason: req.body.reason || null,
        ipAddress
      });

      res.json({
        success: true,
        message: `Listing ${id} successfully moderated.`,
        data: { listing }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = SuperAdminListingsController;
