/**
 * LOUMOO — Listing Publication State Machine
 * ---------------------------------------------------------------------------
 * Publishing is a server decision, not a screen the user reaches.
 *
 * Before a listing goes live the server re-checks EVERYTHING: the seller is
 * still eligible, the store is still active, the listing still satisfies the
 * strict publish schema, its category attributes are complete, and it has at
 * least one real image. A listing that was valid when the draft was saved but
 * has since been emptied out cannot slip through.
 */

const ListingRepository = require('../infrastructure/ListingRepository');
const ListingValidationService = require('./ListingValidationService');
const CreateListingUseCase = require('./CreateListingUseCase');
const ListingCompositionService = require('./ListingCompositionService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const OutboxService = require('../../../infrastructure/events/OutboxService');
const CacheService = require('../../../infrastructure/cache/CacheService');
const logger = require('../../../shared/logging/logger');
const {
  AuthorizationError,
  ConflictError,
  ValidationError
} = require('../../../shared/errors/AppError');

/** Which transitions the state machine permits. Anything else is a 409. */
const ALLOWED_TRANSITIONS = Object.freeze({
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PREVIEW: ['PUBLISHED', 'ARCHIVED'],
  READY: ['PUBLISHED', 'ARCHIVED'],
  PENDING_REVIEW: ['PUBLISHED', 'REJECTED', 'ARCHIVED'],
  PUBLISHED: ['PAUSED', 'ARCHIVED'],
  PAUSED: ['PUBLISHED', 'ARCHIVED'],
  REJECTED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: []
});

class ListingPublishUseCase {
  static assertTransition(from, to) {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new ConflictError(
        `A ${from.toLowerCase()} listing cannot become ${to.toLowerCase()}.`,
        { from, to, allowed }
      );
    }
  }

  /**
   * @param {object} ctx
   * @param {object} ctx.listingRow
   * @param {object} ctx.principal
   * @param {object} ctx.accountState
   * @param {object} ctx.store
   */
  static async publish({ listingRow, principal, accountState, store }) {
    // 1. Re-check eligibility at the moment of publication, not at draft time.
    if (!accountState.capabilities.canPublishListing) {
      throw new AuthorizationError(
        'Your seller account cannot publish listings right now.',
        {
          currentState: accountState.state,
          resolveAt: accountState.destination,
          resolveScreen: accountState.screen
        }
      );
    }
    if (store && store.status !== 'ACTIVE') {
      throw new ConflictError(
        'Activate your boutique before publishing listings.',
        { storeStatus: store.status, resolveScreen: 'storeOnboarding' }
      );
    }

    this.assertTransition(listingRow.status, 'PUBLISHED');

    // 2. Re-validate the complete listing against the strict publish rules.
    //    Everything is re-read from storage: a draft that was valid when it
    //    was saved but has since been emptied out must not slip through.
    const [attributes, media, blocks] = await Promise.all([
      ListingRepository.listAttributes(listingRow.id),
      ListingRepository.listMedia(listingRow.id),
      ListingCompositionService.loadBlocks(listingRow)
    ]);

    await ListingValidationService.validate(
      ListingCompositionService.toValidationPayload(listingRow, blocks, attributes),
      { forPublish: true, mediaCount: media.length }
    );

    const updated = await ListingRepository.update(listingRow.id, {
      status: 'PUBLISHED',
      published_at: listingRow.published_at || new Date().toISOString(),
      rejection_reason: null
    });

    await CacheService.delete(`catalog:detail:${updated.id}`, 'catalog').catch(() => null);
    await CacheService.delPattern('catalog:list:*', 'catalog').catch(() => null);
    await CacheService.delPattern('list:*', 'catalog').catch(() => null);

    await OutboxService.enqueue({
      eventType: 'listing.published',
      aggregateType: 'listing',
      aggregateId: updated.id,
      payload: { listingId: updated.id, storeId: updated.store_id, sellerId: updated.seller_id }
    }).catch(err => logger.warn(`[Publish] Outbox enqueue skipped: ${err.message}`));

    AnalyticsService.track(principal.id, 'listing_published', {
      listingId: updated.id,
      storeId: updated.store_id,
      categoryId: updated.category_id,
      imageCount: media.length
    });

    logger.info(`[Publish] user=${principal.id} listing=${updated.id} PUBLISHED`);
    return CreateListingUseCase.hydrate(updated);
  }

  static async pause({ listingRow, principal }) {
    this.assertTransition(listingRow.status, 'PAUSED');
    const updated = await ListingRepository.update(listingRow.id, { status: 'PAUSED' });
    await CacheService.delete(`catalog:detail:${updated.id}`, 'catalog').catch(() => null);
    await CacheService.delPattern('catalog:list:*', 'catalog').catch(() => null);
    await CacheService.delPattern('list:*', 'catalog').catch(() => null);
    AnalyticsService.track(principal.id, 'listing_paused', { listingId: updated.id });
    logger.info(`[Publish] user=${principal.id} listing=${updated.id} PAUSED`);
    return CreateListingUseCase.hydrate(updated);
  }

  static async archive({ listingRow, principal }) {
    this.assertTransition(listingRow.status, 'ARCHIVED');
    const updated = await ListingRepository.softDelete(listingRow.id);
    await CacheService.delete(`catalog:detail:${updated.id}`, 'catalog').catch(() => null);
    await CacheService.delPattern('catalog:list:*', 'catalog').catch(() => null);
    await CacheService.delPattern('list:*', 'catalog').catch(() => null);
    AnalyticsService.track(principal.id, 'listing_archived', { listingId: updated.id });
    logger.info(`[Publish] user=${principal.id} listing=${updated.id} ARCHIVED`);
    return { id: updated.id, status: updated.status, archivedAt: updated.deleted_at };
  }
}

module.exports = ListingPublishUseCase;
module.exports.ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS;
