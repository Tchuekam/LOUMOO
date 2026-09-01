/**
 * LOUMOO Commercial Distribution Engine — Analytics & Performance Service
 */

'use strict';

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const CacheService = require('../../../infrastructure/cache/CacheService');
const { NotFoundError, AuthorizationError, ValidationError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const EVENT_TYPES = Object.freeze([
  'IMPRESSION',
  'VIEW',
  'CLICK',
  'CTA_CLICK',
  'SHARE',
  'CONVERSION'
]);

class AnnouncementAnalyticsService {
  static async recordEvent(announcementId, eventType, viewerPrincipal = null, metadata = {}, reqMeta = {}) {
    const normalizedType = String(eventType || '').toUpperCase();
    if (!EVENT_TYPES.includes(normalizedType)) {
      throw new ValidationError("Invalid event type '" + eventType + "'. Allowed: " + EVENT_TYPES.join(', '));
    }

    const adminDb = SupabaseClient.getAdmin();

    const viewerKey = viewerPrincipal ? ("u_" + viewerPrincipal.id) : ("ip_" + (reqMeta.ip || 'anon'));
    const dedupKey = "ann_event:" + announcementId + ":" + normalizedType + ":" + viewerKey;
    const seen = await CacheService.get(dedupKey);

    if (seen && (normalizedType === 'IMPRESSION' || normalizedType === 'VIEW')) {
      return { recorded: false, reason: 'deduplicated' };
    }

    await CacheService.set(dedupKey, '1', 900);

    await adminDb.from('announcement_events').insert({
      announcement_id: announcementId,
      user_id: viewerPrincipal ? viewerPrincipal.id : null,
      event_type: normalizedType,
      user_agent: reqMeta.userAgent || null,
      metadata: metadata || {}
    });

    const { data: metrics } = await adminDb
      .from('announcement_metrics')
      .select('*')
      .eq('announcement_id', announcementId)
      .maybeSingle();

    if (metrics) {
      const updates = { updated_at: new Date().toISOString() };
      if (normalizedType === 'IMPRESSION') updates.impressions = (metrics.impressions || 0) + 1;
      if (normalizedType === 'VIEW') {
        updates.views = (metrics.views || 0) + 1;
        if (!seen) updates.unique_viewers = (metrics.unique_viewers || 0) + 1;
      }
      if (normalizedType === 'CLICK') updates.clicks = (metrics.clicks || 0) + 1;
      if (normalizedType === 'CTA_CLICK') updates.cta_clicks = (metrics.cta_clicks || 0) + 1;
      if (normalizedType === 'SHARE') updates.shares = (metrics.shares || 0) + 1;
      if (normalizedType === 'CONVERSION') updates.conversions = (metrics.conversions || 0) + 1;

      await adminDb
        .from('announcement_metrics')
        .update(updates)
        .eq('announcement_id', announcementId);
    }

    return { recorded: true, eventType: normalizedType };
  }

  static async getAnnouncementAnalytics(principal, announcementId) {
    const adminDb = SupabaseClient.getAdmin();

    const { data: announcement, error } = await adminDb
      .from('announcements')
      .select('id, author_id, store_id, title, status, published_at, type')
      .eq('id', announcementId)
      .maybeSingle();

    if (error || !announcement) throw new NotFoundError('Announcement', announcementId);

    if (announcement.author_id !== principal.id) {
      if (announcement.store_id) {
        const { data: store } = await adminDb
          .from('stores')
          .select('owner_id')
          .eq('id', announcement.store_id)
          .maybeSingle();
        if (!store || store.owner_id !== principal.id) {
          throw new AuthorizationError('You do not have permission to view analytics for this announcement.');
        }
      } else {
        throw new AuthorizationError('You do not have permission to view analytics for this announcement.');
      }
    }

    const { data: metrics } = await adminDb
      .from('announcement_metrics')
      .select('*')
      .eq('announcement_id', announcementId)
      .maybeSingle();

    const m = metrics || {
      impressions: 0,
      views: 0,
      unique_viewers: 0,
      clicks: 0,
      cta_clicks: 0,
      shares: 0,
      conversions: 0
    };

    const views = m.views || 0;
    const clicks = m.clicks || 0;
    const ctaClicks = m.cta_clicks || 0;
    const impressions = m.impressions || 0;

    const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;
    const ctaConversionRate = clicks > 0 ? Number(((ctaClicks / clicks) * 100).toFixed(2)) : 0;

    return {
      announcementId: announcement.id,
      title: announcement.title,
      type: announcement.type,
      status: announcement.status,
      publishedAt: announcement.published_at,
      metrics: {
        impressions,
        views,
        uniqueViewers: m.unique_viewers || 0,
        clicks,
        ctaClicks,
        shares: m.shares || 0,
        conversions: m.conversions || 0,
        ctrPercent: ctr,
        ctaConversionPercent: ctaConversionRate
      }
    };
  }

  static async getStoreCampaignsOverview(principal, storeId) {
    const adminDb = SupabaseClient.getAdmin();

    const { data: store, error: storeErr } = await adminDb
      .from('stores')
      .select('id, owner_id, organization_id, name')
      .eq('id', storeId)
      .maybeSingle();

    if (storeErr || !store) throw new NotFoundError('Store', storeId);

    if (store.owner_id !== principal.id) {
      if (store.organization_id) {
        const { data: membership } = await adminDb
          .from('organization_members')
          .select('id, status, role')
          .eq('organization_id', store.organization_id)
          .eq('user_id', principal.id)
          .eq('status', 'ACTIVE')
          .maybeSingle();

        if (!membership) {
          throw new AuthorizationError('You do not have permission to view campaign analytics for this store.');
        }
      } else {
        throw new AuthorizationError('You do not have permission to view campaign analytics for this store.');
      }
    }

    const { data: announcements, error: annErr } = await adminDb
      .from('announcements')
      .select('id, title, slug, type, status, published_at, scheduled_for, expires_at, created_at')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (annErr) throw annErr;

    const list = announcements || [];
    const annIds = list.map(a => a.id);

    let metricsMap = {};
    if (annIds.length > 0) {
      const { data: metricsList } = await adminDb
        .from('announcement_metrics')
        .select('*')
        .in('announcement_id', annIds);

      (metricsList || []).forEach(m => {
        metricsMap[m.announcement_id] = m;
      });
    }

    let totalImpressions = 0;
    let totalViews = 0;
    let totalUniqueViewers = 0;
    let totalClicks = 0;
    let totalCtaClicks = 0;
    let totalConversions = 0;

    const campaigns = list.map(a => {
      const m = metricsMap[a.id] || {
        impressions: 0,
        views: 0,
        unique_viewers: 0,
        clicks: 0,
        cta_clicks: 0,
        shares: 0,
        conversions: 0
      };

      totalImpressions += (m.impressions || 0);
      totalViews += (m.views || 0);
      totalUniqueViewers += (m.unique_viewers || 0);
      totalClicks += (m.clicks || 0);
      totalCtaClicks += (m.cta_clicks || 0);
      totalConversions += (m.conversions || 0);

      const views = m.views || 0;
      const clicks = m.clicks || 0;
      const ctr = views > 0 ? Number(((clicks / views) * 100).toFixed(2)) : 0;

      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        type: a.type,
        status: a.status,
        publishedAt: a.published_at,
        scheduledFor: a.scheduled_for,
        expiresAt: a.expires_at,
        createdAt: a.created_at,
        metrics: {
          impressions: m.impressions || 0,
          views: m.views || 0,
          uniqueViewers: m.unique_viewers || 0,
          clicks: m.clicks || 0,
          ctaClicks: m.cta_clicks || 0,
          shares: m.shares || 0,
          conversions: m.conversions || 0,
          ctrPercent: ctr
        }
      };
    });

    const overallCtr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;
    const overallCtaConversion = totalClicks > 0 ? Number(((totalCtaClicks / totalClicks) * 100).toFixed(2)) : 0;

    return {
      storeId: store.id,
      storeName: store.name,
      summary: {
        totalCampaigns: list.length,
        activeCampaigns: list.filter(a => a.status === 'PUBLISHED').length,
        scheduledCampaigns: list.filter(a => a.status === 'SCHEDULED').length,
        completedCampaigns: list.filter(a => a.status === 'EXPIRED' || a.status === 'ARCHIVED').length,
        draftCampaigns: list.filter(a => a.status === 'DRAFT').length,
        totalImpressions,
        totalViews,
        totalUniqueViewers,
        totalClicks,
        totalCtaClicks,
        totalConversions,
        overallCtrPercent: overallCtr,
        overallCtaConversionPercent: overallCtaConversion
      },
      campaigns
    };
  }
}

module.exports = AnnouncementAnalyticsService;
