/**
 * LOUMOO Commercial Distribution Engine — Announcement Domain Model
 */

'use strict';

const { ValidationError } = require('../../../shared/errors/AppError');

const ANNOUNCEMENT_TYPES = Object.freeze([
  'ANNOUNCEMENT',
  'PROMOTION',
  'PRODUCT_DROP',
  'SERVICE_AVAILABLE',
  'EVENT',
  'HIRING',
  'ALERT'
]);

const ANNOUNCEMENT_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED'
});

const ATTACHMENT_TYPES = Object.freeze([
  'PRODUCT',
  'SERVICE',
  'STORE',
  'EVENT',
  'PROMOTION',
  'NONE'
]);

const CTA_TYPES = Object.freeze([
  'VIEW_PRODUCT',
  'BUY_NOW',
  'CONTACT_SELLER',
  'VIEW_STORE',
  'BOOK_SERVICE',
  'FOLLOW_SELLER',
  'LEARN_MORE',
  'REGISTER',
  'APPLY_NOW'
]);

const AUDIENCE_SCOPES = Object.freeze([
  'EVERYONE',
  'FOLLOWERS',
  'PREVIOUS_BUYERS',
  'TARGETED'
]);

const VALID_STATUS_TRANSITIONS = Object.freeze({
  [ANNOUNCEMENT_STATUSES.DRAFT]: [ANNOUNCEMENT_STATUSES.SCHEDULED, ANNOUNCEMENT_STATUSES.PUBLISHED, ANNOUNCEMENT_STATUSES.ARCHIVED],
  [ANNOUNCEMENT_STATUSES.SCHEDULED]: [ANNOUNCEMENT_STATUSES.DRAFT, ANNOUNCEMENT_STATUSES.PUBLISHED, ANNOUNCEMENT_STATUSES.ARCHIVED],
  [ANNOUNCEMENT_STATUSES.PUBLISHED]: [ANNOUNCEMENT_STATUSES.EXPIRED, ANNOUNCEMENT_STATUSES.ARCHIVED],
  [ANNOUNCEMENT_STATUSES.EXPIRED]: [ANNOUNCEMENT_STATUSES.ARCHIVED, ANNOUNCEMENT_STATUSES.PUBLISHED],
  [ANNOUNCEMENT_STATUSES.ARCHIVED]: [ANNOUNCEMENT_STATUSES.DRAFT]
});

class Announcement {
  constructor(data = {}) {
    this.id = data.id;
    this.storeId = data.store_id || data.storeId || null;
    this.authorId = data.author_id || data.authorId;
    this.organizationId = data.organization_id || data.organizationId || null;
    this.title = String(data.title || '').trim();
    this.slug = String(data.slug || '').trim().toLowerCase();
    this.type = (data.type || 'ANNOUNCEMENT').toUpperCase();
    this.body = String(data.body || '').trim();
    this.mediaUrls = Array.isArray(data.media_urls || data.mediaUrls) ? (data.media_urls || data.mediaUrls) : [];
    this.status = (data.status || ANNOUNCEMENT_STATUSES.DRAFT).toUpperCase();
    this.highlights = Array.isArray(data.highlights) ? data.highlights : [];
    this.attachmentType = (data.attachment_type || data.attachmentType || 'NONE').toUpperCase();
    this.attachmentId = data.attachment_id || data.attachmentId || null;
    this.attachmentPayload = data.attachment_payload || data.attachmentPayload || {};
    this.ctaType = (data.cta_type || data.ctaType || 'VIEW_STORE').toUpperCase();
    this.ctaLabel = String(data.cta_label || data.ctaLabel || 'View Details').trim();
    this.ctaUrl = data.cta_url || data.ctaUrl || null;
    this.scheduledFor = data.scheduled_for || data.scheduledFor || null;
    this.publishedAt = data.published_at || data.publishedAt || null;
    this.expiresAt = data.expires_at || data.expiresAt || null;
    this.isPinned = Boolean(data.is_pinned ?? data.isPinned ?? false);
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at || data.createdAt || new Date();
    this.updatedAt = data.updated_at || data.updatedAt || new Date();
    this.deletedAt = data.deleted_at || data.deletedAt || null;

    this.store = data.store || null;
    this.author = data.author || null;
    this.organization = data.organization || null;
    this.target = data.target || null;
    this.metrics = data.metrics || null;
    this.attachedEntity = data.attachedEntity || null;
  }

