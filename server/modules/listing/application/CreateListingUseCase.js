/**
 * LOUMOO — Create Listing Use Case
 * ---------------------------------------------------------------------------
 * The single entry point for bringing a listing into existence.
 *
 * Order of operations is the whole point of this file:
 *
 *     authorize  ->  validate  ->  insert listing  ->  attach staged media
 *                                        |                    |
 *                                        +-- on failure ------+--> roll back
 *
 * Authorization and validation both complete BEFORE anything is written and
 * long before any storage object is claimed. Media is uploaded separately and
 * only *attached* here, so an ineligible seller never gets as far as spending
 * bandwidth, and a failed insert never strands a file in the bucket.
 */

const crypto = require('crypto');
const ListingRepository = require('../infrastructure/ListingRepository');
const ListingValidationService = require('./ListingValidationService');
const ListingCompositionService = require('./ListingCompositionService');
const MediaStorageService = require('../../../infrastructure/storage/MediaStorageService');
const AnalyticsService = require('../../../infrastructure/analytics/AnalyticsService');
const BehavioralSignalService = require('../../adaptive/application/BehavioralSignalService');
const Listing = require('../domain/Listing');
const Store = require('../../store/domain/Store');
const logger = require('../../../shared/logging/logger');
const {
  AuthorizationError,
  ConflictError,
  ValidationError
} = require('../../../shared/errors/AppError');

