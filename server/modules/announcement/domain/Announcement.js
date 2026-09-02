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

/**
 * What each broadcast type actually needs.
 *
 * A promotion is not a shorter product listing and an event is not a longer
 * one — they answer different questions, so each type declares its own fields.
 * The studio renders its form from exactly this definition and the server
 * validates against it, so the two cannot drift.
 *
 * `key` names a slot inside `metadata`; everything here is type-specific by
 * construction, since the fields every broadcast shares (title, body, media,
 * highlights, CTA, audience, schedule) live in real columns.
 */
const TYPE_DEFINITIONS = Object.freeze({
  PROMOTION: {
    label: 'Promotion or flash deal',
    short: 'Deal',
    blurb: 'A price cut, a bundle or a limited-time offer.',
    icon: 'zap',
    defaultCta: 'BUY_NOW',
    needsWindow: true,
    fields: [
      { key: 'offer', label: 'The offer', type: 'text', required: true, maxLength: 120, placeholder: 'e.g. 50 000 XAF off, or 2 for 1' },
      { key: 'discountPercent', label: 'Discount', type: 'number', unit: '%', min: 1, max: 90 },
      { key: 'originalPriceMinor', label: 'Usual price', type: 'money' },
      { key: 'promoPriceMinor', label: 'Promotional price', type: 'money' },
      { key: 'promoCode', label: 'Promo code', type: 'text', maxLength: 32, placeholder: 'Optional' },
      { key: 'terms', label: 'Conditions', type: 'longtext', maxLength: 600, placeholder: 'In-store only, while stocks last…' }
    ]
  },
  PRODUCT_DROP: {
    label: 'New arrival',
    short: 'New arrival',
    blurb: 'Stock that just landed, or a product going on sale for the first time.',
    icon: 'package',
    defaultCta: 'VIEW_PRODUCT',
    needsWindow: false,
    fields: [
      { key: 'availableFrom', label: 'Available from', type: 'date' },
      { key: 'quantityNote', label: 'How much is available', type: 'text', maxLength: 120, placeholder: 'e.g. 12 units in Akwa' }
    ]
  },
  ANNOUNCEMENT: {
    label: 'Store announcement',
    short: 'Store news',
    blurb: 'Opening hours, a new branch, a temporary closure, a business update.',
    icon: 'megaphone',
    defaultCta: 'VIEW_STORE',
    needsWindow: false,
    fields: [
      { key: 'announcementKind', label: 'What kind of update', type: 'select', required: true, options: [
        { value: 'OPENING', label: 'Opening / new branch' },
        { value: 'HOURS', label: 'Opening hours change' },
        { value: 'CLOSURE', label: 'Temporary closure' },
        { value: 'RELOCATION', label: 'We have moved' },
        { value: 'UPDATE', label: 'General business update' }
      ] },
      { key: 'effectiveFrom', label: 'Takes effect', type: 'date' },
      { key: 'locationNote', label: 'Where', type: 'text', maxLength: 160, placeholder: 'Leave blank to use your boutique address' }
    ]
  },
  EVENT: {
    label: 'Event',
    short: 'Event',
    blurb: 'A launch, a sale day, a workshop, a community gathering.',
    icon: 'calendar',
    defaultCta: 'REGISTER',
    needsWindow: false,
    fields: [
      { key: 'eventName', label: 'Event name', type: 'text', required: true, maxLength: 160 },
      { key: 'eventDate', label: 'Date', type: 'date', required: true },
      { key: 'startTime', label: 'Starts', type: 'time' },
      { key: 'endTime', label: 'Ends', type: 'time' },
      { key: 'venue', label: 'Venue', type: 'text', required: true, maxLength: 200 },
      { key: 'organizer', label: 'Organiser', type: 'text', maxLength: 160, placeholder: 'Leave blank to use your boutique name' },
      { key: 'ticketInfo', label: 'Tickets / entry', type: 'text', maxLength: 160, placeholder: 'e.g. Free entry, or 5 000 XAF at the door' },
      { key: 'capacity', label: 'Capacity', type: 'number', min: 1, max: 100000 }
    ]
  },
  HIRING: {
    label: 'Job or opportunity',
    short: 'Hiring',
    blurb: 'A role you are recruiting for.',
    icon: 'briefcase',
    defaultCta: 'APPLY_NOW',
    needsWindow: false,
    fields: [
      { key: 'roleTitle', label: 'Role', type: 'text', required: true, maxLength: 160 },
      { key: 'employmentType', label: 'Type', type: 'select', required: true, options: [
        { value: 'FULL_TIME', label: 'Full time' },
        { value: 'PART_TIME', label: 'Part time' },
        { value: 'CONTRACT', label: 'Contract' },
        { value: 'INTERNSHIP', label: 'Internship' },
        { value: 'FREELANCE', label: 'Freelance' }
      ] },
      { key: 'workMode', label: 'Where', type: 'select', options: [
        { value: 'ONSITE', label: 'On site' },
        { value: 'HYBRID', label: 'Hybrid' },
        { value: 'REMOTE', label: 'Remote' }
      ] },
      { key: 'requirements', label: 'Requirements', type: 'longtext', required: true, maxLength: 2000 },
      { key: 'compensation', label: 'Compensation', type: 'text', maxLength: 120, placeholder: 'e.g. 650 000 – 900 000 XAF / month' },
      { key: 'deadline', label: 'Application deadline', type: 'date', required: true },
      { key: 'applyMethod', label: 'How to apply', type: 'text', required: true, maxLength: 240, placeholder: 'Email, phone, or "apply through LOUMOO"' }
    ]
  },
  ALERT: {
    label: 'Tender or urgent notice',
    short: 'Tender',
    blurb: 'A call for suppliers, a request for quotes, or something buyers must know now.',
    icon: 'alert-triangle',
    defaultCta: 'LEARN_MORE',
    needsWindow: false,
    fields: [
      { key: 'reference', label: 'Reference', type: 'text', maxLength: 64, placeholder: 'e.g. PAD-2026-089' },
      { key: 'requirements', label: 'Scope and requirements', type: 'longtext', required: true, maxLength: 4000 },
      { key: 'budget', label: 'Budget', type: 'text', maxLength: 120, placeholder: 'e.g. 14 500 000 XAF' },
      { key: 'deadline', label: 'Submission deadline', type: 'date', required: true },
      { key: 'submissionMethod', label: 'How to submit', type: 'text', required: true, maxLength: 240 },
      { key: 'contact', label: 'Contact', type: 'text', maxLength: 160 }
    ]
  },
  SERVICE_AVAILABLE: {
    label: 'Service availability',
    short: 'Service',
    blurb: 'A service you are taking bookings for right now.',
    icon: 'wrench',
    defaultCta: 'BOOK_SERVICE',
    needsWindow: true,
    fields: [
      { key: 'serviceName', label: 'Service', type: 'text', required: true, maxLength: 160 },
      { key: 'coverage', label: 'Areas covered', type: 'text', maxLength: 200, placeholder: 'e.g. Douala, Yaoundé' },
      { key: 'availabilityNote', label: 'When', type: 'text', maxLength: 160, placeholder: 'e.g. Mon–Sat, 08:00–18:00' },
      { key: 'startingPriceMinor', label: 'Starting price', type: 'money' }
    ]
  }
});

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ONLY = /^([01]\d|2[0-3]):[0-5]\d$/;

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

  /**
   * The machine-readable broadcast catalogue. The publishing studio renders
   * its type chooser and its type-specific fields from this response, so a new
   * broadcast type needs no frontend change.
   */
  static describe() {
    return {
      types: Object.entries(TYPE_DEFINITIONS).map(([type, def]) => ({
        type,
        label: def.label,
        short: def.short,
        blurb: def.blurb,
        icon: def.icon,
        defaultCta: def.defaultCta,
        needsWindow: def.needsWindow,
        fields: def.fields
      })),
      ctaTypes: CTA_TYPES,
      audienceScopes: AUDIENCE_SCOPES,
      attachmentTypes: ATTACHMENT_TYPES,
      limits: { titleMax: 255, bodyMax: 8000, highlights: 6, mediaUrls: 8 }
    };
  }

  static typeDefinition(type) {
    return TYPE_DEFINITIONS[String(type || 'ANNOUNCEMENT').toUpperCase()] || null;
  }

  /**
   * Validates the type-specific `metadata` block.
   *
   * Collects every problem rather than throwing on the first, so the studio can
   * mark all the offending fields at once, and rejects keys the type does not
   * define — the same rule listings follow, for the same reason: silently
   * accepted junk becomes permanent junk.
   */
  static validateTypeFields(type, metadata = {}, isPublishing = false) {
    const def = Announcement.typeDefinition(type);
    if (!def) return [];

    const errors = [];
    const known = new Set(def.fields.map(f => f.key));

    for (const key of Object.keys(metadata || {})) {
      if (!known.has(key)) {
        errors.push({
          field: `metadata.${key}`,
          message: `"${key}" is not a field of a ${def.label.toLowerCase()} broadcast.`
        });
      }
    }

    for (const field of def.fields) {
      const raw = metadata ? metadata[field.key] : undefined;
      const empty = raw === undefined || raw === null || String(raw).trim() === '';

      if (empty) {
        // Required fields only block publication; a draft may be incomplete.
        if (field.required && isPublishing) {
          errors.push({ field: `metadata.${field.key}`, message: `${field.label} is required to publish this broadcast.` });
        }
        continue;
      }

      switch (field.type) {
        case 'number':
        case 'money': {
          const num = Number(raw);
          if (!Number.isFinite(num)) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label} must be a number.` });
            break;
          }
          if (field.min !== undefined && num < field.min) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label} cannot be below ${field.min}.` });
          }
          if (field.max !== undefined && num > field.max) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label} cannot exceed ${field.max}.` });
          }
          break;
        }
        case 'date':
          if (!DATE_ONLY.test(String(raw))) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label} must be a date like 2026-10-28.` });
          }
          break;
        case 'time':
          if (!TIME_ONLY.test(String(raw))) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label} must be a 24-hour time like 09:00.` });
          }
          break;
        case 'select': {
          const allowed = (field.options || []).map(o => o.value);
          if (allowed.length && !allowed.includes(String(raw))) {
            errors.push({ field: `metadata.${field.key}`, message: `${field.label}: choose one of ${allowed.join(', ')}.` });
          }
          break;
        }
        default:
          if (field.maxLength && String(raw).length > field.maxLength) {
            errors.push({
              field: `metadata.${field.key}`,
              message: `${field.label} cannot exceed ${field.maxLength} characters.`
            });
          }
      }
    }

    // Cross-field rules that only make sense per type.
    const upper = String(type || '').toUpperCase();

    if (upper === 'PROMOTION') {
      const original = Number(metadata.originalPriceMinor);
      const promo = Number(metadata.promoPriceMinor);
      if (Number.isFinite(original) && Number.isFinite(promo) && promo >= original) {
        errors.push({
          field: 'metadata.promoPriceMinor',
          message: 'The promotional price must be lower than the usual price.'
        });
      }
    }

    if (upper === 'EVENT' && metadata.startTime && metadata.endTime
        && TIME_ONLY.test(metadata.startTime) && TIME_ONLY.test(metadata.endTime)
        && metadata.endTime <= metadata.startTime) {
      errors.push({ field: 'metadata.endTime', message: 'The event ends at or before it starts.' });
    }

    return errors;
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

    if (Array.isArray(payload.highlights) && payload.highlights.length > 6) {
      throw new ValidationError('A broadcast can carry at most 6 highlights.');
    }
    if (Array.isArray(payload.mediaUrls) && payload.mediaUrls.length > 8) {
      throw new ValidationError('A broadcast can carry at most 8 images.');
    }

    // A time-limited offer that never ends is not time-limited. Only enforced
    // at publication, so a draft can be filled in any order.
    const def = Announcement.typeDefinition(payload.type);
    if (isPublishing && def && def.needsWindow && !payload.expiresAt) {
      throw new ValidationError(
        'A time-limited broadcast needs an end date, so buyers know when the offer closes.',
        { fields: [{ field: 'expiresAt', message: 'Set when this offer stops running.' }] }
      );
    }

    const typeErrors = Announcement.validateTypeFields(payload.type, payload.metadata, isPublishing);
    if (typeErrors.length > 0) {
      throw new ValidationError('Some broadcast details need your attention.', { fields: typeErrors });
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
  TYPE_DEFINITIONS,
  ANNOUNCEMENT_TYPES,
  ANNOUNCEMENT_STATUSES,
  ATTACHMENT_TYPES,
  CTA_TYPES,
  AUDIENCE_SCOPES
};