  static get TYPES() {
    return ANNOUNCEMENT_TYPES;
  }

  static get STATUSES() {
    return ANNOUNCEMENT_STATUSES;
  }

  static get ATTACHMENT_TYPES() {
    return ATTACHMENT_TYPES;
  }

  static get CTA_TYPES() {
    return CTA_TYPES;
  }

  static get AUDIENCE_SCOPES() {
    return AUDIENCE_SCOPES;
  }

  static canTransition(currentStatus, targetStatus) {
    if (currentStatus === targetStatus) return true;
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  static slugify(title) {
    if (!title) return 'ann-' + Date.now().toString(36);
    const base = String(title)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    const entropy = Math.random().toString(36).slice(2, 6);
    return base + '-' + entropy;
  }

  static sanitizeUrl(rawUrl) {
    if (!rawUrl) return null;
    const trimmed = String(rawUrl).trim();
    if (trimmed.startsWith('/') || trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      return trimmed;
    }
    throw new ValidationError("Invalid CTA URL '" + trimmed + "'. URLs must start with https://, /, mailto:, or tel:");
  }

  static validate(payload = {}, isPublishing = false) {
    if (!payload.title || String(payload.title).trim().length < 3) {
      throw new ValidationError('Announcement title must be at least 3 characters.');
    }
    if (String(payload.title).trim().length > 255) {
      throw new ValidationError('Announcement title cannot exceed 255 characters.');
    }

    if (payload.type && !ANNOUNCEMENT_TYPES.includes(String(payload.type).toUpperCase())) {
      throw new ValidationError("Invalid announcement type '" + payload.type + "'. Allowed: " + ANNOUNCEMENT_TYPES.join(', '));
    }

    if (payload.attachmentType && !ATTACHMENT_TYPES.includes(String(payload.attachmentType).toUpperCase())) {
      throw new ValidationError("Invalid attachment type '" + payload.attachmentType + "'. Allowed: " + ATTACHMENT_TYPES.join(', '));
    }

    if (payload.ctaType && !CTA_TYPES.includes(String(payload.ctaType).toUpperCase())) {
      throw new ValidationError("Invalid CTA type '" + payload.ctaType + "'. Allowed: " + CTA_TYPES.join(', '));
    }

    if (payload.ctaUrl) {
      Announcement.sanitizeUrl(payload.ctaUrl);
    }

    if (isPublishing) {
      if (!payload.body || String(payload.body).trim().length < 10) {
        throw new ValidationError('Announcement body must be at least 10 characters before publishing.');
      }
    }

    if (payload.scheduledFor && payload.expiresAt) {
      const scheduled = new Date(payload.scheduledFor).getTime();
      const expires = new Date(payload.expiresAt).getTime();
      if (expires <= scheduled) {
        throw new ValidationError('Expiration time must be strictly after the scheduled publication time.');
      }
    }
  }

  toPublicJSON() {
    return {
      id: this.id,
      storeId: this.storeId,
      authorId: this.authorId,
      organizationId: this.organizationId,
      title: this.title,
      slug: this.slug,
      type: this.type,
      body: this.body,
      mediaUrls: this.mediaUrls,
      status: this.status,
      highlights: this.highlights,
      attachmentType: this.attachmentType,
      attachmentId: this.attachmentId,
      attachmentPayload: this.attachmentPayload,
      ctaType: this.ctaType,
      ctaLabel: this.ctaLabel,
      ctaUrl: this.ctaUrl,
      scheduledFor: this.scheduledFor,
      publishedAt: this.publishedAt,
      expiresAt: this.expiresAt,
      isPinned: this.isPinned,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      store: this.store,
      author: this.author,
      organization: this.organization,
      attachedEntity: this.attachedEntity,
      metrics: this.metrics ? {
        views: this.metrics.views || 0,
        clicks: this.metrics.clicks || 0,
        ctaClicks: this.metrics.cta_clicks || 0,
        shares: this.metrics.shares || 0
      } : null
    };
  }

  toAuthorJSON() {
    return {
      ...this.toPublicJSON(),
      metadata: this.metadata,
      target: this.target,
      metrics: this.metrics
    };
  }
}

module.exports = {
  Announcement,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_STATUSES,
  ATTACHMENT_TYPES,
  CTA_TYPES,
  AUDIENCE_SCOPES
};