class CreateListingUseCase {
  /**
   * @param {object} ctx
   * @param {object} ctx.principal     Authenticated principal.
   * @param {object} ctx.accountState  Derived account state.
   * @param {object} ctx.store         The seller's resolved store.
   * @param {object} ctx.input         Untrusted request body.
   * @param {string} [ctx.idempotencyKey]
   */
  static async execute({ principal, accountState, store, input = {}, idempotencyKey = null }) {
    // ── 1. AUTHORIZE (before any work at all) ──────────────────────────────
    if (!accountState.capabilities.canCreateListing) {
      throw new AuthorizationError(
        'Your seller account is not ready to publish listings yet.',
        {
          currentState: accountState.state,
          requiredCapability: 'canCreateListing',
          resolveAt: accountState.destination,
          resolveScreen: accountState.screen
        }
      );
    }

    if (store.status === 'SUSPENDED' || store.status === 'CLOSED') {
      throw new AuthorizationError(`This boutique is ${store.status.toLowerCase()} and cannot publish new listings.`);
    }

    // ── 1b. STORE VERTICAL & LISTING TYPE AUTHORIZATION ─────────────────
    // A boutique's category restricts what types of commercial listings it can publish.
    // e.g. An electronics shop cannot publish hotel accommodations, and a service boutique cannot publish transport routes.
    const rawListingType = (input && input.listingType) ? String(input.listingType).toUpperCase() : 'PHYSICAL_PRODUCT';
    const storeObj = (store instanceof Store) ? store : new Store(store);
    if (!storeObj.canCreateListingType(rawListingType)) {
      throw new AuthorizationError(
        `Your boutique (${storeObj.categoryId || 'General'}) is not authorized to publish ${rawListingType} listings. Allowed types: ${storeObj.getAllowedListingTypes().join(', ')}.`,
        {
          storeId: store.id,
          storeCategory: storeObj.categoryId,
          attemptedType: rawListingType,
          allowedTypes: storeObj.getAllowedListingTypes()
        }
      );
    }

    // ── 2. DUPLICATE SUBMISSION DEFENCE ────────────────────────────────────
    // A double-clicked "Create listing" produces two identical requests within
    // milliseconds. The fingerprint makes the second one return the first
    // one's listing instead of creating a twin.
    const fingerprint = buildFingerprint(store.id, principal.id, input, idempotencyKey);
    const existing = await ListingRepository.findByFingerprint(store.id, fingerprint);
    if (existing) {
      logger.info(`[CreateListing] Duplicate submission collapsed onto listing ${existing.id}`);
      return { listing: await this.hydrate(existing), duplicate: true };
    }

    // ── 3. VALIDATE ────────────────────────────────────────────────────────
    const { value, schema: categorySchema } = await ListingValidationService.validate(input, {
      forPublish: false,
      mediaCount: 0
    });

    // ── 4. RESOLVE STAGED MEDIA (ownership-checked, not yet attached) ──────
    const staged = value.uploadIds.length
      ? await MediaStorageService.loadOwnedStaged(value.uploadIds, principal.id)
      : [];

    for (const upload of staged) {
      if (upload.store_id && upload.store_id !== store.id) {
        throw new AuthorizationError('One of those images was uploaded for a different boutique.');
      }
    }

    // ── 5. INSERT THE LISTING ──────────────────────────────────────────────
    const listing = new Listing({
      store_id: store.id,
      seller_id: principal.id,
      listing_type: value.listingType,
      category_id: value.categoryId,
      title: value.title || 'Untitled draft listing',
      short_description: value.shortDescription || '',
      description: value.description || '',
      brand: value.brand || null,
      model: value.model || null,
      sku: value.sku || null,
      condition: value.condition,
      status: 'DRAFT',
      visibility: value.visibility,
      tags: value.tags,
      currency: value.currency,
      base_price_minor: value.basePriceMinor,
      sale_price_minor: value.salePriceMinor ?? null,
      compare_at_price_minor: value.compareAtPriceMinor ?? null,
      fulfillment_model: value.fulfillmentModel
    });

    let row;
    try {
      row = await ListingRepository.insert({
        id: listing.id,
        store_id: store.id,
        seller_id: principal.id,
        listing_type: value.listingType,
        category_id: value.categoryId,
        title: listing.title,
        slug: listing.slug,
        short_description: listing.shortDescription,
        description: listing.description,
        sku: listing.sku,
        brand: listing.brand,
        model: listing.model,
        condition: listing.condition,
        status: 'DRAFT',
        visibility: value.visibility,
        tags: value.tags,
        currency: value.currency,
        base_price_minor: value.basePriceMinor,
        sale_price_minor: value.salePriceMinor ?? null,
        compare_at_price_minor: value.compareAtPriceMinor ?? null,
        fulfillment_model: value.fulfillmentModel,
        creation_fingerprint: fingerprint,
        metadata: ListingCompositionService.mergeMetadata(
          { createdVia: 'web_publishing_studio' },
          value
        )
      });
    } catch (err) {
      // 23505 on the fingerprint index = the concurrent twin won the race.
      if (err.pgCode === '23505') {
        const winner = await ListingRepository.findByFingerprint(store.id, fingerprint);
        if (winner) {
          return { listing: await this.hydrate(winner), duplicate: true };
        }
      }
      // Nothing was persisted, so release the staged images rather than
      // leaving the seller's storage quota consumed by a listing that failed.
      await MediaStorageService.discard(staged.map(u => u.id), 'listing insert failed');
      throw err;
    }

    // Progressive personalization: what a seller lists is the strongest
    // signal about their catalog. Fire-and-forget — never blocks the listing.
    BehavioralSignalService.record(principal.id, {
      kind: 'listing',
      category: value.categoryId,
      resourceId: row.id
    }).catch(() => null);

    // ── 6. ATTACH ATTRIBUTES AND MEDIA ─────────────────────────────────────
    // From here the listing row exists; any failure must undo it rather than
    // leave a half-created listing the seller cannot see or fix.
    try {
      if (Object.keys(value.attributes).length > 0) {
        await ListingRepository.replaceAttributes(row.id, value.categoryId, value.attributes);
      }

      await ListingCompositionService.persistBlocks(row.id, value, { categorySchema });

      if (staged.length > 0) {
        await this._attachMedia(row.id, staged, principal.id);
      }
    } catch (err) {
      logger.error(`[CreateListing] Rolling back listing ${row.id}: ${err.message}`);
      await ListingRepository.hardDelete(row.id).catch(() => null);
      await MediaStorageService.discard(staged.map(u => u.id), 'listing finalisation failed');
      throw err;
    }

    AnalyticsService.track(principal.id, 'listing_draft_created', {
      listingId: row.id,
      storeId: store.id,
      listingType: value.listingType,
      categoryId: value.categoryId,
      imageCount: staged.length
    });

    logger.info(`[CreateListing] user=${principal.id} store=${store.id} listing=${row.id} created with ${staged.length} image(s)`);
    return { listing: await this.hydrate(row), duplicate: false };
  }

