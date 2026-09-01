/**
 * LOUMOO Commercial Distribution Engine — Announcement Application Service
 */

'use strict';

const { SupabaseClient } = require('../../../infrastructure/database/SupabaseClient');
const { Announcement, ANNOUNCEMENT_STATUSES } = require('../domain/Announcement');
const { NotFoundError, AuthorizationError, ValidationError, ConflictError } = require('../../../shared/errors/AppError');
const logger = require('../../../shared/logging/logger');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class AnnouncementService {
  static async _verifyStoreAndOrgAccess(principal, storeId) {
    if (!storeId) return { store: null, organization: null };
    const adminDb = SupabaseClient.getAdmin();

    const { data: store, error } = await adminDb
      .from('stores')
      .select('id, owner_id, organization_id, name, slug, logo_url, is_verified, rating, verification_tier')
      .eq('id', storeId)
      .maybeSingle();

    if (error || !store) {
      throw new NotFoundError('Store', storeId);
    }

    if (store.owner_id === principal.id) {
      return { store, organization: null };
    }

    if (store.organization_id) {
      const { data: member } = await adminDb
        .from('organization_members')
        .select('role, permissions, status')
        .eq('organization_id', store.organization_id)
        .eq('user_id', principal.id)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (member) {
        return { store, organizationId: store.organization_id };
      }
    }

    throw new AuthorizationError('You do not have permission to publish announcements for this store.');
  }

  static async createAnnouncement(principal, input = {}) {
    Announcement.validate(input, input.status === ANNOUNCEMENT_STATUSES.PUBLISHED);
    const adminDb = SupabaseClient.getAdmin();

    const { store, organizationId } = await this._verifyStoreAndOrgAccess(principal, input.storeId);

    let attachedEntity = null;
    if (input.attachmentId && (input.attachmentType === 'PRODUCT' || input.attachmentType === 'SERVICE')) {
      const { data: listing } = await adminDb
        .from('listings')
        .select('id, title, base_price_minor, currency, status, store_id')
        .eq('id', input.attachmentId)
        .maybeSingle();

      if (!listing) {
        throw new NotFoundError('Listing', input.attachmentId);
      }
      attachedEntity = listing;
    }

    const slug = input.slug ? String(input.slug).toLowerCase().trim() : Announcement.slugify(input.title);

    let status = input.status || ANNOUNCEMENT_STATUSES.DRAFT;
    let publishedAt = null;
    let scheduledFor = input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null;
    let expiresAt = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;

    if (scheduledFor && (!input.status || input.status === ANNOUNCEMENT_STATUSES.SCHEDULED)) {
      status = ANNOUNCEMENT_STATUSES.SCHEDULED;
    } else if (status === ANNOUNCEMENT_STATUSES.PUBLISHED) {
      publishedAt = new Date().toISOString();
    }

    const announcementRow = {
      store_id: input.storeId || null,
      author_id: principal.id,
      organization_id: organizationId || input.organizationId || null,
      title: input.title.trim(),
      slug,
      type: (input.type || 'ANNOUNCEMENT').toUpperCase(),
      body: input.body ? input.body.trim() : '',
      media_urls: Array.isArray(input.mediaUrls) ? input.mediaUrls : [],
      status,
      highlights: Array.isArray(input.highlights) ? input.highlights : [],
      attachment_type: (input.attachmentType || 'NONE').toUpperCase(),
      attachment_id: input.attachmentId || null,
      attachment_payload: input.attachmentPayload || {},
      cta_type: (input.ctaType || 'VIEW_STORE').toUpperCase(),
      cta_label: input.ctaLabel ? input.ctaLabel.trim() : 'View Details',
      cta_url: input.ctaUrl ? Announcement.sanitizeUrl(input.ctaUrl) : null,
      scheduled_for: scheduledFor,
      published_at: publishedAt,
      expires_at: expiresAt,
      is_pinned: Boolean(input.isPinned),
      metadata: input.metadata || {}
    };

    const { data: created, error } = await adminDb
      .from('announcements')
      .insert(announcementRow)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ConflictError('An announcement with this slug already exists.');
      logger.error('[AnnouncementService] Failed to insert announcement', error);
      throw error;
    }

    const targetRow = {
      announcement_id: created.id,
      audience_scope: (input.audienceScope || 'EVERYONE').toUpperCase(),
      target_cities: Array.isArray(input.targetCities) ? input.targetCities : [],
      target_categories: Array.isArray(input.targetCategories) ? input.targetCategories : [],
      target_buyer_types: Array.isArray(input.targetBuyerTypes) ? input.targetBuyerTypes : [],
      custom_rules: input.customRules || {}
    };

    await adminDb.from('announcement_targets').insert(targetRow);

    await adminDb.from('announcement_metrics').insert({
      announcement_id: created.id,
      impressions: 0,
      views: 0,
      unique_viewers: 0,
      clicks: 0,
      cta_clicks: 0,
      shares: 0,
      conversions: 0
    });

    logger.info("[AnnouncementService] Created announcement " + created.id + " (" + created.slug + ") by user " + principal.id + " status=" + created.status);

    const model = new Announcement({
      ...created,
      store,
      target: targetRow,
      attachedEntity
    });

    return model.toAuthorJSON();
  }

  static async updateAnnouncement(principal, id, input = {}) {
    const adminDb = SupabaseClient.getAdmin();

    const { data: existing, error: findErr } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (findErr || !existing) throw new NotFoundError('Announcement', id);

    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    const updates = {};
    if (input.title !== undefined) {
      if (String(input.title).trim().length < 3) throw new ValidationError('Title must be at least 3 characters.');
      updates.title = String(input.title).trim();
    }
    if (input.type !== undefined) updates.type = String(input.type).toUpperCase();
    if (input.body !== undefined) updates.body = String(input.body).trim();
    if (input.mediaUrls !== undefined) updates.media_urls = Array.isArray(input.mediaUrls) ? input.mediaUrls : [];
    if (input.highlights !== undefined) updates.highlights = Array.isArray(input.highlights) ? input.highlights : [];
    if (input.attachmentType !== undefined) updates.attachment_type = String(input.attachmentType).toUpperCase();
    if (input.attachmentId !== undefined) updates.attachment_id = input.attachmentId;
    if (input.attachmentPayload !== undefined) updates.attachment_payload = input.attachmentPayload;
    if (input.ctaType !== undefined) updates.cta_type = String(input.ctaType).toUpperCase();
    if (input.ctaLabel !== undefined) updates.cta_label = String(input.ctaLabel).trim();
    if (input.ctaUrl !== undefined) updates.cta_url = Announcement.sanitizeUrl(input.ctaUrl);
    if (input.scheduledFor !== undefined) updates.scheduled_for = input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null;
    if (input.expiresAt !== undefined) updates.expires_at = input.expiresAt ? new Date(input.expiresAt).toISOString() : null;
    if (input.isPinned !== undefined) updates.is_pinned = Boolean(input.isPinned);
    if (input.metadata !== undefined) updates.metadata = input.metadata;
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateErr } = await adminDb
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (input.audienceScope || input.targetCities || input.targetCategories) {
      const targetUpdates = {};
      if (input.audienceScope) targetUpdates.audience_scope = input.audienceScope.toUpperCase();
      if (input.targetCities) targetUpdates.target_cities = input.targetCities;
      if (input.targetCategories) targetUpdates.target_categories = input.targetCategories;

      await adminDb.from('announcement_targets').update(targetUpdates).eq('announcement_id', id);
    }

    return new Announcement(updated).toAuthorJSON();
  }

  static async publishAnnouncement(principal, id) {
    const adminDb = SupabaseClient.getAdmin();

    const { data: existing } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Announcement', id);

    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    if (!Announcement.canTransition(existing.status, ANNOUNCEMENT_STATUSES.PUBLISHED)) {
      throw new ConflictError("Cannot publish an announcement currently in '" + existing.status + "' status.");
    }

    if (!existing.body || existing.body.length < 10) {
      throw new ValidationError('Announcement must have at least 10 characters in body before publishing.');
    }

    const { data: updated, error } = await adminDb
      .from('announcements')
      .update({
        status: ANNOUNCEMENT_STATUSES.PUBLISHED,
        published_at: new Date().toISOString(),
        scheduled_for: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    logger.info("[AnnouncementService] Published announcement " + id);
    return new Announcement(updated).toAuthorJSON();
  }

  static async scheduleAnnouncement(principal, id, scheduledFor, expiresAt = null) {
    if (!scheduledFor || new Date(scheduledFor).getTime() <= Date.now()) {
      throw new ValidationError('Scheduled publication time must be in the future.');
    }

    const adminDb = SupabaseClient.getAdmin();
    const { data: existing } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Announcement', id);

    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    const { data: updated, error } = await adminDb
      .from('announcements')
      .update({
        status: ANNOUNCEMENT_STATUSES.SCHEDULED,
        scheduled_for: new Date(scheduledFor).toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Announcement(updated).toAuthorJSON();
  }

  static async cancelSchedule(principal, id) {
    const adminDb = SupabaseClient.getAdmin();
    const { data: existing } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Announcement', id);
    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    const { data: updated, error } = await adminDb
      .from('announcements')
      .update({
        status: ANNOUNCEMENT_STATUSES.DRAFT,
        scheduled_for: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Announcement(updated).toAuthorJSON();
  }

  static async archiveAnnouncement(principal, id) {
    const adminDb = SupabaseClient.getAdmin();
    const { data: existing } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Announcement', id);
    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    const { data: updated, error } = await adminDb
      .from('announcements')
      .update({
        status: ANNOUNCEMENT_STATUSES.ARCHIVED,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return new Announcement(updated).toAuthorJSON();
  }

  static async deleteAnnouncement(principal, id) {
    const adminDb = SupabaseClient.getAdmin();
    const { data: existing } = await adminDb
      .from('announcements')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!existing) throw new NotFoundError('Announcement', id);
    if (existing.author_id !== principal.id) {
      await this._verifyStoreAndOrgAccess(principal, existing.store_id);
    }

    await adminDb
      .from('announcements')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    return { success: true, message: 'Announcement deleted successfully.' };
  }

  static async getAnnouncement(idOrSlug, principal = null) {
    const adminDb = SupabaseClient.getAdmin();

    let query = adminDb
      .from('announcements')
      .select(`
        *,
        store:stores(id, name, slug, logo_url, is_verified, rating, rating_count, verification_tier),
        author:profiles(id, first_name, last_name, avatar_url, city),
        target:announcement_targets(*),
        metrics:announcement_metrics(*)
      `)
      .is('deleted_at', null);

    if (UUID_REGEX.test(idOrSlug)) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug.toLowerCase());
    }

    const { data: announcement, error } = await query.maybeSingle();
    if (error || !announcement) throw new NotFoundError('Announcement', idOrSlug);

    if (announcement.status !== ANNOUNCEMENT_STATUSES.PUBLISHED) {
      if (!principal || (principal.id !== announcement.author_id && (!announcement.store || announcement.store.owner_id !== principal.id))) {
        throw new NotFoundError('Announcement', idOrSlug);
      }
    }

    let attachedEntity = null;
    if (announcement.attachment_id && (announcement.attachment_type === 'PRODUCT' || announcement.attachment_type === 'SERVICE')) {
      const { data: listing } = await adminDb
        .from('listings')
        .select('id, title, base_price_minor, currency, status, store_id')
        .eq('id', announcement.attachment_id)
        .maybeSingle();
      attachedEntity = listing;
    }

    const model = new Announcement({
      ...announcement,
      attachedEntity
    });

    const isAuthor = principal && (principal.id === announcement.author_id);
    return isAuthor ? model.toAuthorJSON() : model.toPublicJSON();
  }

  static async listSellerAnnouncements(principal, storeIdOrSlug, options = {}) {
    const adminDb = SupabaseClient.getAdmin();
    let storeQuery = adminDb.from('stores').select('id, owner_id, organization_id, name, slug');

    if (UUID_REGEX.test(storeIdOrSlug) || storeIdOrSlug.startsWith('store_')) {
      storeQuery = storeQuery.eq('id', storeIdOrSlug);
    } else {
      storeQuery = storeQuery.eq('slug', storeIdOrSlug.toLowerCase());
    }

    const { data: store } = await storeQuery.maybeSingle();
    if (!store) throw new NotFoundError('Store', storeIdOrSlug);

    await this._verifyStoreAndOrgAccess(principal, store.id);

    const limit = Math.min(options.limit || 20, 100);
    const offset = options.offset || 0;
    const status = options.status ? options.status.toUpperCase() : null;

    let query = adminDb
      .from('announcements')
      .select(`
        *,
        target:announcement_targets(*),
        metrics:announcement_metrics(*)
      `, { count: 'exact' })
      .eq('store_id', store.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: items, count, error } = await query;
    if (error) throw error;

    return {
      storeId: store.id,
      storeName: store.name,
      total: count || 0,
      limit,
      offset,
      announcements: (items || []).map(row => new Announcement(row).toAuthorJSON())
    };
  }
}

module.exports = AnnouncementService;
