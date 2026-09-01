/**
 * LOUMOO Commercial Distribution Engine — Distribution & Feed Delivery Service
 */

'use strict';

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const { Announcement, ANNOUNCEMENT_STATUSES } = require('../domain/Announcement');
const logger = require('../../../shared/logging/logger');

class AnnouncementDistributionService {
  static async getDistributionFeed(viewerPrincipal = null, options = {}) {
    const adminDb = SupabaseClient.getAdmin();

    const limit = Math.min(parseInt(options.limit, 10) || 20, 50);
    const offset = parseInt(options.offset, 10) || 0;
    const type = options.type ? options.type.toUpperCase() : null;
    const city = options.city ? options.city.trim() : null;
    const search = options.search ? options.search.trim().toLowerCase() : null;

    let query = adminDb
      .from('announcements')
      .select(`
        *,
        store:stores(id, name, slug, logo_url, is_verified, rating, rating_count, verification_tier),
        author:profiles(id, first_name, last_name, avatar_url, city),
        target:announcement_targets(*),
        metrics:announcement_metrics(*)
      `, { count: 'exact' })
      .eq('status', ANNOUNCEMENT_STATUSES.PUBLISHED)
      .is('deleted_at', null)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && type !== 'ALL') {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.ilike('title', "%" + search + "%");
    }

    const { data: rows, count, error } = await query;
    if (error) {
      logger.error('[AnnouncementDistributionService] Query error', error);
      throw error;
    }

    let filtered = rows || [];
    if (city && city !== 'All') {
      filtered = filtered.filter(item => {
        const targetCities = item.target?.target_cities || [];
        if (targetCities.length > 0) {
          return targetCities.includes(city);
        }
        return item.author?.city === city;
      });
    }

    const announcements = filtered.map(row => new Announcement(row).toPublicJSON());

    return {
      total: count || announcements.length,
      limit,
      offset,
      announcements
    };
  }
}

module.exports = AnnouncementDistributionService;
