/**
 * Identity & Commercial Module — Organization & Team Domain Model
 */

'use strict';

const { ValidationError } = require('../../../shared/errors/AppError');

const ORG_TYPES = Object.freeze([
  'COMPANY',
  'AGENCY',
  'INSTITUTE',
  'COMMUNITY',
  'ENTERPRISE',
  'COOPERATIVE',
  'BRAND'
]);

const ORG_ROLES = Object.freeze({
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  EDITOR: 'EDITOR',
  SUPPORT: 'SUPPORT',
  MEMBER: 'MEMBER'
});

const ROLE_PERMISSIONS = Object.freeze({
  [ORG_ROLES.OWNER]: ['*'],
  [ORG_ROLES.ADMIN]: [
    'org.view', 'org.manage', 'org.manage_members',
    'store.view', 'store.manage', 'store.manage_products', 'store.manage_orders'
  ],
  [ORG_ROLES.MANAGER]: [
    'org.view', 'store.view', 'store.manage_products', 'store.manage_orders'
  ],
  [ORG_ROLES.STAFF]: [
    'org.view', 'store.view', 'store.manage_orders'
  ],
  [ORG_ROLES.EDITOR]: [
    'org.view', 'store.view', 'store.manage_products'
  ],
  [ORG_ROLES.SUPPORT]: [
    'org.view', 'store.view', 'chat.reply', 'store.customer_support'
  ],
  [ORG_ROLES.MEMBER]: [
    'org.view'
  ]
});

class Organization {
  constructor(data = {}) {
    this.id = data.id;
    this.ownerId = data.owner_id || data.ownerId;
    this.name = String(data.name || '').trim();
    this.slug = String(data.slug || '').trim().toLowerCase();
    this.legalName = data.legal_name || data.legalName || null;
    this.orgType = (data.org_type || data.orgType || 'COMPANY').toUpperCase();
    this.logoUrl = data.logo_url || data.logoUrl || null;
    this.coverUrl = data.cover_url || data.coverUrl || null;
    this.description = data.description || null;
    this.email = data.email || null;
    this.phoneNumber = data.phone_number || data.phoneNumber || null;
    this.websiteUrl = data.website_url || data.websiteUrl || null;
    this.city = data.city || 'Douala';
    this.country = data.country || 'Cameroon';
    this.status = (data.status || 'ACTIVE').toUpperCase();
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at || data.createdAt || new Date();
    this.updatedAt = data.updated_at || data.updatedAt || new Date();
  }

  static get TYPES() {
    return ORG_TYPES;
  }

  static get ROLES() {
    return ORG_ROLES;
  }

  static get PERMISSIONS() {
    return ROLE_PERMISSIONS;
  }

  static slugify(name) {
    if (!name) return `org-${Date.now().toString(36)}`;
    return String(name)
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
  }

  static validate(payload = {}) {
    if (!payload.name || String(payload.name).trim().length < 2) {
      throw new ValidationError('Organization name must be at least 2 characters.');
    }
    if (payload.orgType && !ORG_TYPES.includes(String(payload.orgType).toUpperCase())) {
      throw new ValidationError(`Invalid organization type '${payload.orgType}'. Allowed: ${ORG_TYPES.join(', ')}`);
    }
  }

  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      orgType: this.orgType,
      logoUrl: this.logoUrl,
      coverUrl: this.coverUrl,
      description: this.description,
      city: this.city,
      country: this.country,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  toOwnerJSON() {
    return {
      ...this.toPublicJSON(),
      ownerId: this.ownerId,
      legalName: this.legalName,
      email: this.email,
      phoneNumber: this.phoneNumber,
      websiteUrl: this.websiteUrl,
      metadata: this.metadata,
      updatedAt: this.updatedAt
    };
  }
}

class OrganizationMember {
  constructor(data = {}) {
    this.id = data.id;
    this.organizationId = data.organization_id || data.organizationId;
    this.userId = data.user_id || data.userId;
    this.role = (data.role || ORG_ROLES.MEMBER).toUpperCase();
    this.permissions = Array.isArray(data.permissions) ? data.permissions : (ROLE_PERMISSIONS[this.role] || ['org.view']);
    this.status = (data.status || 'ACTIVE').toUpperCase();
    this.invitedBy = data.invited_by || data.invitedBy || null;
    this.createdAt = data.created_at || data.createdAt || new Date();
    this.updatedAt = data.updated_at || data.updatedAt || new Date();
    this.user = data.user || null;
  }

  hasPermission(permission) {
    if (this.role === ORG_ROLES.OWNER) return true;
    if (this.permissions.includes('*')) return true;
    return this.permissions.includes(permission);
  }

  toJSON() {
    return {
      id: this.id,
      organizationId: this.organizationId,
      userId: this.userId,
      role: this.role,
      permissions: this.permissions,
      status: this.status,
      createdAt: this.createdAt,
      user: this.user
    };
  }
}

module.exports = {
  Organization,
  OrganizationMember,
  ORG_TYPES,
  ORG_ROLES,
  ROLE_PERMISSIONS
};