  /** Writes media rows and flips the staged uploads to ATTACHED atomically-enough. */
  static async _attachMedia(listingId, staged, uploadedBy) {
    const existing = await ListingRepository.listMedia(listingId);
    let order = existing.length;

    const rows = [];
    for (const upload of staged) {
      const signedUrl = await MediaStorageService.createSignedUrl(upload.storage_path);
      rows.push({
        listing_id: listingId,
        media_type: 'IMAGE',
        url: signedUrl || upload.public_url || upload.storage_path,
        thumbnail_url: signedUrl || upload.public_url || upload.storage_path,
        display_order: order,
        is_cover: order === 0,
        width: upload.width,
        height: upload.height,
        file_size_bytes: upload.file_size_bytes,
        mime_type: upload.mime_type,
        storage_bucket: upload.bucket,
        storage_path: upload.storage_path,
        upload_session_id: upload.id,
        checksum_sha256: upload.checksum_sha256,
        uploaded_by: uploadedBy
      });
      order++;
    }

    const inserted = await ListingRepository.insertMedia(rows);
    await MediaStorageService.markAttached(staged.map(u => u.id), listingId);
    return inserted;
  }

  /** Returns the owner-facing view with its media and attributes resolved. */
  static async hydrate(row) {
    const [media, attributes, blocks] = await Promise.all([
      ListingRepository.listMedia(row.id),
      ListingRepository.listAttributes(row.id),
      ListingCompositionService.loadBlocks(row)
    ]);

    const listing = new Listing(row);
    const json = listing.toOwnerJSON();
    return {
      ...json,
      attributes,
      // The structured blocks, in exactly the shape the publishing payload
      // uses, so opening a listing for editing round-trips without a mapper.
      pricingOptions: blocks.pricing,
      fulfillment: blocks.fulfillment,
      trust: blocks.trust,
      service: blocks.service,
      stock: blocks.inventory,
      variantOptions: blocks.variantOptions,
      variants: blocks.variants,
      metadata: row.metadata || {},
      media: media.map(m => ({
        id: m.id,
        url: m.url,
        thumbnailUrl: m.thumbnail_url,
        isCover: m.is_cover,
        displayOrder: m.display_order,
        width: m.width,
        height: m.height,
        mimeType: m.mime_type
      })),
      imageCount: media.length
    };
  }
}

/** Accidental double-submits arrive within seconds; 10 minutes is generous. */
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

/**
 * A stable hash of the semantically meaningful listing fields.
 *
 * When the client supplies an `Idempotency-Key` header that is used instead —
 * stricter, and it lets a client safely retry a request whose response was
 * lost to a network failure.
 *
 * Without such a header the hash includes a coarse time bucket, so a
 * double-clicked button collapses onto one listing while a seller who
 * genuinely wants to relist the same item tomorrow is not blocked forever.
 */
function buildFingerprint(storeId, sellerId, input, idempotencyKey, now = Date.now()) {
  if (idempotencyKey) {
    return crypto.createHash('sha256')
      .update(`${storeId}:${sellerId}:${idempotencyKey}`)
      .digest('hex')
      .slice(0, 64);
  }

  const material = JSON.stringify({
    storeId,
    sellerId,
    window: Math.floor(now / DEDUPE_WINDOW_MS),
    title: (input.title || '').trim().toLowerCase(),
    categoryId: input.categoryId,
    listingType: input.listingType,
    price: input.basePriceMinor,
    description: (input.description || '').trim().slice(0, 500)
  });

  return crypto.createHash('sha256').update(material).digest('hex').slice(0, 64);
}

module.exports = CreateListingUseCase;
module.exports.buildFingerprint = buildFingerprint;
