/**
 * LOUMOO Unit Tests — Announcement Domain Model & Commercial Distribution
 */

require('../setup');
const assert = require('assert');
const { Announcement, ANNOUNCEMENT_TYPES, ANNOUNCEMENT_STATUSES, ATTACHMENT_TYPES, CTA_TYPES } = require('../../server/modules/announcement/domain/Announcement');
const { ValidationError } = require('../../server/shared/errors/AppError');

async function run() {
  console.log('  Testing Announcement Domain Models & State Transitions...');

  // 1. Validation: Title too short
  assert.throws(() => {
    Announcement.validate({ title: 'Hi' });
  }, ValidationError);

  // 2. Validation: Invalid type
  assert.throws(() => {
    Announcement.validate({ title: 'Grand Opening Flash Sale', type: 'INVALID_TYPE' });
  }, ValidationError);

  // 3. Validation: Invalid attachment type
  assert.throws(() => {
    Announcement.validate({ title: 'New Arrival Sneaker Drop', type: 'PRODUCT_DROP', attachmentType: 'CAR_DEAL' });
  }, ValidationError);

  // 4. Validation: Invalid CTA URL (malicious protocol)
  assert.throws(() => {
    Announcement.validate({ title: 'Click Here for Gift', ctaUrl: 'javascript:alert(1)' });
  }, ValidationError);

  // 5. Valid Sanitized CTA URLs
  assert.strictEqual(Announcement.sanitizeUrl('https://loumoo.com/deals'), 'https://loumoo.com/deals');
  assert.strictEqual(Announcement.sanitizeUrl('/p/macbook-air-m2'), '/p/macbook-air-m2');
  assert.strictEqual(Announcement.sanitizeUrl('tel:+237699000000'), 'tel:+237699000000');

  // 6. Timing Validation: Expiration before Scheduled Date
  assert.throws(() => {
    Announcement.validate({
      title: 'Flash Sale Weekend',
      scheduledFor: '2026-10-10T12:00:00Z',
      expiresAt: '2026-10-09T12:00:00Z'
    });
  }, ValidationError);

  // 7. State Transitions
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.DRAFT, ANNOUNCEMENT_STATUSES.PUBLISHED), true);
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.DRAFT, ANNOUNCEMENT_STATUSES.SCHEDULED), true);
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.SCHEDULED, ANNOUNCEMENT_STATUSES.DRAFT), true);
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.PUBLISHED, ANNOUNCEMENT_STATUSES.EXPIRED), true);
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.EXPIRED, ANNOUNCEMENT_STATUSES.PUBLISHED), true);
  assert.strictEqual(Announcement.canTransition(ANNOUNCEMENT_STATUSES.PUBLISHED, ANNOUNCEMENT_STATUSES.DRAFT), false);

  // 8. Slug generation
  const slug = Announcement.slugify('Mega Promo Rentrée Scolaire 2026!');
  assert(slug.startsWith('mega-promo-rentree-scolaire-2026-'));

  console.log('    ✓ Announcement domain unit tests passed.');
}

if (require.main === module) {
  run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
  });
}

module.exports = { run };
