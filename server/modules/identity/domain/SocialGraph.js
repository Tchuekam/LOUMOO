/**
 * Social Graph Domain Models — Follows, Recommendations, and Blocks
 */

'use strict';

const { ValidationError } = require('../../../shared/errors/AppError');

const RELATIONSHIP_CONTEXTS = Object.freeze([
  'client',
  'partner',
  'colleague',
  'buyer',
  'mentor',
  'peer'
]);

class SocialFollow {
  constructor(data = {}) {
    this.id = data.id;
    this.followerId = data.follower_id || data.followerId;
    this.targetType = (data.target_type || data.targetType || 'user').toLowerCase();
    this.targetId = data.target_id || data.targetId;
    this.createdAt = data.created_at || data.createdAt || new Date();
  }

  static validate({ followerId, targetType, targetId }) {
    if (!followerId) throw new ValidationError('followerId is required.');
    if (!['user', 'seller'].includes(targetType)) {
      throw new ValidationError(`Invalid targetType '${targetType}'. Must be 'user' or 'seller'.`);
    }
    if (!targetId) throw new ValidationError('targetId is required.');
    if (targetType === 'user' && String(followerId) === String(targetId)) {
      throw new ValidationError('You cannot follow yourself.');
    }
  }
}

class SocialRecommendation {
  constructor(data = {}) {
    this.id = data.id;
    this.authorId = data.author_id || data.authorId;
    this.targetType = (data.target_type || data.targetType || 'seller').toLowerCase();
    this.targetId = data.target_id || data.targetId;
    this.note = String(data.note || '').trim();
    this.relationshipContext = (data.relationship_context || data.relationshipContext || 'client').toLowerCase();
    this.status = (data.status || 'PUBLISHED').toUpperCase();
    this.createdAt = data.created_at || data.createdAt || new Date();
    this.updatedAt = data.updated_at || data.updatedAt || new Date();
    this.author = data.author || null;
  }

  static validate({ authorId, targetType, targetId, note, relationshipContext }) {
    if (!authorId) throw new ValidationError('authorId is required.');
    if (!['user', 'seller'].includes(targetType)) {
      throw new ValidationError(`Invalid targetType '${targetType}'. Must be 'user' or 'seller'.`);
    }
    if (!targetId) throw new ValidationError('targetId is required.');
    if (targetType === 'user' && String(authorId) === String(targetId)) {
      throw new ValidationError('You cannot recommend yourself.');
    }
    if (!note || String(note).trim().length < 5) {
      throw new ValidationError('Recommendation note must be at least 5 characters long.');
    }
    if (relationshipContext && !RELATIONSHIP_CONTEXTS.includes(String(relationshipContext).toLowerCase())) {
      throw new ValidationError(`Invalid relationship context '${relationshipContext}'. Allowed: ${RELATIONSHIP_CONTEXTS.join(', ')}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      authorId: this.authorId,
      targetType: this.targetType,
      targetId: this.targetId,
      note: this.note,
      relationshipContext: this.relationshipContext,
      status: this.status,
      createdAt: this.createdAt,
      author: this.author
    };
  }
}

class SocialBlock {
  constructor(data = {}) {
    this.id = data.id;
    this.blockerId = data.blocker_id || data.blockerId;
    this.blockedId = data.blocked_id || data.blockedId;
    this.createdAt = data.created_at || data.createdAt || new Date();
  }

  static validate({ blockerId, blockedId }) {
    if (!blockerId || !blockedId) throw new ValidationError('Both blockerId and blockedId are required.');
    if (String(blockerId) === String(blockedId)) {
      throw new ValidationError('You cannot block yourself.');
    }
  }
}

module.exports = {
  SocialFollow,
  SocialRecommendation,
  SocialBlock,
  RELATIONSHIP_CONTEXTS
};